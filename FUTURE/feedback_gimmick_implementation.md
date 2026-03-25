# Voice Feedback Gimmick: Implementation Documentation

This document details the implementation requirements and design for the voice feedback feature, as outlined in the action plans.

## 1. UI/UX Design

- Microphone avatar (green ackee fruit) as a circular button, attached to the top of the footer or floating mid-bottom on large screens.
- On activation, avatar flips to a microphone/notebook combo image.
- Hover: border color changes and action prompt is spoken (from `FUTURE/feedback_prompts/action_prompt.txt`).
- Press and hold (1s) or click: starts recording and shows request prompt text (from `feedback_prompts/request_prompt.txt`).
- Visual indicator during recording.
- Max voice input: 1 minute.
- After recording, show a floating modal with the transcribed note, positive message, and privacy/conduct reminders.

## 2. Audio & Speech-to-Text

- Use Web Audio API or MediaRecorder API for audio capture.
- Prefer browser speech recognition when it is available.
- Use Vosk WASM for in-browser fallback/offline support.

## 3. Data Handling

- Current static-site checkpoint does not store notes, IP addresses, or timestamps on a server.
- Prompts are stored in `feedback_prompts/`.
- Any future persistence work requires a separate backend design decision first.

## 4. Psychology & Encouragement

- Modal uses calming colors, soft edges, gratitude, and positive reinforcement.
- Display privacy and respectful feedback reminders.

## 5. File Structure

- `feedback_prompts/action_prompt.txt` — Action prompt (spoken on hover)
- `feedback_prompts/request_prompt.txt` — Request prompt (on record start)
- No feedback storage directory is used by the current static implementation

---

_See breakdown and checklist files for step-by-step and actionable tasks._
