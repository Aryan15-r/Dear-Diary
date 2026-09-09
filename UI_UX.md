# UI/UX Specification

## Design goal

Dear Diary should look like a polished, ordinary journaling application.

It should not look like a dating app, messaging app, or a product specifically designed around secret communication.

## Mobile-first

Primary targets:

- iPhone-sized screens
- Android phones
- iPads/tablets

Desktop must remain responsive.

## Navigation

A possible structure:

```text
Home
Journal
Archive
Search
Settings
```

Additional sections should be added only when useful.

Avoid relationship-specific navigation labels.

## Neutral terminology

Preferred:

- Journal
- Entries
- Updates
- Archive
- Access granted
- Private
- Notes
- Collections

Avoid:

- Boyfriend
- Girlfriend
- Couple
- Secret room
- Partner messages
- Love notes

The terminology must remain truthful and understandable.

## Entry editor

Provide:

- Title
- Body
- Date
- Tags
- Mood
- Attachments
- Audio
- Access setting

The default access setting is Private.

## Access UI

Keep it simple:

```text
Privacy
○ Private
○ Access granted
```

Use clear explanations without unnecessarily exposing relationship context.

## Audio UI

Controls:

- Record
- Pause
- Resume
- Stop
- Playback
- Delete

Use large touch targets.

## Visual design

Use:

- Comfortable reading width
- Clear hierarchy
- Subtle animation
- Responsive cards
- Accessible contrast
- Light/dark/system theme

Avoid excessive animation.

## Privacy on screen

Avoid sensitive text in:

- Browser titles
- Tooltips
- Notification previews
- Share previews
- URL parameters

## Accessibility

Support:

- Keyboard navigation
- Screen readers
- Focus states
- Semantic controls
- Reduced motion
- Accessible audio controls

## Empty states

Empty states should look like normal product UX.

Example:

```text
Your journal is empty.

Start with a new entry.
```

Do not expose internal permission terminology unnecessarily.

## Error states

Do not display technical internals.

Prefer:

```text
This entry is unavailable.
```

over exposing database or storage errors.
