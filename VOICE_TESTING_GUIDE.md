# Voice Features Testing Guide

## 🎤 Testing the Voice Feedback System

**Site URL:** http://127.0.0.1:4000/redackee.github.io/

---

## Pre-Test Checklist

✅ Jekyll server running at http://127.0.0.1:4000/redackee.github.io/  
✅ Browser has microphone permission capability  
✅ Site loaded in browser

---

## Test 1: Visual Elements

### Expected Elements:

1. **Version Badge** (bottom-right corner)

   - Should display: `VF 2025-10-05-test`
   - Location: Fixed position, bottom-right
   - Style: Dark background, white text

2. **Voice Avatar** (in footer)
   - Should display: redackee avatar image
   - Location: Footer, after author name
   - Tooltip: "Send voice feedback"

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
[voice-feedback] loaded version 2025-10-05-test

// vosk-browser library check:
[vosk-browser] Library not loaded. Will use Web Speech API fallback.
// OR if vosk loads successfully:
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

---

## Test 3: Hover Interaction

### Steps:

1. Scroll to the footer
2. Hover your mouse over the avatar image

### Expected Behavior:

- ✅ Avatar should get `hover` CSS class
- ✅ Text-to-speech plays: "Welcome to Red Ackee software. Please tell us your idea or leave feedback..."
- ✅ Avatar may have visual hover effect (check CSS)

### ⚠️ Troubleshooting:

- If no audio plays, check browser audio settings
- Check console for errors
- Verify prompt file loads: `http://127.0.0.1:4000/redackee.github.io/feedback_prompts/action_prompt.txt`

---

## Test 4: Click to Record (Web Speech API)

### Steps:

1. Click the avatar in the footer
2. Browser will request microphone permission → **Allow it**
3. Speak clearly: "This is a test"
4. Click the avatar again to stop recording

### Expected Behavior:

- ✅ Browser asks for microphone permission
- ✅ Avatar gets `active` CSS class (visual feedback)
- ✅ Text-to-speech plays: "Please tell us your feedback or ideas"
- ✅ Recording indicator appears (check browser UI)
- ✅ After stopping, modal appears with transcribed text

### Console Messages:

```javascript
[voice-feedback] Starting recording...
// If Web Speech API is used:
SpeechRecognition started
// When you speak:
[Web Speech API] Transcribed: This is a test
```

### Modal Content:

```
Thank you for your feedback!
Transcribed: This is a test
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
| Avatar visible        | ✅     | In footer                    |
| Hover plays audio     | ✅     | Text-to-speech               |
| Click requests mic    | ✅     | Browser prompt               |
| Recording works       | ✅     | Visual feedback              |
| Web Speech API        | ✅     | Chrome/Edge/Safari           |
| vosk-browser fallback | ✅     | Firefox or explicit fallback |
| Transcription shows   | ✅     | In modal                     |
| Modal closes          | ✅     | Close button works           |

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
**Version:** VF 2025-10-05-test  
**vosk-browser:** 0.0.8 (local)
