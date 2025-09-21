# Voice Feedback Gimmick: UI/UX and Implementation Action Plan

## Overview

This document outlines the action plan for implementing a voice feedback feature on the site, based on the plan in `FUTURE.md` and the new UI/UX and behavioral directives provided.

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
  - Shows a short message requesting feedback (text to be provided; will be loaded from `feedback_prompts/request_prompt.txt`).

### Recording & Feedback

- **Recording:**
  - Max voice input: 1 minute.
  - Records IP address and date/time with each input.
  - Converts voice to English text note.
  - Stores note in a new `feedback` subfolder.
- **User Feedback Display:**
  - Shows the note and transcribed text to the user as soon as available.
  - Interface floats in the center of the site above the microphone avatar.
  - Design encourages good behaviour using psychology guidelines (see below).

---

## 2. File Structure

- `feedback_prompts/action_prompt.txt` — Text for the action prompt (spoken on hover).
- `feedback_prompts/request_prompt.txt` — Text for the request prompt (shown/spoken on record start).
- `feedback/` — Folder to store user feedback notes (with IP and timestamp).

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
  - Clearly state that IP and timestamp are recorded for quality and safety.
  - Assure users their voice is only used for feedback and not shared.

---

## 4. Next Steps (Action Only, No Code Yet)

- Prepare the microphone avatar images (green ackee fruit, and microphone/notebook combo).
- Create the `feedback_prompts` subfolder and add placeholder text files for prompts.
- Design the floating modal interface and feedback note display.
- Plan the logic for recording, transcribing, and storing feedback as described.
- Review and finalize psychology-based encouragement and privacy messaging.

---

_This document is an action plan only. No implementation code is included._
