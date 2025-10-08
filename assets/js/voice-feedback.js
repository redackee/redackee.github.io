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

  // Vosklet WASM integration scaffolding
  let voskletReady = false;
  let voskletRecognizer = null;
  // Web Speech API (live transcription) fallback
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let speechRecognition = null;

  // Load Vosklet model (instructions: place Vosklet assets in assets/wasm/)
  async function loadVosklet() {
    if (window.Vosklet) {
      const modelPath = `${siteBaseurl}/assets/wasm/vosk-model-small-en-us-0.15`;
      try {
        voskletRecognizer = new window.Vosklet.Recognizer({modelPath});
        await voskletRecognizer.init();
        voskletReady = true;
      } catch (e) {
        console.error('Vosklet initialization failed:', e);
        voskletReady = false;
      }
    } else {
      console.warn('Vosklet WASM not loaded. Please include Vosklet JS and model files.');
    }
  }
  // Attempt to load Vosklet on page load
  loadVosklet();
  const avatar = document.getElementById('voice-feedback-avatar');
  const micImg = document.getElementById('mic-avatar-img');
  let recording = false;
  let recordTimeout;
  let mediaRecorder;
  let audioChunks = [];

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
    fetch(`${siteBaseurl}/feedback_prompts/action_prompt.txt`)
      .then(r => r.text())
      .then(text => speakPrompt(text));
    avatar.classList.add('hover');
  });
  avatar.addEventListener('mouseleave', function() {
    avatar.classList.remove('hover');
  });

  // Activate recording on click or long press
  avatar.addEventListener('mousedown', function() {
    recordTimeout = setTimeout(() => startRecording(), 1000);
  });
  avatar.addEventListener('mouseup', function() {
    clearTimeout(recordTimeout);
    if (!recording) return;
    stopRecording();
  });
  avatar.addEventListener('click', function() {
    startRecording();
  });

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
    fetch(`${siteBaseurl}/feedback_prompts/request_prompt.txt`)
      .then(r => r.text())
      .then(text => speakPrompt(text));
    // Integrate MediaRecorder API
    // If Vosklet isn't available but SpeechRecognition is, prefer live recognition (no blob needed)
    if (!voskletReady && SpeechRecognition) {
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
          if (voskletReady && voskletRecognizer) {
            transcribeAudioVosklet(audioBlob);
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
    feedbackModal.style.display = 'block';
    feedbackModal.querySelector('#transcribed-text').textContent = text;
  }

  // Transcribe audio using Vosklet
  async function transcribeAudioVosklet(audioBlob) {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const result = await voskletRecognizer.recognize(arrayBuffer);
      showFeedbackModal(result.text ? `Transcribed: ${result.text}` : 'No speech detected.');
    } catch (err) {
      showFeedbackModal('Transcription failed.');
      console.error(err);
    }
  }
});
