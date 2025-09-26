// Minimal browser-friendly Vosklet shim for local development.
// This file is NOT a real Vosklet build. It exposes `loadVosklet()` which returns
// a small object with `Recognizer` implementing the same surface API used by
// `voice-feedback.js` so you can test the UI flow when a real browser build
// isn't available.

(function(global){
  async function loadVosklet(moduleArg) {
    console.info('Mock Vosklet.browser.js loadVosklet called (development shim).');

    class MockRecognizer {
      constructor(opts) {
        this.modelPath = opts && opts.modelPath;
        this._inited = false;
      }
      async init() {
        this._inited = true;
        // Simulate async initialization delay
        await new Promise(r => setTimeout(r, 200));
        console.info('Mock Vosklet Recognizer initialized (no real WASM).');
      }
      async recognize(arrayBuffer) {
        // This mock cannot transcribe binary audio. Return a placeholder message.
        console.warn('MockRecognizer.recognize called — returning placeholder text. Replace with real Vosklet build for real transcription.');
        return { text: '<<mock transcription>>' };
      }
      async delete(){ /* no-op */ }
    }

    return {
      Recognizer: MockRecognizer,
      // keep compatibility
      createRecognizer: (a,b)=> new MockRecognizer({modelPath:a}),
    };
  }

  // expose as global loader
  if (typeof window !== 'undefined') window.loadVosklet = loadVosklet;
  if (typeof module !== 'undefined' && module.exports) module.exports = loadVosklet;
})(this);
