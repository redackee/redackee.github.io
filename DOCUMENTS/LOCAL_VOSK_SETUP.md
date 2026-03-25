# Local vosk-browser Setup - Summary

## Overview

The site serves `vosk-browser` and the English model archive from local assets so the voice feedback feature can prepare an offline transcription path without relying on a CDN.

This document describes the local asset setup only. For current runtime behavior and smoke-test notes, see `DOCUMENTS/VOSK_BROWSER_MIGRATION.md` and `DOCUMENTS/VOICE_TESTING_GUIDE.md`.

## Local Assets In Use

### `assets/wasm/vosk.js`

- Source: local copy committed to the repo
- Purpose: browser Vosk runtime and worker support

### `assets/wasm/vosk-model-small-en-us-0.15.tar.gz`

- Source: archive created from the checked-in model directory
- Purpose: offline English transcription model

## How The Site Loads Them

The footer loads the local files directly:

```html
<script src="{{ site.baseurl }}/assets/js/voice-feedback-core.js"></script>
<script type="application/javascript" src="{{ site.baseurl }}/assets/wasm/vosk.js"></script>
<script src="{{ site.baseurl }}/assets/js/voice-feedback.js"></script>
```

The model archive is requested by `voice-feedback.js` through the local base URL, not from a CDN.

## Benefits Of Local Serving

- No external CDN dependency
- Same-origin asset loading
- Better offline/privacy posture
- Exact repo-controlled asset versions

## Current File Layout

```text
assets/wasm/
├── vosk.js
├── vosk-model-small-en-us-0.15.tar.gz
└── vosk-model-small-en-us-0.15/
```

The legacy Vosklet-era loader and shim files have been removed from the source tree because the site no longer uses them.

## Runtime Notes

- The first model load can take noticeably longer than later visits.
- Browser caching and IndexedDB can reduce repeated setup cost.
- The site prefers browser speech recognition when available and falls back to local Vosk when needed.

## Verification

Useful checks:

- Open the local site and wait for the voice widget to move from `loading` to `ready`.
- Confirm `window.Vosk` exists in a browser console.
- Confirm the page can reach `assets/wasm/vosk.js` and the model archive from the local site URL.

## Known Constraints

- VS Code's integrated browser is suitable for UI inspection but denies microphone permission.
- A full happy-path recording test must be done in a normal browser.

## Follow-up Options

- Evaluate whether a newer Vosk model is worth the download and accuracy tradeoff.

---

**Setup summary refreshed:** March 25, 2026  
**Installation mode:** Local assets only
