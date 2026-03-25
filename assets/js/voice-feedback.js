const VF_VERSION = '2026-03-25-a';

document.addEventListener('DOMContentLoaded', function() {
  const core = window.VoiceFeedbackCore;
  const avatar = document.getElementById('voice-feedback-avatar');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!core || !avatar) {
    return;
  }

  const siteBaseurl = core.resolveSiteBaseurl(window);
  const assetUrl = function(relativePath) {
    return core.buildAssetUrl(siteBaseurl, relativePath);
  };

  let voskModel = null;
  let voskReady = false;
  let voskLoading = false;
  let mediaRecorder = null;
  let mediaStream = null;
  let speechRecognition = null;
  let audioChunks = [];
  let recording = false;
  let holdTimeout = null;
  let holdTriggered = false;
  let stopTimeout = null;
  const promptCache = new Map();

  const ui = createUi();

  createVersionBadge();
  applyIdleState('Voice feedback is preparing.');
  loadVosk();

  avatar.addEventListener('mouseenter', function() {
    if (!recording) {
      avatar.classList.add('hover');
      updateStatus('Voice feedback ready. Click or hold to record.');
      playPrompt('action_prompt.txt');
    }
  });

  avatar.addEventListener('mouseleave', function() {
    avatar.classList.remove('hover');
  });

  avatar.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleRecording();
    }
  });

  avatar.addEventListener('mousedown', beginHold);
  avatar.addEventListener('touchstart', beginHold, { passive: true });
  avatar.addEventListener('mouseup', cancelHold);
  avatar.addEventListener('mouseleave', cancelHold);
  avatar.addEventListener('touchend', cancelHold);
  avatar.addEventListener('touchcancel', cancelHold);
  avatar.addEventListener('click', function(event) {
    event.preventDefault();

    if (holdTriggered) {
      holdTriggered = false;
      return;
    }

    toggleRecording();
  });

  function createVersionBadge() {
    const badge = document.createElement('div');
    badge.id = 'voice-feedback-version';
    badge.textContent = `VF ${VF_VERSION}`;
    document.body.appendChild(badge);
  }

  function createUi() {
    avatar.setAttribute('role', 'button');
    avatar.setAttribute('tabindex', '0');
    avatar.setAttribute('aria-pressed', 'false');
    avatar.setAttribute('aria-label', 'Activate voice feedback. Press Enter or Space to record your feedback.');

    const statusRegion = document.createElement('div');
    statusRegion.id = 'voice-feedback-status';
    statusRegion.className = 'sr-only';
    statusRegion.setAttribute('role', 'status');
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.setAttribute('aria-atomic', 'true');

    const hint = document.createElement('p');
    hint.id = 'voice-feedback-hint';
    hint.className = 'voice-feedback-hint';

    avatar.insertAdjacentElement('afterend', hint);
    avatar.insertAdjacentElement('afterend', statusRegion);

    const modal = document.createElement('div');
    modal.id = 'voice-feedback-modal';
    modal.className = 'voice-feedback-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'voice-feedback-modal-title');
    modal.setAttribute('aria-describedby', 'voice-feedback-modal-message');
    modal.hidden = true;
    modal.innerHTML = [
      '<div class="voice-feedback-modal__panel" role="document">',
      '<h3 id="voice-feedback-modal-title"></h3>',
      '<p id="voice-feedback-modal-message" class="voice-feedback-modal__message"></p>',
      '<p class="voice-feedback-modal__label">Transcript</p>',
      '<div id="transcribed-text" class="voice-feedback-modal__transcript"></div>',
      '<p id="voice-feedback-modal-privacy" class="voice-feedback-modal__meta"></p>',
      '<p id="voice-feedback-modal-conduct" class="voice-feedback-modal__meta"></p>',
      '<button type="button" id="close-modal" class="voice-feedback-modal__close">Close</button>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);

    const closeButton = modal.querySelector('#close-modal');
    closeButton.addEventListener('click', function() {
      closeModal();
    });

    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });

    return {
      closeButton,
      conduct: modal.querySelector('#voice-feedback-modal-conduct'),
      hint,
      message: modal.querySelector('#voice-feedback-modal-message'),
      modal,
      privacy: modal.querySelector('#voice-feedback-modal-privacy'),
      statusRegion,
      title: modal.querySelector('#voice-feedback-modal-title'),
      transcript: modal.querySelector('#transcribed-text')
    };
  }

  function beginHold() {
    clearTimeout(holdTimeout);
    holdTriggered = false;
    holdTimeout = setTimeout(function() {
      holdTriggered = true;
      toggleRecording();
    }, 1000);
  }

  function cancelHold() {
    clearTimeout(holdTimeout);
  }

  function updateStatus(message) {
    ui.statusRegion.textContent = message;
    ui.hint.textContent = message;
  }

  function setAvatarState(state, label) {
    avatar.dataset.state = state;
    avatar.setAttribute('aria-busy', state === 'loading' || state === 'processing' ? 'true' : 'false');
    updateStatus(label);
  }

  function applyIdleState(message) {
    avatar.classList.remove('active');
    avatar.setAttribute('aria-pressed', 'false');
    avatar.setAttribute('aria-label', 'Activate voice feedback. Press Enter or Space to record your feedback.');
    setAvatarState('idle', message);
  }

  function updateReadyMessage() {
    const mode = core.pickTranscriptionMode({
      voskLoading,
      voskReady,
      webSpeechSupported: Boolean(SpeechRecognition)
    });

    if (mode === 'vosk') {
      applyIdleState('Voice feedback ready. Audio stays in this browser session.');
      return;
    }

    if (mode === 'webspeech') {
      applyIdleState('Voice feedback ready. Browser speech recognition is available now.');
      return;
    }

    if (mode === 'vosk-loading') {
      setAvatarState('loading', 'Offline speech model loading. Browser speech features are limited here.');
      return;
    }

    applyIdleState('Voice transcription is not available in this browser yet.');
  }

  async function loadPrompt(fileName) {
    if (promptCache.has(fileName)) {
      return promptCache.get(fileName);
    }

    const response = await fetch(assetUrl(`feedback_prompts/${fileName}`));
    const text = core.normalizePromptText(await response.text());
    promptCache.set(fileName, text);
    return text;
  }

  async function playPrompt(fileName) {
    try {
      const text = await loadPrompt(fileName);
      speakPrompt(text);
    } catch (error) {
      console.error('[voice-feedback] Failed to load prompt', fileName, error);
    }
  }

  function speakPrompt(text) {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const content = core.normalizePromptText(text);
    if (!content) {
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(content));
  }

  async function loadVosk() {
    if (voskLoading || voskReady) {
      return;
    }

    if (!window.Vosk || !window.Vosk.createModel) {
      updateReadyMessage();
      return;
    }

    voskLoading = true;
    setAvatarState('loading', 'Loading the offline speech model for voice feedback.');

    try {
      voskModel = await window.Vosk.createModel(assetUrl('assets/wasm/vosk-model-small-en-us-0.15.tar.gz'));
      voskReady = true;
      console.log('[voice-feedback] Vosk model ready');
    } catch (error) {
      console.error('[voice-feedback] Vosk model failed to load', error);
    } finally {
      voskLoading = false;
      updateReadyMessage();
    }
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
      return;
    }

    startRecording();
  }

  function startRecording() {
    const mode = core.pickTranscriptionMode({
      voskLoading,
      voskReady,
      webSpeechSupported: Boolean(SpeechRecognition)
    });

    if (mode === 'vosk-loading') {
      openModal(core.buildModalContent({ state: 'model-loading' }));
      return;
    }

    if (mode === 'unsupported') {
      openModal(core.buildModalContent({ state: 'unsupported' }));
      return;
    }

    recording = true;
    audioChunks = [];
    avatar.classList.add('active');
    avatar.setAttribute('aria-pressed', 'true');
    avatar.setAttribute('aria-label', 'Recording in progress. Press Enter or Space to stop.');
    setAvatarState('recording', 'Recording started. Speak now, then activate again to stop.');
    playPrompt('request_prompt.txt');

    if (mode === 'webspeech') {
      startWebSpeechRecognition();
      return;
    }

    startMediaRecording();
  }

  function startWebSpeechRecognition() {
    let receivedTranscript = false;

    try {
      speechRecognition = new SpeechRecognition();
      speechRecognition.lang = 'en-US';
      speechRecognition.interimResults = false;
      speechRecognition.maxAlternatives = 1;
      speechRecognition.onresult = function(event) {
        receivedTranscript = true;
        const transcript = core.normalizePromptText(
          event.results && event.results[0] && event.results[0][0] ? event.results[0][0].transcript : ''
        );
        finishRecognition();
        openModal(core.buildModalContent({
          state: transcript ? 'success' : 'no-speech',
          transcript: transcript
        }));
      };
      speechRecognition.onerror = function(event) {
        finishRecognition();
        openModal(core.buildModalContent({ state: core.mapRecognitionError(event.error) }));
      };
      speechRecognition.onend = function() {
        if (!receivedTranscript && recording) {
          finishRecognition();
          openModal(core.buildModalContent({ state: 'no-speech' }));
        }
      };
      speechRecognition.start();
      stopTimeout = window.setTimeout(function() {
        if (speechRecognition) {
          speechRecognition.stop();
        }
      }, 60000);
    } catch (error) {
      console.error('[voice-feedback] Web Speech failed to start', error);
      finishRecognition();
      openModal(core.buildModalContent({ state: 'error' }));
    }
  }

  async function startMediaRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      finishRecognition();
      openModal(core.buildModalContent({ state: 'unsupported' }));
      return;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable = function(event) {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      mediaRecorder.onstop = async function() {
        const blobType = mediaRecorder && mediaRecorder.mimeType ? mediaRecorder.mimeType : 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: blobType });
        clearTimeout(stopTimeout);
        stopMediaStream();
        mediaRecorder = null;
        setAvatarState('processing', 'Processing your voice feedback in the browser.');

        try {
          const transcript = await transcribeAudioVosk(audioBlob);
          finishRecognition();
          openModal(core.buildModalContent({
            state: transcript ? 'success' : 'no-speech',
            transcript: transcript
          }));
        } catch (error) {
          console.error('[voice-feedback] Vosk transcription failed', error);
          finishRecognition();
          openModal(core.buildModalContent({ state: 'error' }));
        }
      };
      mediaRecorder.start();
      stopTimeout = window.setTimeout(function() {
        stopRecording();
      }, 60000);
    } catch (error) {
      console.error('[voice-feedback] Microphone request failed', error);
      finishRecognition();
      openModal(core.buildModalContent({ state: 'permission-denied' }));
    }
  }

  function stopRecording() {
    if (!recording) {
      return;
    }

    recording = false;
    avatar.setAttribute('aria-pressed', 'false');
    avatar.setAttribute('aria-label', 'Activate voice feedback. Press Enter or Space to record your feedback.');

    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch (error) {
        console.warn('[voice-feedback] Unable to stop Web Speech cleanly', error);
      }
      return;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      return;
    }

    finishRecognition();
  }

  function finishRecognition() {
    clearTimeout(stopTimeout);
    recording = false;
    speechRecognition = null;
    audioChunks = [];
    stopMediaStream();
    applyIdleState('Voice feedback ready. Audio stays in this browser session.');
  }

  function stopMediaStream() {
    if (!mediaStream) {
      return;
    }

    mediaStream.getTracks().forEach(function(track) {
      track.stop();
    });
    mediaStream = null;
  }

  function openModal(content) {
    const model = content || core.buildModalContent({ state: 'error' });
    ui.title.textContent = model.title;
    ui.message.textContent = model.message;
    ui.transcript.textContent = model.transcript;
    ui.privacy.textContent = model.privacy;
    ui.conduct.textContent = model.conduct;
    ui.modal.hidden = false;
    ui.closeButton.focus();
    updateStatus(`${model.title}. Dialog opened.`);
  }

  function closeModal() {
    ui.modal.hidden = true;
    avatar.focus();
    updateReadyMessage();
  }

  async function transcribeAudioVosk(audioBlob) {
    if (!voskModel) {
      throw new Error('Vosk model is not loaded');
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error('AudioContext unavailable');
    }

    const audioContext = new AudioContextCtor();

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      const recognizer = new voskModel.KaldiRecognizer(audioBuffer.sampleRate);
      const resultPromise = waitForRecognizerResult(recognizer, 4000);
      recognizer.acceptWaveform(audioBuffer);
      recognizer.retrieveFinalResult();
      const transcript = await resultPromise;
      recognizer.remove();
      return transcript;
    } finally {
      await audioContext.close();
    }
  }

  function waitForRecognizerResult(recognizer, timeoutMs) {
    return new Promise(function(resolve, reject) {
      let settled = false;
      let lastPartial = '';
      const timeout = window.setTimeout(function() {
        if (settled) {
          return;
        }

        settled = true;
        if (lastPartial) {
          resolve(lastPartial);
          return;
        }

        reject(new Error('Timed out waiting for recognizer result'));
      }, timeoutMs);

      recognizer.on('partialresult', function(message) {
        lastPartial = core.extractRecognizerText(message);
      });

      recognizer.on('result', function(message) {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeout);
        resolve(core.extractRecognizerText(message) || lastPartial);
      });
    });
  }
});
