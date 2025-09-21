# Voice Feedback Gimmick: Implementation Checklist

- [ ] Design microphone avatar images (green ackee fruit, mic/notebook combo)
- [ ] Add avatar to site, attach to footer or float mid-bottom
- [ ] Implement hover state (border color, action prompt playback)
- [ ] Implement activation (press/hold or click, image flip, request prompt)
- [ ] Integrate Web Audio API or MediaRecorder API for recording
- [ ] Limit recording to 1 minute
- [ ] Integrate Vosk WASM for in-browser speech-to-text
- [ ] (Optional) Set up server endpoint for Whisper-tiny transcription
- [ ] Create `FUTURE/feedback/` subfolder for notes
- [ ] Store note with IP and timestamp
- [ ] Design and implement floating feedback modal
- [ ] Add gratitude, encouragement, and code of conduct text
- [ ] Add privacy and respectful feedback reminders
- [ ] Test UI, audio, transcription, and data handling on all devices
