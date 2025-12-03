// Voice Feedback Gimmick JS

// Version for quick test/diagnostic
const VF_VERSION = '2025-10-05-test';

document.addEventListener('DOMContentLoaded', function() {
  console.log(`[voice-feedback] loaded version ${VF_VERSION}`);
  // Create a small visible version badge for quick UI verification
  try {
    const verBadge = document.createElement('div');
    verBadge.id = 'voice-feedback-version';
    verBadge.textContent = `VF ${VF_VERSION}`;
    verBadge.style.position = 'fixed';
    verBadge.style.right = '12px';
    verBadge.style.bottom = '12px';
    verBadge.style.padding = '6px 8px';
    verBadge.style.background = 'rgba(0,0,0,0.6)';
    verBadge.style.color = '#fff';
    verBadge.style.fontSize = '12px';
    verBadge.style.borderRadius = '8px';
    verBadge.style.zIndex = '10000';
    verBadge.style.pointerEvents = 'none';
    document.body.appendChild(verBadge);
  } catch (e) {
    // If DOM not available (e.g. non-browser runtime), ignore
  }
  // Respect any site baseurl set by the server build
  const siteBaseurl = window.siteBaseurl || (window.location && window.location.pathname && window.location.pathname.startsWith('/') ? window.location.pathname.replace(/\/$/, '') : '');

  // vosk-browser WASM integration
  let voskReady = false;
  let voskModel = null;
  let voskRecognizer = null;
  // Web Speech API (live transcription) fallback
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let speechRecognition = null;

  // Load vosk-browser model (requires vosk-browser library from CDN or local)
  async function loadVosk() {
    if (!window.Vosk || !window.Vosk.createModel) {
      console.warn('[vosk-browser] Library not loaded. Will use Web Speech API fallback.');
      return;
    }
    
    const modelUrl = `${siteBaseurl}/assets/wasm/vosk-model-small-en-us-0.15.tar.gz`;
    try {
      console.log('[vosk-browser] Loading model from:', modelUrl);
      voskModel = await window.Vosk.createModel(modelUrl);
      voskRecognizer = new voskModel.KaldiRecognizer(16000);
      
      // Set up event listeners for recognition results
      voskRecognizer.on("result", (message) => {
        console.log('[vosk-browser] Result:', message.result);
      });
      voskRecognizer.on("partialresult", (message) => {
        console.log('[vosk-browser] Partial result:', message.result);
      });
      
      voskReady = true;
      console.log('[vosk-browser] Model loaded and ready');
    } catch (e) {
      console.error('[vosk-browser] Initialization failed:', e);
      voskReady = false;
    }
  }
  // Attempt to load vosk-browser on page load
  loadVosk();
  const avatar = document.getElementById('voice-feedback-avatar');
  const micImg = document.getElementById('mic-avatar-img');
  let recording = false;
  let recordTimeout;
  let mediaRecorder;
  let audioChunks = [];

  // Add ARIA attributes for accessibility
  if (avatar) {
    avatar.setAttribute('role', 'button');
    avatar.setAttribute('aria-label', 'Activate voice feedback. Press Enter or Space to record your feedback.');
    avatar.setAttribute('tabindex', '0');
    avatar.setAttribute('aria-pressed', 'false');
    
    // Create live region for status announcements
    const statusRegion = document.createElement('div');
    statusRegion.id = 'voice-feedback-status';
    statusRegion.className = 'sr-only';
    statusRegion.setAttribute('role', 'status');
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.setAttribute('aria-atomic', 'true');
    statusRegion.style.position = 'absolute';
    statusRegion.style.width = '1px';
    statusRegion.style.height = '1px';
    statusRegion.style.padding = '0';
    statusRegion.style.margin = '-1px';
    statusRegion.style.overflow = 'hidden';
    statusRegion.style.clip = 'rect(0, 0, 0, 0)';
    statusRegion.style.whiteSpace = 'nowrap';
    statusRegion.style.border = '0';
    avatar.parentNode.insertBefore(statusRegion, avatar.nextSibling);
  }

  // Helper function to update status region
  function updateStatus(message) {
    const statusRegion = document.getElementById('voice-feedback-status');
    if (statusRegion) {
      statusRegion.textContent = message;
    }
  }

  // Create feedback modal
  const feedbackModal = document.createElement('div');
  feedbackModal.id = 'voice-feedback-modal';
  feedbackModal.style.display = 'none';
  feedbackModal.style.position = 'fixed';
  feedbackModal.style.left = '50%';
  feedbackModal.style.top = '50%';
  feedbackModal.style.transform = 'translate(-50%, -50%)';
  feedbackModal.style.background = '#fff';
  feedbackModal.style.borderRadius = '16px';
  feedbackModal.style.boxShadow = '0 4px 24px rgba(44,204,64,0.15)';
  feedbackModal.style.padding = '32px';
  feedbackModal.style.zIndex = '9999';
  feedbackModal.innerHTML = '<h3>Thank you for your feedback!</h3><div id="transcribed-text"></div><button id="close-modal">Close</button>';
  document.body.appendChild(feedbackModal);
  feedbackModal.querySelector('#close-modal').onclick = function() {
    feedbackModal.style.display = 'none';
  };

  // Play action prompt on hover
  avatar.addEventListener('mouseenter', function() {
    if (!recording) {
      updateStatus('Hover detected. Click to start recording.');
      fetch(`${siteBaseurl}/feedback_prompts/action_prompt.txt`)
        .then(r => r.text())
        .then(text => speakPrompt(text))
        .catch(err => console.error('[voice-feedback] Failed to load action prompt:', err));
      avatar.classList.add('hover');
    }
  });
  avatar.addEventListener('mouseleave', function() {
    avatar.classList.remove('hover');
  });

  // Keyboard activation (Enter or Space)
  avatar.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleRecording();
    }
  });

  // Visual focus indicator
  avatar.addEventListener('focus', function() {
    avatar.style.outline = '3px solid #0066cc';
    avatar.style.outlineOffset = '4px';
  });
  
  avatar.addEventListener('blur', function() {
    avatar.style.outline = 'none';
  });

  // Activate recording on click or long press
  avatar.addEventListener('mousedown', function() {
    recordTimeout = setTimeout(() => toggleRecording(), 1000);
  });
  avatar.addEventListener('mouseup', function() {
    clearTimeout(recordTimeout);
  });
  avatar.addEventListener('click', function(e) {
    e.preventDefault();
    toggleRecording();
  });

  function toggleRecording() {
    if (!recording) {
      startRecording();
    } else {
      stopRecording();
    }
  }

  function speakPrompt(text) {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utter);
    }
  }

  function startRecording() {
    if (recording) return;
    recording = true;
    avatar.classList.add('active');
    avatar.setAttribute('aria-pressed', 'true');
    avatar.setAttribute('aria-label', 'Recording in progress. Press Enter or Space to stop.');
    updateStatus('Recording started. Speak now. Press the button again to stop.');
    
    fetch(`${siteBaseurl}/feedback_prompts/request_prompt.txt`)
      .then(r => r.text())
      .then(text => speakPrompt(text))
      .catch(err => console.error('[voice-feedback] Failed to load request prompt:', err));
    // Integrate MediaRecorder API
    // If vosk-browser isn't available but SpeechRecognition is, prefer live recognition (no blob needed)
    if (!voskReady && SpeechRecognition) {
      try {
        speechRecognition = new SpeechRecognition();
        speechRecognition.lang = 'en-US';
        speechRecognition.interimResults = false;
        speechRecognition.maxAlternatives = 1;
        speechRecognition.onresult = (ev) => {
          const txt = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : '';
          showFeedbackModal(txt ? `Transcribed: ${txt}` : 'No speech detected.');
        };
        speechRecognition.onerror = (err) => {
          console.error('SpeechRecognition error', err);
          showFeedbackModal('Transcription failed.');
        };
        speechRecognition.onend = () => {
          recording = false;
          avatar.classList.remove('active');
        };
        speechRecognition.start();
        // Stop recognition automatically after 60s
        setTimeout(() => { if (speechRecognition) { speechRecognition.stop(); } }, 60000);
        return;
      } catch (e) {
        console.warn('SpeechRecognition failed to start', e);
        // fall through to MediaRecorder
      }
    }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => {
          audioChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          if (voskReady && voskRecognizer) {
            transcribeAudioVosk(audioBlob);
          } else {
            showFeedbackModal('Your voice note has been recorded. Transcription coming soon.');
          }
        };
        mediaRecorder.start();
        setTimeout(() => {
          if (recording) stopRecording();
        }, 60000);
      }).catch(err => {
        showFeedbackModal('Microphone access denied or unavailable.');
      });
    } else {
      showFeedbackModal('Audio recording not supported in this browser.');
    }
  }

  function stopRecording() {
    if (!recording) return;
    recording = false;
    avatar.classList.remove('active');
    avatar.setAttribute('aria-pressed', 'false');
    avatar.setAttribute('aria-label', 'Activate voice feedback. Press Enter or Space to record your feedback.');
    updateStatus('Recording stopped. Processing your feedback...');
    
    if (speechRecognition) {
      try { speechRecognition.stop(); } catch(e){}
      speechRecognition = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    // Feedback modal will be shown by mediaRecorder.onstop
  }

  function showFeedbackModal(text) {
    // Update modal with ARIA attributes
    feedbackModal.setAttribute('role', 'dialog');
    feedbackModal.setAttribute('aria-modal', 'true');
    feedbackModal.setAttribute('aria-labelledby', 'feedback-modal-title');
    feedbackModal.setAttribute('aria-describedby', 'transcribed-text');
    
    const h3 = feedbackModal.querySelector('h3');
    if (h3) h3.id = 'feedback-modal-title';
    
    feedbackModal.style.display = 'block';
    feedbackModal.querySelector('#transcribed-text').textContent = text;
    
    // Store previous focus
    const previousFocus = document.activeElement;
    
    // Focus the close button
    const closeBtn = feedbackModal.querySelector('#close-modal');
    if (closeBtn) {
      closeBtn.setAttribute('aria-label', 'Close feedback dialog');
      setTimeout(() => closeBtn.focus(), 100);
    }
    
    // Enhanced close function with focus restoration
    const closeModal = function() {
      feedbackModal.style.display = 'none';
      updateStatus('Feedback dialog closed.');
      // Restore focus to avatar
      if (previousFocus && previousFocus.focus) {
        previousFocus.focus();
      }
    };
    
    // Update close button handler
    closeBtn.onclick = closeModal;
    
    // Close on Escape key
    const escapeHandler = function(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Close on backdrop click
    feedbackModal.onclick = function(e) {
      if (e.target === feedbackModal) {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    
    updateStatus('Feedback received. Dialog opened with transcription results.');
  }

  // Transcribe audio using vosk-browser
  async function transcribeAudioVosk(audioBlob) {
    try {
      // Convert audio blob to AudioBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('[vosk-browser] Processing audio buffer, sample rate:', audioBuffer.sampleRate);
      
      // Create a recognizer for one-shot transcription with the appropriate sample rate
      const recognizer = new voskModel.KaldiRecognizer(audioBuffer.sampleRate);
      
      // Set up result collection
      let finalText = '';
      let resultReceived = false;
      
      recognizer.on("result", (message) => {
        console.log('[vosk-browser] Got final result:', message.result);
        if (message.result && message.result.text) {
          finalText = message.result.text;
        }
        resultReceived = true;
      });
      
      recognizer.on("partialresult", (message) => {
        console.log('[vosk-browser] Partial:', message.result);
      });
      
      // Feed the audio buffer to the recognizer
      recognizer.acceptWaveform(audioBuffer);
      
      // Retrieve the final result
      recognizer.retrieveFinalResult();
      
      // Wait a moment for the result event to fire
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clean up
      recognizer.remove();
      
      showFeedbackModal(finalText ? `Transcribed: ${finalText}` : 'No speech detected.');
    } catch (err) {
      showFeedbackModal('Transcription failed.');
      console.error('[vosk-browser] Transcription error:', err);
    }
  }
});
