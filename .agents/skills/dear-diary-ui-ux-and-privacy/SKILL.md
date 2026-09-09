---
name: dear-diary-ui-ux-and-privacy
description: >-
  Mobile-first design system, neutral terminology rules, entry editor & audio player UI, screen privacy guidelines, and accessibility standards for Dear Diary.
  Use when designing or implementing frontend components, views, CSS styles, or user flows.
---

# Dear Diary — UI/UX Specification & Screen Privacy Guidelines

This skill defines the frontend design system, mobile-first layouts, strict neutral terminology rules, screen privacy requirements, and accessibility (WCAG) standards for **Dear Diary**.

---

## 1. Design Goal & Aesthetic Direction

Dear Diary must look and feel like a **polished, calm, personal journaling application**.
- **Visual Style**: Clean, modern typography (Inter/Roboto), harmonious muted colors, subtle card shadows, smooth transitions, dark/light theme support.
- **Tone**: Calm, reflective, professional productivity app.
- **PROHIBITED UI elements**: Hearts, romantic imagery, couple avatars, pink/red relationship theme tropes, suspicious "secret room" badges, or hidden lockers.

---

## 2. Strict Neutral Terminology Rules

To keep shared access discreet and natural, use truthful, neutral application terms across all screens, empty states, and dialogs.

| PREFERRED Neutral Labels | PROHIBITED Relationship Labels |
| :--- | :--- |
| `My Diary`, `Journal`, `Entries` | `Boyfriend's Journal`, `Girlfriend's Diary` |
| `Updates`, `Collections`, `Archive` | `Couple Space`, `Secret Room` |
| `Access Granted`, `Shared Access` | `Love Notes`, `Messages From Him/Her` |
| `Private`, `Accessible Entries` | `Partner Access`, `Relationship Hub` |

---

## 3. Mobile-First Responsive Design

Primary target devices:
- **Smartphones**: iPhone (iOS Safari), Android (Chrome).
- **Tablets**: iPad, Android tablets.
- **Desktop**: Responsive container centered with comfortable reading width (max-width `768px` to `1024px`).

### Layout Specifications
- **Touch Targets**: Minimum `44px x 44px` touch target size for all buttons, audio playback controls, and bottom navigation tabs.
- **Bottom Navigation Bar**: Fixed bottom navigation bar on mobile viewports (`Home`, `Journal`, `Archive`, `Settings`).
- **No Horizontal Scroll**: Zero unwanted horizontal scrolling on mobile viewports (`320px` to `430px`).
- **Viewport Safe Areas**: Respect `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` for modern notched smartphones.

---

## 4. Component UI Specifications

### Entry Editor
- **Input Fields**: Title, rich text/markdown body, date picker, mood selector, tag input, attachment upload button, audio recorder.
- **Access Level Selector**: Simple, discrete toggle:
  ```text
  Privacy:
  (•) Private
  ( ) Access Granted
  ```
- **Autosave & Drafts**: Save draft locally in `localStorage` or server draft endpoint to prevent accidental data loss while typing.

### Audio Recording & Player Component
- Controls: `Record`, `Pause`, `Resume`, `Stop`, `Play/Pause`, `Delete`, and waveform/duration progress bar.
- Large, thumb-friendly touch controls for recording and playback.

---

## 5. Screen Privacy & Leak Prevention

Private diary content MUST NOT leak through browser or operating system surfaces:
- **Browser Document Title**: Keep generic (`"Dear Diary"` or `"Journal — Dear Diary"`). NEVER put entry title or snippet into `document.title`.
- **Push Notifications & Emails**: Use generic notification text (e.g. `"You have a new journal update."`). NEVER include diary text excerpts or transcript snippets.
- **URLs & Query Parameters**: NEVER put entry text, search keywords, or sensitive tags in URL query parameters.
- **Open Graph / Meta Tags**: Disable social media preview tags on private entry pages.

---

## 6. Accessibility & WCAG Compliance

- **Contrast Ratios**: Minimum `4.5:1` contrast ratio for body text in both Light and Dark themes.
- **Keyboard Navigation**: Full keyboard tab order and visible focus rings (`outline: 2px solid var(--accent)`).
- **Screen Reader Support**: Proper `aria-label`, `aria-expanded`, and `role` attributes on custom audio player controls, dropdowns, and modals.
