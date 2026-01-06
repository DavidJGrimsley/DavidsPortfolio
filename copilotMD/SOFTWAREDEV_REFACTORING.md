# SoftwareDev Components Refactoring

## Summary
Extracted reusable components from API/MCP pages into individual, focused component files following single-responsibility principle.

## New Components Created

### Generic Components (`components/SoftwareDev/`)

#### 1. **InfoCard.tsx**
Reusable info card with icon, title, and multi-paragraph content.
- **Props**: `icon`, `title`, `paragraphs[]`
- **Used by**: `WhatIsMCPCard`, `WhatIsAPICard`

#### 2. **StatusBadge.tsx**
Status indicator badge (LIVE/OFFLINE).
- **Props**: `status` ('active' | 'inactive' | 'live' | 'offline'), optional `label`
- **Used by**: `SoftwareCard`
- **Features**: Automatic color coding (green for active, red for inactive)

#### 3. **StatsRow.tsx**
Horizontal row of stat badges.
- **Props**: `stats` (array of `{ emoji, label }`)
- **Used by**: `SoftwareCard`
- **Example**: "📡 4 endpoints", "⚡ 99.5% uptime"

#### 4. **TagList.tsx**
Horizontal wrapping list of tag badges.
- **Props**: `tags` (string array)
- **Used by**: `SoftwareCard`
- **Features**: Uses theme colors, auto-wraps, consistent styling

### Domain-Specific Components

#### API Components (`components/SoftwareDev/api/`)
- **WhatIsAPICard.tsx** - Explains what APIs are
  - Pre-configured with API explanation text
  - Uses `InfoCard` component

#### MCP Components (`components/SoftwareDev/mcp/`)
- **WhatIsMCPCard.tsx** - Explains Model Context Protocol
  - Pre-configured with MCP explanation text
  - Uses `InfoCard` component

## Refactored Components

### SoftwareCard.tsx
**Before**: 158 lines with inline status badge, stats row, and tag list
**After**: ~80 lines using extracted components

**Changes**:
- Replaced inline status badge JSX with `<StatusBadge />`
- Replaced stats row JSX with `<StatsRow />`
- Replaced tag list JSX with `<TagList />`

**Benefits**:
- 50% reduction in component size
- Better separation of concerns
- Each sub-component can be reused independently
- Easier to test and maintain

## Updated Pages

### API Index (`app/(tabs)/api/index.tsx`)
- ✅ Added `WhatIsAPICard` between cards and "Coming Soon"
- Provides educational context for users

### MCP Index (`app/(tabs)/mcp/index.tsx`)
- ✅ Replaced inline "What is MCP?" card with `WhatIsMCPCard`
- Cleaner code, consistent with API page

## Component Organization

```
components/
├── SoftwareDev/
│   ├── api/
│   │   ├── APIComponents.tsx     (EndpointCard)
│   │   └── WhatIsAPICard.tsx     ✨ NEW
│   ├── mcp/
│   │   ├── MCPComponents.tsx     (ResourceCard, ToolCard, etc.)
│   │   ├── MCPPageSections.tsx   (HeroSection, WhatIsSection)
│   │   └── WhatIsMCPCard.tsx     ✨ NEW
│   ├── ComingSoonCard.tsx        (existing)
│   ├── InfoCard.tsx              ✨ NEW (shared)
│   ├── SoftwareCard.tsx          (existing, refactored)
│   ├── StatusBadge.tsx           ✨ NEW (shared)
│   ├── StatsRow.tsx              ✨ NEW (shared)
│   └── TagList.tsx               ✨ NEW (shared)
```

## Design Principles Applied

### 1. **Single Responsibility**
Each component has one clear purpose:
- `StatusBadge`: Show status indicator
- `StatsRow`: Display metrics
- `TagList`: Show categorization tags
- `InfoCard`: Present educational content

### 2. **Composition Over Duplication**
- `WhatIsMCPCard` and `WhatIsAPICard` compose `InfoCard`
- `SoftwareCard` composes `StatusBadge`, `StatsRow`, and `TagList`

### 3. **Domain-Driven Organization**
- Shared components: `components/SoftwareDev/`
- API-specific: `components/SoftwareDev/api/`
- MCP-specific: `components/SoftwareDev/mcp/`

### 4. **Individual Files**
Following best practices (NOT like `CustomComponents.tsx`):
- One component per file
- Named export matching filename
- Easier to find, import, and maintain

## Reusability Matrix

| Component | Used In | Can Be Used In |
|-----------|---------|----------------|
| `InfoCard` | WhatIsMCP, WhatIsAPI | Any educational card |
| `StatusBadge` | SoftwareCard | Detail pages, headers |
| `StatsRow` | SoftwareCard | Project cards, dashboards |
| `TagList` | SoftwareCard | Blog posts, projects, filters |

## Benefits

### Code Quality
- ✅ Eliminated ~150+ lines of duplicate code
- ✅ Better separation of concerns
- ✅ Easier to test individual components
- ✅ Consistent styling across pages

### Maintainability
- ✅ Change status badge style once = updates everywhere
- ✅ Easy to add new info cards without copying code
- ✅ Clear component boundaries

### Developer Experience
- ✅ Faster development with reusable pieces
- ✅ Clear component names indicate purpose
- ✅ Logical file organization

## Next Steps

Based on user feedback about `CustomComponents.tsx` being the wrong approach:

1. **Break apart CustomComponents.tsx** into individual files:
   - `Foot.tsx` → Footer component
   - `TitleOfPage.tsx` → Page title component
   - `MyCards.tsx` → Project cards grid
   - etc.

2. **Organize by domain/feature**:
   - Portfolio components → `components/Portfolio/`
   - Navigation components → `components/Navigation/`
   - Form components → `components/Forms/`

3. **Continue extraction pattern**:
   - Look for repeated patterns in detail pages
   - Extract common sections (hero, features, etc.)
   - Create composable building blocks

## Testing Checklist

✅ All new components compile without errors
✅ TypeScript types properly defined
✅ Theme colors properly applied
✅ Responsive font sizing maintained
✅ API index shows WhatIsAPICard
✅ MCP index shows WhatIsMCPCard
✅ SoftwareCard displays correctly with new sub-components
