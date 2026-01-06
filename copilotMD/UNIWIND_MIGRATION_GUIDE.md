# Uniwind Migration Guide

## ✅ Completed

1. **Dependencies** - Uniwind v1.2.2 and Tailwind v4.1.18 are installed
2. **Global CSS** - Updated with theme tokens and utility classes
3. **Theme Tokens** - CSS variables created for all colors from Colors.ts
4. **Initial Migration** - `app/(tabs)/learn/index.tsx` fully migrated as example

## 🎨 Theme Variables Available

All colors from `Colors.ts` are now available as CSS variables:

```css
--color-text
--color-background
--color-secondary
--color-accent
--color-tint
--color-icon
--color-tab-icon-default
--color-tab-icon-selected
--color-white-or-black
```

## 🔧 Utility Classes Created

### Color Utilities
- `.text-themed` - Theme text color
- `.bg-themed` - Theme background color
- `.text-secondary`, `.bg-secondary`
- `.text-accent`, `.bg-accent`
- `.text-tint`, `.bg-tint`
- `.text-icon`, `.bg-icon`

### Layout Utilities
- `.side-nav`, `.side-nav-text`
- `.main-title`, `.main-title-text`
- `.page-container`, `.content-container`
- `.scroll-cards`, `.cards-container`, `.card`
- `.btn-primary`, `.btn-primary-text`
- `.footer`, `.footer-text`
- `.home-container`, `.scroll-home`
- `.highlight-view`, `.highlight-title`, `.highlight-description`
- `.website-container`, `.website-text`, `.about-text`

## 📝 Migration Pattern

### Before (StyleSheet):
```tsx
import { StyleSheet } from 'react-native';
import { RFPercentage } from 'react-native-responsive-fontsize';

const localStyles = StyleSheet.create({
  title: {
    fontSize: RFPercentage(2.5),
    fontWeight: 'bold',
    marginBottom: RFPercentage(0.5),
  },
});

<Text style={localStyles.title}>Hello</Text>
```

### After (className):
```tsx
<Text className="text-[2.5%] font-bold mb-[0.5%]">Hello</Text>
```

## 🗺️ Common Conversions

| StyleSheet Property | Tailwind/Uniwind Class |
|---------------------|------------------------|
| `flex: 1` | `flex-1` |
| `flexDirection: 'row'` | `flex-row` |
| `justifyContent: 'center'` | `justify-center` |
| `alignItems: 'center'` | `items-center` |
| `textAlign: 'center'` | `text-center` |
| `fontSize: RFPercentage(2)` | `text-[2%]` |
| `fontWeight: 'bold'` | `font-bold` |
| `marginBottom: RFPercentage(1)` | `mb-[1%]` |
| `padding: RFPercentage(2)` | `p-[2%]` |
| `width: '90%'` | `w-[90%]` |
| `maxWidth: 600` | `max-w-[600px]` |
| `borderRadius: RFPercentage(0.5)` | `rounded-[0.5%]` |
| `backgroundColor: Colors.light.accent` | `bg-accent` |
| `color: Colors.light.text` | `text-themed` |

## 📂 Files to Migrate

### Priority 1 - High Usage Files
- [ ] `constants/styles.tsx` - Main styles (441 lines)
- [ ] `constants/mobileStyles.tsx` - Mobile styles (197 lines)
- [ ] `constants/tttStyles.tsx` - Tic-tac-toe styles (122 lines)
- [ ] `constants/gameStyles.tsx` - Game styles

### Priority 2 - Components
- [ ] `components/CustomComponents.tsx`
- [ ] `components/TicTacToe.tsx`
- [ ] `components/ThemedText.tsx`
- [ ] `components/ThemedView.tsx`

### Priority 3 - Page Components
- [x] `app/(tabs)/learn/index.tsx` ✅ COMPLETED
- [ ] `app/(tabs)/index.tsx` - Home page
- [ ] `app/(tabs)/_layout.tsx` - Tab layout
- [ ] `app/(tabs)/about/index.tsx`
- [ ] `app/(tabs)/pokemon/index.tsx`
- [ ] `app/(tabs)/mobile-apps/index.tsx`
- [ ] `app/(tabs)/website-development/index.tsx`
- [ ] `app/(tabs)/software-development/index.tsx`
- [ ] `app/(tabs)/game-design/index.tsx`
- [ ] All `[title].tsx` detail pages

## 🎯 Migration Strategy

### Step 1: Identify StyleSheet Usage
```bash
# Find all files using StyleSheet
grep -r "StyleSheet.create" app/
```

### Step 2: Convert One File at a Time
1. Replace `style={}` with `className=""`
2. Convert React Native style props to Tailwind classes
3. Use custom utilities for complex patterns
4. Remove `StyleSheet.create()` and imports
5. Remove `RFPercentage` imports if no longer needed

### Step 3: Test Thoroughly
- Check visual appearance on web and mobile
- Verify responsive behavior
- Test light/dark mode switching

## 💡 Tips

1. **Percentage-based sizing**: Use `w-[85%]` for width: '85%'
2. **RFPercentage conversion**: `RFPercentage(2)` → `text-[2%]` or `p-[2%]`
3. **Theme colors**: Always use utility classes (`.text-themed`) instead of direct colors
4. **Complex styles**: Create custom utilities in global.css for reusable patterns
5. **Gradients**: LinearGradient components may need to remain as-is or convert to Tailwind gradients
6. **Dynamic styles**: Use conditional classNames with `clsx` or template literals

## 🔄 Gradual Migration

The app can run with mixed StyleSheet and className approaches during migration:
- New components: Use className
- Existing components: Migrate as needed
- Shared styles: Convert `constants/styles.tsx` utilities to global.css gradually

## 📚 Resources

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Uniwind Docs](https://github.com/jamsch/uniwind)
- [NativeWind Migration Guide](https://www.nativewind.dev/v4/getting-started/react-native)

## 🚀 Next Steps

1. Continue migrating high-traffic pages (home, about, portfolio pages)
2. Convert ThemedText and ThemedView to use className
3. Refactor LinearGradient components to Tailwind gradients where possible
4. Update hooks (useThemeColor) to work with CSS variables
5. Remove unused StyleSheet imports as files are converted
