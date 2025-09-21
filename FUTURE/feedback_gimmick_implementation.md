# Voice Feedback Gimmick: Implementation Documentation

This document details the implementation requirements and design for the voice feedback feature, as outlined in the action plans.

## 1. UI/UX Design

- Microphone avatar (green ackee fruit) as a circular button, attached to the top of the footer or floating mid-bottom on large screens.
- On activation, avatar flips to a microphone/notebook combo image.
- Hover: border color changes and action prompt is spoken (from `FUTURE/feedback_prompts/action_prompt.txt`).
- Press and hold (1s) or click: starts recording and shows request prompt (from `FUTURE/feedback_prompts/request_prompt.txt`).
- Visual indicator during recording.
- Max voice input: 1 minute.
- After recording, show a floating modal with the transcribed note, positive message, and privacy/conduct reminders.

## 2. Audio & Speech-to-Text

- Use Web Audio API or MediaRecorder API for audio capture.
- Use Vosk WASM for in-browser speech-to-text (preferred), or Whisper-tiny via server if needed.

## 3. Data Handling

- Store each note (with IP and timestamp) in `FUTURE/feedback/` subfolder.
- Prompts stored in `FUTURE/feedback_prompts/` subfolder.

## 4. Psychology & Encouragement

- Modal uses calming colors, soft edges, gratitude, and positive reinforcement.
- Display privacy and respectful feedback reminders.

## 5. File Structure

- `FUTURE/feedback_prompts/action_prompt.txt` — Action prompt (spoken on hover)
- `FUTURE/feedback_prompts/request_prompt.txt` — Request prompt (on record start)
- `FUTURE/feedback/` — Stores user feedback notes

---

_See breakdown and checklist files for step-by-step and actionable tasks._
