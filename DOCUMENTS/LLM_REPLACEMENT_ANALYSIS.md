# LLM and Speech Model Replacement Analysis

## Scope

This document summarizes the current state of the repository, evaluates the suitability of Hugging Face models for replacing the existing transcription approach, and provides a recommendation based on the project’s architecture.

## Current repo state

This repository is a static Jekyll site with a browser-side voice feedback feature. The active implementation is centered on in-browser speech capture and local transcription rather than a hosted LLM backend.

Evidence from the codebase:

- [package.json](../package.json) contains only test tooling and no LLM dependencies.
- [assets/js/voice-feedback.js](../assets/js/voice-feedback.js) prefers browser `SpeechRecognition` and falls back to a local Vosk model.
- [assets/js/voice-feedback-core.js](../assets/js/voice-feedback-core.js) contains transcript and UI helpers, not a model inference layer.
- [DOCUMENTS/VOSK_BROWSER_MIGRATION.md](../DOCUMENTS/VOSK_BROWSER_MIGRATION.md) explicitly documents the browser-first, local-assets design.
- [DOCUMENTS/LOCAL_VOSK_SETUP.md](../DOCUMENTS/LOCAL_VOSK_SETUP.md) confirms the repo serves Vosk locally from `assets/wasm/`.

In other words, this project is not currently using an LLM in the application flow. It is using speech transcription in the browser.

## What the current system does

The active flow is:

1. User clicks the voice-feedback avatar.
2. The browser captures microphone input.
3. The site tries `SpeechRecognition` if available.
4. If not available, it falls back to a local Vosk transcription model.
5. The transcript is shown in a modal for the user.

This is a privacy-friendly architecture for a static site and does not send audio or transcript data to a server.

## Evaluation of Needle 2

Needle 2 is a Hugging Face model from Cactus Compute, described as a small, edge-focused tool-calling model. Based on the model card, it is:

- around 45M parameters
- optimized for tool calling and structured extraction
- designed for on-device / tiny-device / WASM deployment
- aimed at function-calling workflows rather than speech recognition

### Conclusion on Needle 2 for this repo

Needle 2 is not a direct replacement for Vosk here.

Why:

- It is not a speech-to-text model.
- It is designed for structured tool calls and JSON outputs, not audio transcription.
- The current project’s transcribe step is browser-based and privacy conscious; Needle 2 would only make sense after transcription, not instead of it.

If the purpose is to turn spoken feedback into a structured action, then Needle 2 could be a post-transcription step. But it would not replace the speech recognition engine.

## HF candidates that could replace Vosk

If the goal is to replace Vosk with a Hugging Face model, the better candidates are speech models rather than tool-calling models.

### 1) `Xenova/whisper-tiny.en`

Best candidate for a browser-only static site.

Pros:

- optimized for ONNX/Web runtimes
- small and browser-friendly
- better fit for local inference than a tool-calling model

Cons:

- less accurate than larger whisper variants
- may still be heavier than Vosk depending on the browser environment

### 2) `Xenova/whisper-small.en`

Best if accuracy matters more than size.

Pros:

- better transcript quality than tiny
- still compatible with browser inference patterns

Cons:

- higher CPU and memory usage
- bigger runtime burden than Vosk

### 3) `distil-whisper/distil-large-v3`

Strong accuracy option if the app can tolerate a heavier runtime.

Pros:

- strong performance/quality tradeoff
- better for serious transcription quality

Cons:

- less ideal for a tiny browser static site
- heavier than Vosk and probably more demanding than the repo’s current architecture

### 4) `openai/whisper-base` / `small`

Valid model candidates, but usually require conversion to ONNX or a server-side inference path.

Cons:

- less straightforward for a static-site/browser deployment
- requires more integration work than the current Vosk setup

## Recommendation

### Recommended model for this repo

If the goal is a direct Vosk replacement in the browser, the strongest Hugging Face candidate is a Whisper-based ONNX runtime model, especially:

- `Xenova/whisper-tiny.en` for the lightest browser-friendly replacement
- `Xenova/whisper-small.en` if stronger accuracy is needed

### Not recommended as a replacement

- `Cactus-Compute/needle2` is not appropriate as a Vosk replacement.
- It is a structured tool-calling model, not a speech transcription model.

## Architectural conclusion

This project is not currently built around an LLM backend, and replacing Vosk with Needle 2 would not be a meaningful “upgrade.” The repo’s right optimization path is:

- keep the browser-transcription design
- replace Vosk with a Whisper-based ONNX model if better transcription is needed
- add Needle 2 only as a post-transcription structured-output layer if the site later needs action extraction or tool-calling

## Final verdict

- Vosk is a good fit for this repo’s static Jekyll architecture.
- Needle 2 is not a direct replacement.
- For HF alternatives, Whisper-based models are the right direction, especially the `Xenova` browser-friendly variants.

## Summary score

| Category           |                                              Score |
| ------------------ | -------------------------------------------------: |
| Code quality       |                                               8/10 |
| Maintainability    |                                               8/10 |
| Security / privacy |                                               9/10 |
| Best-practice fit  |                                               8/10 |
| LLM/AI suitability | 6/10 for Needle 2, 8/10 for Whisper browser models |

## References

- [assets/js/voice-feedback.js](../assets/js/voice-feedback.js)
- [assets/js/voice-feedback-core.js](../assets/js/voice-feedback-core.js)
- [DOCUMENTS/VOSK_BROWSER_MIGRATION.md](../DOCUMENTS/VOSK_BROWSER_MIGRATION.md)
- [DOCUMENTS/LOCAL_VOSK_SETUP.md](../DOCUMENTS/LOCAL_VOSK_SETUP.md)
- Hugging Face model page for Needle 2: https://huggingface.co/Cactus-Compute/needle2
