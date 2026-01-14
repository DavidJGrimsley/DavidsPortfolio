# Typography, Headings, Accessibility, and SEO (Expo Router + Uniwind)

## Goals
- One component (`ThemedText`) works on both Web and Native.
- Web gets real semantic headings (`<h1>`…`<h6>`) for SEO + assistive tech.
- Native gets the correct accessibility semantics (VoiceOver/TalkBack).
- Typography + font choices are consistent via reusable Uniwind classes in `global.css`.

## The rule: **one H1 per screen**
Treat each route/screen as its own document.
- Use exactly one `headingLevel={1}` per screen.
- Use `headingLevel={2}` / `{3}` for sections within that screen.
- Don’t use multiple H1s for “styling” — use `visualHeadingLevel` instead.

## `ThemedText` API (universal)
File: `src/components/UI/ThemedText.tsx`

### Semantics
- `headingLevel?: 1 | 2 | 3 | 4 | 5 | 6`
  - Web: renders a real `<h1>`…`<h6>` via `@expo/html-elements`.
  - iOS/Android: sets `accessibilityRole="header"`.

### Visual styling
- `type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link'`
  - Visual variants, backed by global classes (e.g. `typo-title`).
- `visualHeadingLevel?: 1..6`
  - Adjusts size/weight using `typo-h1`…`typo-h6`.
  - This does **not** change semantic heading tags.

### Accessibility label
- `aria?: string`
  - Friendly alias for the accessible name.
  - Native: maps to `accessibilityLabel`.
  - Web: maps to `aria-label` for headings.

### Inverse tone
- `inverse?: boolean`
  - Uses the theme token `--color-white-or-black` via the `text-white-or-black` class.
  - Use when text sits on a “tint/accent” background and you want guaranteed contrast.

## Fonts (web + native)
### Web
- Google Fonts are loaded in `src/app/+html.tsx`.

### Native
- Fonts are loaded locally in `src/app/_layout.tsx` via Expo Google Fonts packages.
- This ensures mobile devices don’t depend on remote font loading.

### Which fonts to use
Global font utility classes live in `global.css`:
- `font-noto-sans` (default body)
- `font-noto-sans-display` (display/headings)
- `font-noto-serif`, `font-noto-serif-display` (serif options)
- `font-noto-sans-mono` (code/URLs)
- `font-londrina-shadow` (special: your name + deep detail page titles)

## Uniwind best practices (consistency)
- Prefer global utility classes (e.g. `typo-*`, `text-themed`) over repeating long class lists.
- Keep **semantics** separate from **visuals**:
  - Semantics: `headingLevel`
  - Visuals: `type` / `visualHeadingLevel` / extra `className`
- Prefer theme token classes:
  - `text-themed`, `bg-themed`, `text-secondary`, `text-tint`, `text-white-or-black`
- Use inline styles only when you must (e.g. computed colors coming from JS).

## Recommended patterns
### Screen title (single H1)
```tsx
<ThemedText headingLevel={1} visualHeadingLevel={1} className="font-londrina-shadow">
  David Grimsley
</ThemedText>
```

### Section heading (H2)
```tsx
<ThemedText headingLevel={2} visualHeadingLevel={3} type="subtitle">
  Features
</ThemedText>
```

### “Looks like a heading” but isn’t (no headingLevel)
```tsx
<ThemedText visualHeadingLevel={3}>
  Visually prominent, not announced as a heading
</ThemedText>
```
