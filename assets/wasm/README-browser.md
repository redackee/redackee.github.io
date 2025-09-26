Browser-friendly Vosklet build (recommended)

This repository includes a small mock `Vosklet.browser.js` for local development. For real in-browser speech-to-text you should use a browser-friendly Vosklet build compiled without WASI and with proper browser imports.

Where to get a browser build

1. Official sources

   - Check the Vosk project releases: https://github.com/alphacep/vosk-browser or https://alphacephei.com/vosk
   - Look for a build named similar to `Vosklet.browser.js` + `Vosklet.wasm` or instructions for "WebAssembly (browser)" builds.

2. Build it yourself with Emscripten

   - Clone the Vosklet sources and compile with emscripten using emcc and flags to target the browser (disable WASI, do not require imported memory, etc.).
   - Example (high-level):
     - emcc -O3 -s MODULARIZE=1 -s 'EXPORT_NAME="loadVosklet"' -s NO_EXIT_RUNTIME=1 -s ALLOW_MEMORY_GROWTH=1 -o Vosklet.browser.js <sources>
     - Ensure the generated JS exposes a function `loadVosklet` that returns a Promise resolving with the module.

3. Place files
   - Put the final `Vosklet.browser.js` and `Vosklet.wasm` under `assets/wasm/` in this site.

Notes

- The mock provided here (`Vosklet.browser.js`) is only for functional UI testing; it does not perform real speech recognition.
- If you want, I can try to locate a prebuilt browser bundle or help build one from sources using emscripten in a separate environment.
