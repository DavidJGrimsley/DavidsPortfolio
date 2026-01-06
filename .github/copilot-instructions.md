# DJ's Portfolio - AI Coding Instructions

## Project Overview
Expo Router portfolio app (React Native + Web) showcasing mobile apps, game design, web development, and software development projects. Uses Uniwind (Tailwind CSS for React Native) for styling.

## Architecture

### Routing Structure
- **Expo Router file-based routing** in `src/app/`
- Tab navigation: `(tabs)/_layout.tsx` defines main navigation
- Category pattern: Each portfolio section (`mobile-apps`, `game-design`, `website-development`, `software-development`) has:
  - `index.tsx` - Uses `CategoryIndexWrapper` to list pieces
  - `[title].tsx` - Dynamic route using `CategoryDetailWrapper` for piece details
  - `_layout.tsx` - Stack navigation for the section

### Key Wrapper Components
- `CategoryIndexWrapper` - Standardized category list page with gradient, title, cards, footer
- `CategoryDetailWrapper` - Detail page for portfolio pieces with highlights, skills, YouTube embeds

### Data Flow
Portfolio content lives in `src/constants/json/pieces.json`. Import as:
```tsx
import rawPieces from '@json/pieces.json';
const piecesData: Pieces = normalizePieces(rawPieces);
```
Always use `normalizePieces()` from `@/types/portfolio` to ensure `highlightPictures` arrays are properly normalized.

## Styling (Uniwind/Tailwind)

### Theme System
CSS variables defined in `global.css` with light/dark variants:
```tsx
// Use theme utility classes, NOT direct colors
className="text-themed"    // Theme text color
className="bg-themed"      // Theme background  
className="text-secondary" // Secondary color
className="bg-accent"      // Accent color
className="text-tint"      // Tint color
```

### Responsive Sizing Pattern
Use percentage-based sizing for responsive fonts and spacing:
```tsx
// Converts RFPercentage(2) to Tailwind
className="text-[2%] mb-[1%] p-[2%]"
```

### Gradients
Import from `@/components/Gradients` - each category has a specific gradient:
- `BackgroundGradient` - Home
- `MobileBackgroundGradient` - Mobile apps
- `GameBackgroundGradient` - Games/Software dev
- `WebBackgroundGradient` - Web development
- `AboutBackgroundGradient` - About section

## Path Aliases
```tsx
@/         → ./src/
@json/     → ./src/constants/json/
@img/      → ./public/img/
~/         → ./ (root)
```

## Commands
```bash
npx expo start          # Dev server (web + mobile)
npx expo start --web    # Web only
npm test                # Jest tests
npm run lint            # Expo lint
```

## Key Patterns

### Adding New Portfolio Pieces
1. Add piece data to `src/constants/json/pieces.json`
2. Add images to `public/img/{CategoryName}/{piece-title}/`
3. The existing `[title].tsx` dynamic route handles display automatically

### Creating New Components
Follow existing patterns in `src/components/`:
- Use `className` with Uniwind utilities (not StyleSheet)
- Import theme hooks: `useColorScheme`, `useThemeColor`
- Use `@/` path alias for imports

### TypeScript Types
Portfolio types in `src/types/portfolio.ts`:
- `Piece` - Single portfolio item
- `Pieces` - Collection keyed by category
- `Highlight` - Feature highlight with optional code/images
