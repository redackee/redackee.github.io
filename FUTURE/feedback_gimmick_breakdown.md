# Voice Feedback Gimmick: Implementation Breakdown

## Step-by-Step Breakdown

1. **UI/UX & Assets**

   - Design and create microphone avatar images (green ackee fruit, mic/notebook combo).
   - Add avatar to site, attach to footer or float mid-bottom on large screens.
   - Implement hover and activation states (border color, image flip, prompt playback).

2. **Prompts**

   - Add `FUTURE/feedback_prompts/action_prompt.txt` and `FUTURE/feedback_prompts/request_prompt.txt` with appropriate text.

3. **Audio Capture**

   - Integrate Web Audio API or MediaRecorder API for voice recording.
   - Limit recording to 1 minute.

4. **Speech-to-Text**

   - Integrate Vosk WASM for in-browser transcription fallback.
   - Use browser speech recognition when available.

5. **Feedback Storage**

   - Current static-site checkpoint: do not store notes server-side.
   - Future backend phase only: define a real persistence target before adding any storage.

6. **Feedback Modal**

   - Design and implement floating modal to display transcribed note and positive message.
   - Add privacy and conduct reminders.

7. **Psychology & Encouragement**

   - Write and display gratitude, encouragement, and code of conduct text.

8. **Testing**
   - Test on various devices and browsers for UI, audio, and transcription.
   - Validate the permission-denied path in the integrated browser.
   - Validate the happy-path microphone flow in a normal browser.

---

_See checklist file for actionable tasks._
