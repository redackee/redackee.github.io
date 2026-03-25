(function(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.VoiceFeedbackCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function resolveSiteBaseurl(win) {
    if (win && typeof win.siteBaseurl === 'string') {
      return win.siteBaseurl.replace(/\/$/, '');
    }

    return '';
  }

  function buildAssetUrl(baseurl, relativePath) {
    const safeBaseurl = typeof baseurl === 'string' ? baseurl.replace(/\/$/, '') : '';
    const safePath = String(relativePath || '').replace(/^\/+/, '');

    return safeBaseurl ? `${safeBaseurl}/${safePath}` : `/${safePath}`;
  }

  function normalizePromptText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function extractRecognizerText(message) {
    if (!message || !message.result) {
      return '';
    }

    if (typeof message.result.text === 'string') {
      return normalizePromptText(message.result.text);
    }

    if (typeof message.result.partial === 'string') {
      return normalizePromptText(message.result.partial);
    }

    return '';
  }

  function pickTranscriptionMode(options) {
    const settings = options || {};

    if (settings.voskReady) {
      return 'vosk';
    }

    if (settings.webSpeechSupported) {
      return 'webspeech';
    }

    if (settings.voskLoading) {
      return 'vosk-loading';
    }

    return 'unsupported';
  }

  function buildModalContent(options) {
    const settings = options || {};
    const transcript = normalizePromptText(settings.transcript);
    const state = settings.state || (transcript ? 'success' : 'empty');
    const content = {
      title: 'Voice feedback',
      message: 'Your feedback is processed in this browser session.',
      transcript: transcript || 'No transcript available.',
      privacy: 'This static site processes voice input in the browser. It does not save feedback, IP addresses, or timestamps to a server.',
      conduct: 'Please keep feedback respectful, specific, and constructive.'
    };

    if (state === 'success') {
      content.title = 'Thanks for the feedback';
      content.message = 'Here is the text captured from your voice note.';
      return content;
    }

    if (state === 'no-speech') {
      content.title = 'No speech detected';
      content.message = 'Try again in a quieter space and speak clearly after recording starts.';
      return content;
    }

    if (state === 'model-loading') {
      content.title = 'Voice model still loading';
      content.message = 'The offline speech model is still preparing. Please wait a moment and try again.';
      content.transcript = 'Offline transcription is not ready yet.';
      return content;
    }

    if (state === 'unsupported') {
      content.title = 'Voice transcription unavailable';
      content.message = 'This browser does not currently expose a supported speech-recognition path for this site.';
      content.transcript = 'Try Chromium for Web Speech support, or retry once the local Vosk model has loaded.';
      return content;
    }

    if (state === 'permission-denied') {
      content.title = 'Microphone access denied';
      content.message = 'Microphone permission is required before the site can capture voice feedback.';
      content.transcript = 'Allow microphone access in the browser and try again.';
      return content;
    }

    if (state === 'error') {
      content.title = 'Transcription failed';
      content.message = 'The site captured audio, but it could not produce a transcript from this attempt.';
      content.transcript = transcript || 'Try again after the model finishes loading, or use a supported browser speech engine.';
      return content;
    }

    return content;
  }

  function mapRecognitionError(errorType) {
    const errorKey = String(errorType || '').toLowerCase();

    if (errorKey === 'not-allowed' || errorKey === 'service-not-allowed') {
      return 'permission-denied';
    }

    if (errorKey === 'no-speech') {
      return 'no-speech';
    }

    return 'error';
  }

  return {
    buildAssetUrl,
    buildModalContent,
    extractRecognizerText,
    mapRecognitionError,
    normalizePromptText,
    pickTranscriptionMode,
    resolveSiteBaseurl
  };
}));