# Vosk-Browser Migration Summary

## Overview

The voice feedback feature now uses local `vosk-browser` assets and a browser-first controller instead of the older Vosklet path. The current shipped runtime is `VF 2026-03-25-a`.

This repo is a static Jekyll site, so the feature is intentionally scoped to in-browser capture and transcription. It does not send transcripts to a server or persist feedback files.

## Current Runtime Shape

### Scripts loaded by the site

The footer loads the voice stack in this order:

1. `assets/js/voice-feedback-core.js`
2. `assets/wasm/vosk.js`
3. `assets/js/voice-feedback.js`

`voice-feedback-core.js` contains pure helper logic that is covered by unit tests. `voice-feedback.js` owns the browser UI, prompt loading, recording flow, modal state, and Vosk/Web Speech orchestration.

### Speech flow

1. The page loads and starts preparing the local Vosk model archive.
2. If browser speech recognition is available, the controller can use it.
3. If browser speech recognition is not available, the controller can fall back to local Vosk processing.
4. The modal shows transcript or failure information in-browser.

### Privacy model

- Audio is handled in the browser session.
- The static site does not record IP addresses.
- The static site does not store feedback files.
- The modal explicitly tells the user that feedback is not being sent to a backend.

## What Changed

### Vosklet is no longer the active path

Legacy Vosklet files still exist in `assets/wasm/`, but they are not loaded by the site. The active runtime uses `window.Vosk.createModel()` from the local `vosk.js` asset.

### Local asset loading replaced CDN assumptions

The site loads `vosk.js` from local assets, not from a CDN. The model archive is also served locally:

- `assets/wasm/vosk.js`
- `assets/wasm/vosk-model-small-en-us-0.15.tar.gz`

### UI and state handling were expanded

The current implementation includes:

- A visible version badge
- Status and hint text near the avatar
- A modal for transcript, privacy, and conduct messaging
- Clear permission-denied and unavailable-browser states

## Files Relevant To The Migration

- `assets/js/voice-feedback-core.js`
- `assets/js/voice-feedback.js`
- `_includes/footer.html`
- `assets/wasm/vosk.js`
- `assets/wasm/vosk-model-small-en-us-0.15.tar.gz`
- `tests/voice-feedback-core.test.js`

## Validation Notes

### Verified in this repo

- The local Jekyll site serves successfully.
- The integrated browser can inspect the page and widget state.
- The voice widget advances from `loading` to `ready`.
- Hover updates the hint text.
- Activation in the integrated browser correctly surfaces the permission-denied modal because the integrated browser blocks microphone access.
- Manual happy-path testing in Chrome succeeded with microphone access enabled.
- Transcript quality is sensitive to environmental noise such as wind, so occasional missing words are expected in poor recording conditions.
- Unit tests pass for helper logic.

### Important browser limitation

VS Code's integrated browser is useful for UI inspection, but it blocks microphone permission requests. That means:

- It is suitable for layout and denied-permission smoke tests.
- It is not sufficient to validate the happy-path recording flow.

Use a normal browser such as Chrome, Edge, or Safari to verify actual microphone capture and transcript generation when you need to re-check real speech input quality.

## Remaining Cleanup

- Remove unused Vosklet-era assets if the repo no longer needs them for reference.
- Decide whether to keep the current small US English model or replace it with a newer browser-friendly model after separate evaluation.
- Keep browser-first docs aligned with the static-site constraint.

## Resources

- `DOCUMENTS/VOICE_TESTING_GUIDE.md`
- `DOCUMENTS/LOCAL_VOSK_SETUP.md`
- https://alphacephei.com/vosk/models
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

**Migration checkpoint updated:** March 25, 2026  
**Runtime version:** VF 2026-03-25-a
