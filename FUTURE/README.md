# Voice Feedback Gimmick: UI/UX and Implementation Action Plan

## Overview

This document summarizes the intended direction for the voice feedback feature while keeping the current static-site limitation explicit.

---

## 1. UI/UX Design

### Microphone Avatar

- **Appearance:**
  - Circular avatar, attached to the top of the footer.
  - Image: Microphone styled as a green ackee fruit.
  - On activation (recording): Image flips to show a microphone/notebook combination.
- **Positioning:**
  - On small screens: Stays attached to the top of the footer.
  - On large screens: Floats mid-bottom of the browser window.
- **Hover State:**
  - Border color changes.
  - Speaks an action prompt (text to be provided; will be loaded from `feedback_prompts/action_prompt.txt`).
- **Activation:**
  - Press and hold for 1 second, or mouse click, starts recording.
    - Shows a short on-screen message requesting feedback (text loaded from `feedback_prompts/request_prompt.txt`).

### Recording & Feedback

- **Recording:**
  - Max voice input: 1 minute.
  - Converts voice to English text in the browser.
  - Shows transcript feedback immediately in the modal.
  - Does not currently store feedback, IP addresses, or timestamps.
- **User Feedback Display:**
  - Shows the note and transcribed text to the user as soon as available.
  - Interface floats in the center of the site above the microphone avatar.
  - Design encourages good behaviour using psychology guidelines (see below).

---

## 2. File Structure

- `feedback_prompts/action_prompt.txt` — Text for the action prompt (spoken on hover).
- `feedback_prompts/request_prompt.txt` — Text for the request prompt shown on record start.
- No persistence folder is used by the current static-site implementation.

---

## 3. Interface & Psychology Guidelines

- **Feedback Modal:**
  - Centered, floating modal with soft edges and calming colors.
  - Shows the transcribed note and a positive, encouraging message.
  - Includes a reminder about privacy and respectful feedback.
  - Optionally, a simple emoji or badge for positive reinforcement.
- **Encouragement:**
  - Use gratitude (“Thank you for your feedback!”) and positive language.
  - Remind users their input helps improve the site for everyone.
  - Display a short, friendly code of conduct or “be kind” reminder.
- **Transparency:**
  - Clearly state that the current implementation keeps processing in the browser session.
  - Assure users that the static site does not persist feedback, IP addresses, or timestamps.

---

## 4. Next Steps (Action Only, No Code Yet)

- Verify the happy-path recording flow in a normal browser.
- Keep the modal, prompts, and privacy copy aligned with the static-site scope.
- Decide separately whether a backend-backed feedback system is actually needed.

---

_This document is an action plan only. Persistence remains out of scope until the project has backend support._
