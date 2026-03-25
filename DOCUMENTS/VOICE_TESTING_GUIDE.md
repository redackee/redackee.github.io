# Voice Features Testing Guide

## 🎤 Testing the Voice Feedback System

**Site URL:** http://127.0.0.1:4000/redackee.github.io/

**Unit tests:** `npm test`

---

## Pre-Test Checklist

✅ Jekyll server running at http://127.0.0.1:4000/redackee.github.io/  
✅ Browser has microphone permission capability  
✅ Site loaded in browser
✅ `npm test` passes for extracted voice helpers

---

## Test 1: Visual Elements

### Expected Elements:

1. **Version Badge** (bottom-right corner)

  - Should display: `VF 2026-03-25-a`
   - Location: Fixed position, bottom-right
   - Style: Dark background, white text

2. **Voice Avatar** (footer / floating on large screens)
   - Should display: redackee avatar image
  - Location: Footer on small screens, bottom-center floating control on larger screens
  - Label: "Activate voice feedback. Press Enter or Space to record your feedback."

3. **Visible Hint Text**
  - Should appear next to or below the avatar
  - Should change as the control moves through loading, ready, recording, and processing states

### ✅ How to Check:

- Scroll to the bottom of the page
- Look for the avatar image in the footer
- Look for the version badge in the corner

---

## Test 2: Console Messages

### Open Browser DevTools:

- **Chrome/Edge:** Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Firefox:** Press `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
- **Safari:** Enable Developer menu, then `Cmd+Option+C`

### Expected Console Messages:

```javascript
// On page load:
[voice-feedback] loaded version 2026-03-25-a

// Vosk startup:
[vosk-browser] Loading model from: /redackee.github.io/assets/wasm/vosk-model-small-en-us-0.15.tar.gz
[vosk-browser] Model loaded and ready
```

### ✅ Run These Console Commands:

```javascript
// 1. Check if voice-feedback is loaded
console.log(
  "Version badge:",
  document.getElementById("voice-feedback-version")
);

// 2. Check if avatar exists
console.log("Avatar:", document.getElementById("voice-feedback-avatar"));

// 3. Check if Vosk library loaded
console.log("Vosk loaded:", typeof window.Vosk !== "undefined");

// 4. Check site baseurl
console.log("Site baseurl:", window.siteBaseurl);

// 5. Check Web Speech API support
console.log(
  "Web Speech API:",
  !!(window.SpeechRecognition || window.webkitSpeechRecognition)
);
```

### Expected Results:

```
Version badge: <div id="voice-feedback-version">...</div>
Avatar: <div id="voice-feedback-avatar">...</div>
Vosk loaded: true (if vosk.js loaded)
Site baseurl: /redackee.github.io
Web Speech API: true (Chrome/Edge/Safari)
```

### Unit Test Command:

```bash
npm test
```

Expected result:

```text
✓ tests/voice-feedback-core.test.js
```

---

## Test 3: Hover Interaction

### Steps:

1. Scroll to the footer
2. Hover your mouse over the avatar image

### Expected Behavior:

- ✅ Avatar should get `hover` CSS class
- ✅ Text-to-speech plays the action prompt from `feedback_prompts/action_prompt.txt`
- ✅ Hint text updates to a ready-state message
- ✅ Avatar shows a visual hover/ready state

### ⚠️ Troubleshooting:

- If no audio plays, check browser audio settings
- Check console for errors
- Verify prompt file loads: `http://127.0.0.1:4000/redackee.github.io/feedback_prompts/action_prompt.txt`

---

## Test 4: Click to Record (Web Speech API)

### Steps:

1. Click the avatar
2. Browser will request microphone permission → **Allow it**
3. Speak clearly: "This is a test"
4. Click the avatar again to stop recording

### Expected Behavior:

- ✅ Browser asks for microphone permission
- ✅ Avatar switches to recording state and `aria-pressed="true"`
- ✅ Text-to-speech plays the request prompt from `feedback_prompts/request_prompt.txt`
- ✅ Recording indicator appears (check browser UI)
- ✅ After stopping, modal appears with transcribed text plus privacy/conduct notes

### Real-World Accuracy Note:

- Wind, room echo, and background noise can reduce transcript completeness.
- Minor dropped words during outdoor or noisy testing do not necessarily indicate a controller bug.
- Re-test indoors or closer to the microphone before treating missing words as a code defect.

### Console Messages:

```javascript
[voice-feedback] Starting recording...
// If Web Speech API is used:
[voice-feedback] Using browser speech recognition.
// When you speak:
[Web Speech API] Transcribed: This is a test
```

### Modal Content:

```
Thank you for your feedback!
We process your speech in the browser for this site experience.
[Transcript appears here]
[Close button]
```

---

## Test 5: vosk-browser Offline Transcription

### When This Activates:

- Web Speech API is not available (Firefox, or disabled)
- Or explicitly falls back to MediaRecorder + vosk-browser

### Steps:

1. (In Firefox or after disabling Web Speech API)
2. Click the avatar
3. Grant microphone permission
4. Speak: "Testing offline transcription"
5. Click avatar to stop

### Expected Behavior:

- ✅ MediaRecorder captures audio
- ✅ Audio blob sent to vosk-browser
- ✅ vosk-browser transcribes offline
- ✅ Modal shows result

### Accuracy Note:

- Offline transcription quality also depends on mic quality and ambient noise.
- Compare quiet-room results before changing models or recognition logic.

### Console Messages:

```javascript
[vosk-browser] Processing audio buffer, sample rate: 48000
[vosk-browser] Got final result: { text: "testing offline transcription" }
```

### ⚠️ Note:

- First time: Downloads model (39 MB) - takes ~10-15 seconds
- Subsequent times: Instant (cached in IndexedDB)

---

## Test 6: Prompt Files

### Verify Prompt Files Load:

**Action Prompt (on hover):**

```
http://127.0.0.1:4000/redackee.github.io/feedback_prompts/action_prompt.txt
```

**Request Prompt (on recording start):**

```
http://127.0.0.1:4000/redackee.github.io/feedback_prompts/request_prompt.txt
```

### ✅ Manual Check:

Open these URLs in browser to verify they load:

- Should see text content (not 404)
- action_prompt.txt: "Welcome to Red Ackee software..."
- request_prompt.txt: "Please tell us your feedback or ideas."

---

## Test 7: Model Loading (vosk-browser)

### Check Model File:

```
http://127.0.0.1:4000/redackee.github.io/assets/wasm/vosk-model-small-en-us-0.15.tar.gz
```

### Expected:

- Should download 39 MB file
- Browser may show download progress

### Console Commands to Monitor:

```javascript
// Check if model is being loaded
performance
  .getEntriesByType("resource")
  .filter((r) => r.name.includes("vosk-model"))
  .forEach((r) => console.log(r.name, r.transferSize + " bytes"));
```

---

## Test 8: Complete Flow Test

### Full Integration Test:

1. **Load page** → Check console for version message
2. **Hover avatar** → Hear prompt
3. **Click avatar** → Grant mic permission
4. **Speak** → "Hello this is my feedback"
5. **Click again** → Stop recording
6. **See modal** → Verify transcribed text
7. **Close modal** → Click Close button
8. **Repeat** → Should work faster (model cached)

---

## Expected Results Summary

| Feature               | Status | Notes                        |
| --------------------- | ------ | ---------------------------- |
| Page loads            | ✅     | Should be fast               |
| Version badge visible | ✅     | Bottom-right corner          |
| Avatar visible        | ✅     | Footer or floating on desktop |
| Hint text visible     | ✅     | Tracks current state         |
| Hover plays audio     | ✅     | Text-to-speech               |
| Click requests mic    | ✅     | Browser prompt               |
| Recording works       | ✅     | Visual feedback              |
| Web Speech API        | ✅     | Chrome/Edge/Safari           |
| vosk-browser fallback | ✅     | Firefox or explicit fallback |
| Transcription shows   | ✅     | In modal                     |
| Modal closes          | ✅     | Close button works           |
| Unit tests pass       | ✅     | `npm test`                   |

---

## Troubleshooting

### No audio prompts?

- Check browser audio not muted
- Check console for fetch errors
- Verify prompt files exist and load

### Microphone permission denied?

- Browser settings → Site permissions → Microphone
- Try HTTPS (some browsers require secure context)

### No transcription?

- Check console for errors
- Verify Web Speech API support: `console.log(!!(window.SpeechRecognition || window.webkitSpeechRecognition))`
- Check vosk-browser loaded: `console.log(typeof window.Vosk)`

### vosk-browser not loading model?

- Check network tab for model download
- Clear IndexedDB cache and retry
- Check model URL: `/assets/wasm/vosk-model-small-en-us-0.15.tar.gz`

### Console errors?

- Check for CORS issues (should be same-origin)
- Check for JavaScript errors
- Verify all files built to `_site/`

---

## Browser Compatibility

| Browser | Web Speech API | vosk-browser | MediaRecorder |
| ------- | -------------- | ------------ | ------------- |
| Chrome  | ✅             | ✅           | ✅            |
| Edge    | ✅             | ✅           | ✅            |
| Safari  | ✅             | ✅           | ✅            |
| Firefox | ❌             | ✅           | ✅            |
| Opera   | ✅             | ✅           | ✅            |

**Recommendation:** Test in Chrome first (full support), then Firefox (vosk-browser only)

---

## Quick Test Script

Copy/paste into browser console:

```javascript
// Quick voice feature check
(function () {
  console.log("=== Voice Feature Test ===");
  console.log(
    "Version badge:",
    document.getElementById("voice-feedback-version")?.textContent
  );
  console.log(
    "Avatar element:",
    !!document.getElementById("voice-feedback-avatar")
  );
  console.log("Vosk loaded:", typeof window.Vosk !== "undefined");
  console.log(
    "Web Speech API:",
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  console.log("Site baseurl:", window.siteBaseurl);
  console.log("MediaRecorder:", typeof MediaRecorder !== "undefined");

  // Check prompt files
  fetch(window.siteBaseurl + "/feedback_prompts/action_prompt.txt")
    .then((r) => console.log("Action prompt:", r.ok ? "OK" : "FAILED"))
    .catch((e) => console.error("Action prompt error:", e));

  fetch(window.siteBaseurl + "/feedback_prompts/request_prompt.txt")
    .then((r) => console.log("Request prompt:", r.ok ? "OK" : "FAILED"))
    .catch((e) => console.error("Request prompt error:", e));

  console.log("=== Test Complete ===");
})();
```

---

## Success Criteria

✅ **PASS if:**

- All console checks return expected values
- Avatar responds to hover
- Recording starts when clicked
- Transcription appears in modal
- Modal closes properly

⚠️ **PARTIAL if:**

- Some features work, others fail
- vosk-browser doesn't load but Web Speech API works

❌ **FAIL if:**

- No console messages appear
- Avatar doesn't exist
- Nothing happens on click
- JavaScript errors in console

---

**Test Date:** October 8, 2025  
**Version:** VF 2026-03-25-a  
**vosk-browser:** 0.0.8 (local)
