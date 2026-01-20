# Copilot Instructions

Generated from local MCP copilot guides.

## Source Guides
- Architecture (architecture) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/architecture.md
- State Management (state-management) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/stateManagement.md
- Database Architecture (database-architecture) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/databaseArchitecture.md
- Routing (routing) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/routing.md
- Styling (styling) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/styling.md
- Performance (performance) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/performance.md
- Animation (animation) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/animation.md
- Meta Tags (meta-tags) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/metaTags.md
- Offline First (offline-first) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/offlineFirst.md
- Plesk Deployment (plesk-deployment) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/pleskDeployment.md
- Build Scripts (build-scripts) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/buildScripts.md
- Index (index) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/index.md
- General (legacy) (general) -> file:///D:/SoftwareDev/MCPs/mrdj-app-mcp/guides/general.md

## Instructions
### Architecture

# Application Architecture

## Overview
PokePages follows a modular, scalable architecture built on modern React Native and web technologies. This document outlines the core architectural decisions and patterns used throughout the application.

## Tech Stack

### Core Framework
- **Expo SDK** - Universal React Native platform
- **Expo Router** - File-based routing system
- **TypeScript** - Type-safe development
- **React Native** - Cross-platform mobile & web

### Styling & UI
- **NativeWind 4.x** - Tailwind CSS for React Native
- **Custom Theme System** - Centralized color and typography
- **Expo Google Fonts** - Typography stack (Modak, Roboto, RobotoSlab, etc.)
- **Platform-specific extensions** - `.ios.tsx`, `.android.tsx`, `.web.tsx`

### State Management
- **Zustand** - Lightweight state management
  - Persistent stores with AsyncStorage
  - Atomic state updates
  - Selector hooks for optimal re-renders
- **React Context** - Used selectively for scoped state (e.g., Map filters)

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
- **Drizzle ORM** - Type-safe SQL query builder
- **PostgreSQL** - Primary database
- **Express API Server** - Custom API endpoints for complex operations

### Data Layer Architecture
```
┌─────────────────────────────────────────┐
│         Client Application              │
│  (React Native + Expo Router)          │
└──────────────┬──────────────────────────┘
               │
               ├─── Zustand Stores (Client State)
               │    ├─── authStore.ts
               │    ├─── dexTrackerStore.ts
               │    └─── onboardingStore.ts
               │
               ├─── Direct Supabase Client
               │    └─── Real-time subscriptions
               │    └─── Authentication
               │
               └─── Custom API Server (Express)
                    └─── Drizzle ORM Queries
                         └─── PostgreSQL Database
```

## File Structure

### Source Organization (`src/`)
```
src/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (drawer)/          # Main app with drawer navigation
│   ├── (onboarding)/      # Onboarding flow
│   ├── auth/              # Authentication screens
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   ├── Animation/         # Animated components
│   ├── Events/           # Event-related components
│   ├── Guides/           # Strategy guide components
│   ├── Meta/             # SEO & metadata components
│   ├── Pokedex/          # Pokémon data components
│   ├── Social/           # Social feature components
│   ├── TextTheme/        # Themed text components
│   └── UI/               # Generic UI components
├── constants/            # App constants & configuration
│   ├── style/           # Theme, colors, typography
│   └── *.json           # Configuration files
├── context/              # React Context providers
│   └── Map/             # Map-related context
├── db/                   # Database layer
│   ├── *Schema.ts       # Drizzle schemas
│   ├── *Queries.ts      # Database query functions
│   └── index.ts         # Database connection
├── hooks/                # Custom React hooks
├── middlewares/          # API middlewares
├── routes/              # API route handlers
├── services/            # Business logic services
├── store/               # Zustand stores
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Key Architectural Patterns

### 1. File-Based Routing (Expo Router)
- Routes automatically generated from file structure
- Dynamic routes with `[param]` syntax
- Nested layouts with `_layout.tsx`
- Route groups with `(group)` syntax

**Example:**
```
app/
  (drawer)/
    guides/
      PLZA/
        strategies/
          [id].tsx        → /guides/PLZA/strategies/:id
```

### 2. Platform-Specific Code
Use file extensions instead of runtime checks:
```typescript
// ❌ Avoid runtime checks
if (Platform.OS === 'ios') { ... }

// ✅ Use platform extensions
ProfileScreen.ios.tsx    // iOS-specific
ProfileScreen.android.tsx // Android-specific
ProfileScreen.tsx        // Default/shared
```

### 3. Schema-First Database Design
**Drizzle Schemas define the data model:**
```typescript
// eventsSchema.ts
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  pokemon: text('pokemon').notNull(),
  totalClaims: integer('total_claims').default(0),
  // ...
});

// Infer types from schema
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
```

### 4. Separation of Concerns

**Database Layer (`db/`):**
- Schema definitions
- Query functions
- No business logic

**Services Layer (`services/`):**
- Business logic
- Data transformation
- Complex operations

**Store Layer (`store/`):**
- Client state management
- Persistence
- Computed values

**Components:**
- Presentation only
- Use hooks for data
- Minimal logic

### 5. Type Safety Throughout
```typescript
// Types generated from database schemas
import type { Profile, Post, Event } from '@/src/db/*Schema';

// Zustand stores are fully typed
interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoggedIn: boolean;
  // ...
}

// Props are strictly typed
interface ComponentProps {
  title: string;
  onPress: () => void;
}
```

## Cross-Platform Considerations

### 1. Conditional Rendering
```typescript
import { Platform } from 'react-native';

// Platform-specific components
{Platform.select({
  ios: <IOSComponent />,
  android: <AndroidComponent />,
  web: <WebComponent />,
  default: <DefaultComponent />
})}
```

### 2. Storage Strategy
```typescript
// Cross-platform storage abstraction
const storage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  // ...
};
```

### 3. Navigation Differences
- Mobile: Drawer + Stack navigation
- Web: Supports browser back/forward
- Deep linking across all platforms

## Performance Optimizations

### 1. Code Splitting
- Expo Router lazy loads routes
- Async route loading for web builds
- Bundle optimization with Metro

### 2. Database Connection Pooling
```typescript
// Optimized for Supabase pooler
client = postgres(connectionString, {
  prepare: false,    // Required for pgbouncer
  max: 3,           // Minimal pool size
  idle_timeout: 20, // Timeout idle connections
  max_lifetime: 60 * 30, // Recycle connections
});
```

### 3. Selective State Management
- Use Zustand for global state
- Use Context for scoped/feature state
- Avoid prop drilling with selector hooks

### 4. Optimistic Updates
```typescript
// Update UI immediately, sync later
const { mutate } = useStore();
mutate((state) => {
  state.items.push(newItem);
}, false); // Don't revalidate immediately
```

## Security Patterns

### 1. Environment Variables
```typescript
// Access sensitive data securely
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

### 2. Authentication Flow
```
1. User signs in/up → Supabase Auth
2. Session stored → AsyncStorage (mobile) / localStorage (web)
3. Profile loaded → authStore
4. Protected routes → Check isLoggedIn
```

### 3. Row Level Security (RLS)
- Database-level permissions via Supabase
- Users can only access their own data
- Admin functions protected by roles

## API Architecture

### Client → API Flow
```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     ├─── Simple CRUD → Direct Supabase
     │
     └─── Complex Operations → Express API
          ├── Event counters
          ├── Batch operations
          └── Real-time updates
```

### API Server Structure
```
api-server/
├── src/
│   ├── routes/           # Route handlers
│   ├── middlewares/      # CORS, auth, logging
│   └── db/              # Database connection
└── data/                # Static data backup
```

## Deployment Strategy

### Mobile Apps
- **iOS & Android:** Expo EAS Build
- **OTA Updates:** Expo Updates for instant patches
- **App Store Distribution:** Standard app stores

### Web App
- **Static Export:** `expo export -p web`
- **Hosting:** Static site hosting (Vercel, Netlify, etc.)
- **SSG:** Pre-rendered routes for SEO

### API Server
- **Hosting:** Cloud platform (Railway, Render, etc.)
- **Database:** Supabase managed PostgreSQL
- **Environment:** Node.js + Express

## Scalability Considerations

### 1. Database Indexing
- Primary keys on all tables
- Indexes on frequently queried columns
- Composite indexes for complex queries

### 2. Caching Strategy
- Client-side caching with Zustand persist
- API response caching
- Static asset CDN

### 3. Rate Limiting
- API rate limits per user/IP
- Supabase connection pooling
- Throttled real-time subscriptions

## Development Workflow

### 1. Local Development
```bash
npm start          # Start Expo dev server
npm run api-server # Start Express API
npm run db:pull    # Pull schema from Supabase
npm run db:generate # Generate migrations
```

### 2. Type Generation
```bash
npm run db:pull    # Updates Drizzle schemas
# Types are automatically inferred
```

### 3. Testing Strategy
- Component testing (planned)
- E2E testing (planned)
- Manual testing across platforms

## Future Architecture Plans

### Planned Improvements
- [ ] Implement React Query for server state
- [ ] Add service workers for web PWA
- [ ] Implement background sync for offline support
- [ ] Add comprehensive error boundary system
- [ ] Implement analytics tracking
- [ ] Add performance monitoring (Sentry)
- [ ] Implement automated testing suite

### Scalability Roadmap
- [ ] Add Redis caching layer
- [ ] Implement CDN for media assets
- [ ] Add database read replicas
- [ ] Implement WebSocket for real-time features
- [ ] Add queue system for async operations

### State Management

# State Management with Zustand

## Overview
PokePages uses **Zustand** for client-side state management. Zustand provides a lightweight, atomic state management solution that's perfect for React Native applications requiring minimal boilerplate and maximum performance.

## Why Zustand?

### Advantages
✅ **Minimal boilerplate** - No providers, no context, no reducers
✅ **Atomic updates** - Granular subscriptions prevent unnecessary re-renders
✅ **TypeScript-first** - Full type inference and safety
✅ **Persistence built-in** - Easy integration with AsyncStorage
✅ **DevTools support** - Debug state changes
✅ **Selector hooks** - Optimize component rendering
✅ **Small bundle size** - < 1KB gzipped
✅ **React Native optimized** - Works seamlessly cross-platform

### Comparison to Alternatives
| Feature | Zustand | Redux | Context API | Jotai |
|---------|---------|-------|-------------|-------|
| Boilerplate | Minimal | High | Medium | Minimal |
| Performance | Excellent | Good | Poor (re-renders) | Excellent |
| Learning Curve | Easy | Steep | Easy | Easy |
| Persistence | Built-in | Middleware | Manual | Manual |
| TypeScript | Excellent | Good | Good | Excellent |
| Bundle Size | ~1KB | ~15KB | 0KB | ~3KB |

## Store Structure

### Current Stores
```
src/store/
├── authStore.ts              # Authentication & user state
├── dexTrackerStore.ts        # Pokémon collection tracking
├── favoriteFeaturesStore.ts  # User's favorite pages
└── onboardingStore.ts        # Onboarding flow state
```

## Implementation Patterns

### 1. Basic Store Setup
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StoreState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCountStore = create<StoreState>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    }),
    {
      name: 'count-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### 2. Complex Store (Auth Example)
```typescript
interface AuthState {
  // State
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoggedIn: boolean;
  loading: boolean;
  
  // Computed properties (derived state)
  isAdult: boolean;
  canUseSocialFeatures: boolean;
  isVip: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      session: null,
      isLoggedIn: false,
      loading: true,
      
      // Computed properties
      get isAdult() {
        const profile = get().profile;
        if (!profile?.dateOfBirth) return false;
        const age = calculateAge(profile.dateOfBirth);
        return age >= 18;
      },
      
      get canUseSocialFeatures() {
        return get().isLoggedIn && get().isAdult;
      },
      
      get isVip() {
        return get().profile?.vipStatus === true;
      },
      
      // Actions
      setUser: (user) => set({ user, isLoggedIn: !!user }),
      setProfile: (profile) => set({ profile }),
      setSession: (session) => set({ session }),
      
      signOut: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          profile: null,
          session: null,
          isLoggedIn: false,
        });
      },
      
      initializeAuth: async () => {
        // Complex initialization logic
        set({ loading: true });
        try {
          const { data } = await supabase.auth.getSession();
          // ... load user and profile
          set({ loading: false });
        } catch (error) {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Partial persistence - don't persist loading states
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        session: state.session,
      }),
    }
  )
);
```

### 3. Selector Hooks for Performance
```typescript
// ❌ Bad - Component re-renders on ANY state change
function Component() {
  const store = useAuthStore();
  return <Text>{store.user?.email}</Text>;
}

// ✅ Good - Only re-renders when email changes
function Component() {
  const email = useAuthStore((state) => state.user?.email);
  return <Text>{email}</Text>;
}

// ✅ Even Better - Custom selector hook
export const useUserEmail = () => {
  return useAuthStore((state) => state.user?.email);
};

function Component() {
  const email = useUserEmail();
  return <Text>{email}</Text>;
}

// ✅ Best - Multiple selectors in one hook
export const useUserWithProfile = () => {
  return useAuthStore((state) => ({
    user: state.user,
    profile: state.profile,
    isLoggedIn: state.isLoggedIn,
    isAdult: state.isAdult,
  }));
};
```

## Cross-Platform Storage

### Platform-Specific Implementations
```typescript
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cross-platform storage functions
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    console.error('Error getting storage item:', error);
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.error('Error setting storage item:', error);
  }
};

// Use in Zustand store
export const useStore = create<State>()(
  persist(
    (set) => ({ /* state */ }),
    {
      name: 'storage-key',
      storage: {
        getItem: getStorageItem,
        setItem: setStorageItem,
        removeItem: async (key) => {
          if (Platform.OS === 'web') {
            localStorage.removeItem(key);
          } else {
            await AsyncStorage.removeItem(key);
          }
        },
      },
    }
  )
);
```

## Best Practices

### 1. Store Organization
✅ **DO:** One store per feature/domain
```typescript
useAuthStore      // Authentication
useDexStore       // Pokédex tracking
useFavoritesStore // Favorites
```

❌ **DON'T:** One giant store
```typescript
useAppStore // Everything (bad!)
```

### 2. Computed Properties
✅ **DO:** Use getters for derived state
```typescript
get isAdult() {
  const profile = get().profile;
  return calculateAge(profile?.dateOfBirth) >= 18;
}
```

❌ **DON'T:** Store derived values
```typescript
isAdult: false, // Will get out of sync!
```

### 3. Actions Should Be Pure
✅ **DO:** Keep actions focused and predictable
```typescript
increment: () => set((state) => ({ count: state.count + 1 })),
```

❌ **DON'T:** Mix concerns
```typescript
increment: async () => {
  await api.logIncrement(); // Side effect!
  set((state) => ({ count: state.count + 1 }));
  analytics.track('incremented'); // Another side effect!
}
```

### 4. Use Selectors
✅ **DO:** Optimize with selectors
```typescript
const user = useAuthStore((state) => state.user);
```

❌ **DON'T:** Access entire store
```typescript
const { user, profile, session, loading, ... } = useAuthStore();
// Component re-renders when ANY property changes!
```

### 5. Persistence Strategy
✅ **DO:** Partial persistence
```typescript
persist(
  (set) => ({ /* store */ }),
  {
    name: 'storage',
    partialize: (state) => ({
      user: state.user,
      settings: state.settings,
      // Don't persist loading, error states
    }),
  }
)
```

## Real-World Examples

### Example 1: Dex Tracker Store
```typescript
interface DexTrackerState {
  trackedPokemon: Record<number, boolean>;
  shinyPokemon: Record<number, boolean>;
  addPokemon: (dexNumber: number) => void;
  removePokemon: (dexNumber: number) => void;
  toggleShiny: (dexNumber: number) => void;
  getTotalCaught: () => number;
}

export const useDexTrackerStore = create<DexTrackerState>()(
  persist(
    (set, get) => ({
      trackedPokemon: {},
      shinyPokemon: {},
      
      addPokemon: (dexNumber) =>
        set((state) => ({
          trackedPokemon: { ...state.trackedPokemon, [dexNumber]: true },
        })),
      
      removePokemon: (dexNumber) =>
        set((state) => {
          const { [dexNumber]: _, ...rest } = state.trackedPokemon;
          return { trackedPokemon: rest };
        }),
      
      toggleShiny: (dexNumber) =>
        set((state) => ({
          shinyPokemon: {
            ...state.shinyPokemon,
            [dexNumber]: !state.shinyPokemon[dexNumber],
          },
        })),
      
      getTotalCaught: () => Object.keys(get().trackedPokemon).length,
    }),
    {
      name: 'dex-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Example 2: Favorites Store
```typescript
interface FavoritesState {
  favorites: Record<string, boolean>;
  toggleFavorite: (key: string) => void;
  isFavorite: (key: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: {},
      
      toggleFavorite: (key) =>
        set((state) => ({
          favorites: {
            ...state.favorites,
            [key]: !state.favorites[key],
          },
        })),
      
      isFavorite: (key) => !!get().favorites[key],
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Usage in component
function FavoriteButton({ pageKey }: { pageKey: string }) {
  const isFavorite = useFavoritesStore((state) => state.isFavorite(pageKey));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  
  return (
    <Pressable onPress={() => toggleFavorite(pageKey)}>
      <Text>{isFavorite ? '⭐' : '☆'}</Text>
    </Pressable>
  );
}
```

## Debugging

### DevTools Integration
```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create<State>()(
  devtools(
    persist(
      (set) => ({ /* store */ }),
      { name: 'storage' }
    ),
    { name: 'MyStore' }
  )
);
```

### Logging Middleware
```typescript
const log = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('  applying', args);
      set(...args);
      console.log('  new state', get());
    },
    get,
    api
  );

export const useStore = create(log((set) => ({ /* store */ })));
```

## Performance Tips

### 1. Use Shallow Equality for Objects
```typescript
import { shallow } from 'zustand/shallow';

const { user, profile } = useAuthStore(
  (state) => ({ user: state.user, profile: state.profile }),
  shallow
);
```

### 2. Split Large Stores
Instead of one large store, split into multiple:
```typescript
useUserStore()      // User data
useSettingsStore()  // App settings
useUIStore()        // UI state (modals, etc.)
```

### 3. Avoid Nesting
```typescript
// ❌ Bad - Nested objects cause re-renders
const state = {
  user: {
    profile: {
      name: 'John'
    }
  }
}

// ✅ Good - Flat structure
const state = {
  userName: 'John',
  userId: '123',
}
```

## Migration from Context

### Before (Context)
```typescript
const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  // Every consumer re-renders when user changes!
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
```

### After (Zustand)
```typescript
export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// No provider needed!
// Components only re-render when their selected state changes
```

## Common Patterns

### 1. Loading States
```typescript
interface State {
  data: Data | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useDataStore = create<State>((set) => ({
  data: null,
  loading: false,
  error: null,
  
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.getData();
      set({ data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

### 2. Optimistic Updates
```typescript
addItem: async (item) => {
  // Optimistically update UI
  set((state) => ({ items: [...state.items, item] }));
  
  try {
    await api.addItem(item);
  } catch (error) {
    // Revert on error
    set((state) => ({
      items: state.items.filter((i) => i.id !== item.id),
    }));
  }
},
```

### 3. Reset Pattern
```typescript
const initialState = {
  user: null,
  profile: null,
  // ...
};

export const useAuthStore = create<State>((set) => ({
  ...initialState,
  
  reset: () => set(initialState),
  
  signOut: async () => {
    await api.signOut();
    set(initialState);
  },
}));
```

## Resources
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

### Database Architecture

# Database Architecture with Drizzle ORM & Supabase

## Overview
PokePages uses a modern database stack combining **Drizzle ORM** for type-safe queries and **Supabase** (PostgreSQL) for the database backend. This provides a robust, scalable, and developer-friendly data layer.

## Tech Stack

- **Drizzle ORM** - TypeScript-first ORM with full type inference
- **Supabase** - Backend as a Service with PostgreSQL
- **PostgreSQL** - Relational database
- **postgres.js** - Fast PostgreSQL client for Node.js

## Why This Stack?

### Drizzle ORM Benefits
✅ **Type-safe** - Full TypeScript inference from schema to queries
✅ **SQL-like** - Familiar SQL syntax, not abstracted away
✅ **Lightweight** - Minimal runtime overhead
✅ **Automatic migrations** - Schema changes generate migrations
✅ **Zero dependencies** - No heavy ORM baggage
✅ **Excellent DX** - Auto-completion and type checking
✅ **Performance** - Generates efficient SQL queries

### Supabase Benefits
✅ **PostgreSQL** - Industry-standard relational database
✅ **Real-time subscriptions** - WebSocket updates
✅ **Built-in auth** - Authentication and user management
✅ **Row Level Security** - Database-level permissions
✅ **Connection pooling** - PgBouncer for scalability
✅ **Automatic backups** - Point-in-time recovery
✅ **REST & GraphQL APIs** - Auto-generated from schema

## Database Architecture

### Schema Organization
```
src/db/
├── eventsSchema.ts           # Event tracking (Pokémon events)
├── eventClaimsSchema.ts      # User event claims
├── profilesSchema.ts         # User profiles
├── legendsZATrackerSchema.ts # Legends Z-A Pokédex tracker
├── socialSchema.ts           # Social features (posts, comments, etc.)
├── favoritesSchema.ts        # User favorites
├── relations.ts              # Table relationships
├── *Queries.ts               # Query functions per schema
└── index.ts                  # Database connection & setup
```

### Schema Pattern
Each schema file contains:
1. **Table definition** - Structure with Drizzle schema builder
2. **Type exports** - Inferred TypeScript types
3. **Zod validators** - Runtime validation schemas

## Example Schema Implementation

### 1. Define Schema (`eventsSchema.ts`)
```typescript
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  pokemon: text('pokemon').notNull().unique(),
  totalClaims: integer('total_claims').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types inferred from schema
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// Zod schemas for runtime validation
export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);

// Custom validation rules
export const eventValidation = insertEventSchema.extend({
  pokemon: z.string().min(1).max(50),
});
```

### 2. Create Query Functions (`eventsQueries.ts`)
```typescript
import { eq, desc } from 'drizzle-orm';
import { db } from './index';
import { events, type Event, type NewEvent } from './eventsSchema';

// Get all events
export async function getEvents(): Promise<Event[]> {
  return db.select().from(events).orderBy(desc(events.createdAt));
}

// Get event by pokemon name
export async function getEvent(pokemon: string): Promise<Event | undefined> {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.pokemon, pokemon))
    .limit(1);
  return event;
}

// Create new event
export async function createEvent(data: NewEvent): Promise<Event> {
  const [event] = await db.insert(events).values(data).returning();
  return event;
}

// Update event
export async function updateEvent(
  id: string,
  data: Partial<NewEvent>
): Promise<Event> {
  const [event] = await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();
  return event;
}

// Increment claim count
export async function incrementEventClaims(pokemon: string): Promise<void> {
  await db
    .update(events)
    .set({
      totalClaims: sql`${events.totalClaims} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(events.pokemon, pokemon));
}
```

### 3. Database Connection (`index.ts`)
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as profilesSchema from './profilesSchema';
import * as eventsSchema from './eventsSchema';
// ... import all schemas

const connectionString = process.env.DATABASE_URL!;

// Optimized connection pool for Supabase
export const client = postgres(connectionString, {
  prepare: false,        // Required for PgBouncer
  ssl: 'require',
  max: 3,               // Minimal pool size
  idle_timeout: 20,     // Close idle connections
  connect_timeout: 30,  // Connection timeout
  max_lifetime: 60 * 30, // Recycle connections after 30min
});

// Initialize Drizzle with all schemas
export const db = drizzle(client, {
  schema: {
    ...profilesSchema,
    ...eventsSchema,
    // ... all schemas
  },
});

// Health check function
export async function getDbPing() {
  try {
    const result = await db.execute('SELECT 1 as test');
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error };
  }
}
```

## Schema Patterns & Best Practices

### 1. Primary Keys
✅ **Use UUIDs for distributed systems**
```typescript
id: uuid('id').defaultRandom().primaryKey(),
```

✅ **Auto-increment for ordered data**
```typescript
id: serial('id').primaryKey(),
```

### 2. Timestamps
Always include created/updated timestamps:
```typescript
createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull(),
```

Update timestamp in queries:
```typescript
.set({ ...data, updatedAt: new Date() })
```

### 3. Foreign Keys
```typescript
export const eventClaims = pgTable('event_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
});
```

### 4. Indexes
```typescript
export const posts = pgTable('posts', {
  // ... columns
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  // Composite index for common query patterns
  userCreatedIdx: index('user_created_idx').on(
    table.userId, 
    table.createdAt
  ),
}));
```

### 5. Unique Constraints
```typescript
pokemon: text('pokemon').notNull().unique(),

// Or composite unique
}, (table) => ({
  uniqueUserEvent: unique().on(table.userId, table.eventId),
}));
```

## Relations

### Define Relations (`relations.ts`)
```typescript
import { relations } from 'drizzle-orm';
import { profiles } from './profilesSchema';
import { posts, comments } from './socialSchema';

// One-to-many: Profile -> Posts
export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

// Many-to-one: Post -> Profile
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(profiles, {
    fields: [posts.userId],
    references: [profiles.id],
  }),
  comments: many(comments),
}));

// Many-to-one: Comment -> Post and Profile
export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(profiles, {
    fields: [comments.userId],
    references: [profiles.id],
  }),
}));
```

### Query with Relations
```typescript
// Get post with author and comments
const postWithRelations = await db.query.posts.findFirst({
  where: eq(posts.id, postId),
  with: {
    author: true,
    comments: {
      with: {
        author: true,
      },
    },
  },
});
```

## Advanced Query Patterns

### 1. Complex Filtering
```typescript
import { and, or, eq, like, gt, isNull } from 'drizzle-orm';

const posts = await db
  .select()
  .from(posts)
  .where(
    and(
      eq(posts.published, true),
      or(
        like(posts.title, '%pokemon%'),
        like(posts.content, '%pokemon%')
      ),
      gt(posts.createdAt, new Date('2024-01-01')),
      isNull(posts.deletedAt)
    )
  );
```

### 2. Joins
```typescript
const postsWithAuthors = await db
  .select({
    post: posts,
    author: profiles,
  })
  .from(posts)
  .innerJoin(profiles, eq(posts.userId, profiles.id));
```

### 3. Aggregations
```typescript
import { count, sum, avg } from 'drizzle-orm';

const stats = await db
  .select({
    totalPosts: count(posts.id),
    totalLikes: sum(posts.likes),
    avgLikes: avg(posts.likes),
  })
  .from(posts)
  .where(eq(posts.userId, userId));
```

### 4. Pagination
```typescript
export async function getPaginatedPosts(
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;
  
  const posts = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
  
  const [{ count }] = await db
    .select({ count: count() })
    .from(posts);
  
  return {
    posts,
    total: count,
    page,
    pages: Math.ceil(count / limit),
  };
}
```

### 5. Transactions
```typescript
export async function createPostWithHashtags(
  postData: NewPost,
  hashtags: string[]
) {
  return await db.transaction(async (tx) => {
    // Insert post
    const [post] = await tx
      .insert(posts)
      .values(postData)
      .returning();
    
    // Insert hashtags
    for (const tag of hashtags) {
      const [hashtag] = await tx
        .insert(hashtagsTable)
        .values({ name: tag })
        .onConflictDoNothing()
        .returning();
      
      // Link hashtag to post
      await tx.insert(postHashtags).values({
        postId: post.id,
        hashtagId: hashtag.id,
      });
    }
    
    return post;
  });
}
```

## Migrations

### Generate Migration
```bash
npm run db:generate
```

This creates a migration file in `drizzle/` based on schema changes.

### Apply Migration
```bash
npm run db:migrate
```

### Pull Schema from Database
```bash
npm run db:pull
```

Useful for syncing with Supabase if changes were made through UI.

## Connection Pool Configuration

### Optimized for Supabase
```typescript
const client = postgres(connectionString, {
  prepare: false,        // REQUIRED for PgBouncer
  ssl: 'require',        // REQUIRED for Supabase
  max: 3,               // Small pool (Supabase has connection limits)
  idle_timeout: 20,     // Close idle after 20s
  connect_timeout: 30,  // 30s connection timeout
  max_lifetime: 1800,   // Recycle after 30min
});
```

### Why These Settings?
- **prepare: false** - PgBouncer (Supabase's pooler) doesn't support prepared statements
- **max: 3** - Small pool to avoid exhausting Supabase connection limit
- **idle_timeout: 20** - Aggressively close idle connections
- **max_lifetime: 1800** - Prevent stale connections

## Type Safety

### From Schema to Application
```typescript
// 1. Define schema
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').notNull(),
  // ...
});

// 2. Infer types
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

// 3. Use in application
function UserCard({ profile }: { profile: Profile }) {
  // TypeScript knows all Profile properties
  return <Text>{profile.username}</Text>;
}

// 4. Type-safe queries
const profile: Profile = await db.query.profiles.findFirst({
  where: eq(profiles.id, userId),
});
```

### Validation with Zod
```typescript
// Create Zod schema from Drizzle schema
export const insertProfileSchema = createInsertSchema(profiles);

// Extend with custom validation
export const profileValidation = insertProfileSchema.extend({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  dateOfBirth: z.coerce.date(),
});

// Use for validation
export async function createProfile(data: unknown) {
  // Throws if invalid
  const validData = profileValidation.parse(data);
  
  return db.insert(profiles).values(validData).returning();
}
```

## Performance Optimization

### 1. Select Only What You Need
```typescript
// ❌ Bad - Selects all columns
const posts = await db.select().from(posts);

// ✅ Good - Select specific columns
const posts = await db
  .select({
    id: posts.id,
    title: posts.title,
    createdAt: posts.createdAt,
  })
  .from(posts);
```

### 2. Use Indexes
```typescript
// Index frequently queried columns
export const posts = pgTable('posts', {
  // ... columns
}, (table) => ({
  userIdIdx: index().on(table.userId),
  createdAtIdx: index().on(table.createdAt),
}));
```

### 3. Batch Operations
```typescript
// ❌ Bad - Multiple queries
for (const item of items) {
  await db.insert(table).values(item);
}

// ✅ Good - Single batch insert
await db.insert(table).values(items);
```

### 4. Connection Pooling
Keep pool size small and recycle connections regularly.

## Security with Row Level Security (RLS)

Supabase allows database-level security policies:

```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own posts
CREATE POLICY "Users can update own posts"
  ON posts
  FOR UPDATE
  USING (auth.uid() = user_id);
```

Enable in Drizzle schema:
```typescript
export const profiles = pgTable('profiles', {
  // ... columns
}, (table) => ({
  // RLS is enabled via Supabase dashboard
  // But we can document it here
}));
```

## Backup & Recovery

### Automatic Backups
Supabase provides:
- **Daily automatic backups** (7-day retention on free tier)
- **Point-in-time recovery** (paid plans)
- **Manual snapshots** via dashboard

### Local Backup
```bash
# Backup to file
pg_dump $DATABASE_URL > backup.sql

# Restore from file
psql $DATABASE_URL < backup.sql
```

## Development Workflow

### 1. Make Schema Changes
```typescript
// Add new column to existing table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').notNull(),
  bio: text('bio'), // NEW COLUMN
});
```

### 2. Generate Migration
```bash
npm run db:generate
```

### 3. Review Migration
Check `drizzle/0001_*.sql` file

### 4. Apply to Database
```bash
npm run db:migrate
```

### 5. Update Types
Types are automatically updated from schema!

## Common Patterns

### Soft Deletes
```typescript
export const posts = pgTable('posts', {
  // ... other columns
  deletedAt: timestamp('deleted_at'),
});

// Soft delete
export async function softDeletePost(id: string) {
  await db
    .update(posts)
    .set({ deletedAt: new Date() })
    .where(eq(posts.id, id));
}

// Query only non-deleted
export async function getActivePosts() {
  return db
    .select()
    .from(posts)
    .where(isNull(posts.deletedAt));
}
```

### Audit Trails
```typescript
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(),
  tableName: text('table_name').notNull(),
  recordId: uuid('record_id').notNull(),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Polymorphic Associations
```typescript
// Likes can be on posts or comments
export const likes = pgTable('likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  likeableType: text('likeable_type').notNull(), // 'post' | 'comment'
  likeableId: uuid('likeable_id').notNull(),
});
```

## Resources
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [postgres.js GitHub](https://github.com/porsager/postgres)

### Routing

# Routing with Expo Router

## Overview
PokePages uses **Expo Router** - a file-based routing system for React Native and web. Routes are automatically generated from your file structure, providing a powerful and intuitive navigation system.

## Why Expo Router?

### Advantages
✅ **File-based routing** - Familiar to Next.js developers
✅ **Type-safe navigation** - TypeScript knows your routes
✅ **Deep linking** - Automatic URL support across platforms
✅ **Code splitting** - Lazy load routes for better performance
✅ **Shared routes** - Same routing code for mobile & web
✅ **Nested navigation** - Layouts and groups
✅ **Dynamic routes** - `/post/[id]` syntax
✅ **SEO friendly** - Web routes are actual URLs
✅ **Back navigation** - Built-in browser/device back button support

## File Structure = Route Structure

### Basic Routing
```
app/
├── index.tsx              → /
├── about.tsx              → /about
├── profile.tsx            → /profile
└── settings.tsx           → /settings
```

### Nested Routes
```
app/
├── index.tsx              → /
├── guides/
│   ├── index.tsx          → /guides
│   ├── beginner.tsx       → /guides/beginner
│   └── advanced.tsx       → /guides/advanced
```

### Dynamic Routes
```
app/
├── post/
│   └── [id].tsx           → /post/:id
├── user/
│   └── [username].tsx     → /user/:username
└── events/
    └── [event].tsx        → /events/:event
```

### Route Groups (No URL Segment)
```
app/
├── (drawer)/              → Navigation group, no URL
│   ├── home.tsx           → /home
│   ├── profile.tsx        → /profile
│   └── _layout.tsx        → Drawer layout
├── (onboarding)/          → Onboarding group, no URL
│   ├── index.tsx          → /onboarding
│   ├── step1.tsx          → /onboarding/step1
│   └── _layout.tsx        → Onboarding layout
```

## Real-World Example (PokePages Structure)

```
src/app/
├── _layout.tsx                      → Root layout (providers, fonts)
├── index.tsx                        → Redirect to main app
│
├── (drawer)/                        → Main app with drawer navigation
│   ├── _layout.tsx                  → Drawer navigator
│   ├── (tabs)/                      → Tab navigation
│   │   ├── _layout.tsx              → Tab bar layout
│   │   ├── index.tsx                → / (Home tab)
│   │   ├── pokedex.tsx              → /pokedex
│   │   └── social.tsx               → /social
│   │
│   ├── events/
│   │   ├── index.tsx                → /events
│   │   └── [event].tsx              → /events/:event
│   │
│   ├── guides/
│   │   ├── _layout.tsx              → Guides layout
│   │   ├── PLZA/
│   │   │   ├── index.tsx            → /guides/PLZA
│   │   │   └── strategies/
│   │   │       └── [id].tsx         → /guides/PLZA/strategies/:id
│   │
│   └── profile/
│       ├── index.tsx                → /profile
│       └── [username].tsx           → /profile/:username
│
├── (onboarding)/                    → Onboarding flow
│   ├── _layout.tsx
│   ├── index.tsx                    → /onboarding
│   ├── agreements.tsx               → /onboarding/agreements
│   └── final.tsx                    → /onboarding/final
│
├── auth/
│   ├── sign-in.tsx                  → /auth/sign-in
│   └── sign-up.tsx                  → /auth/sign-up
│
├── +not-found.tsx                   → 404 page
└── +html.tsx                        → Custom HTML root (web only)
```

## Layouts

### Root Layout (`_layout.tsx`)
```typescript
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="auth" />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

### Drawer Layout
```typescript
import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerType: 'slide',
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Home',
          drawerIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Drawer.Screen
        name="events"
        options={{
          title: 'Events',
          drawerIcon: ({ color }) => <EventIcon color={color} />,
        }}
      />
    </Drawer>
  );
}
```

### Tab Layout
```typescript
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="pokedex"
        options={{
          title: 'Pokédex',
          tabBarIcon: ({ color }) => <PokedexIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
```

## Navigation

### Basic Navigation
```typescript
import { router, Link } from 'expo-router';

// Programmatic navigation
function Component() {
  const handlePress = () => {
    router.push('/profile');
    // or
    router.navigate('/events');
    // or
    router.replace('/login'); // No back button
  };
  
  return <Button onPress={handlePress}>Go to Profile</Button>;
}

// Link component (better for web SEO)
function Component() {
  return (
    <Link href="/profile" asChild>
      <Pressable>
        <Text>Go to Profile</Text>
      </Pressable>
    </Link>
  );
}
```

### Navigate with Params
```typescript
// Navigate to dynamic route
router.push(`/post/${postId}`);
router.push({
  pathname: '/post/[id]',
  params: { id: postId },
});

// With query params
router.push({
  pathname: '/search',
  params: { q: 'pikachu', filter: 'electric' },
});
// → /search?q=pikachu&filter=electric
```

### Access Route Params
```typescript
import { useLocalSearchParams } from 'expo-router';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return <Text>Post ID: {id}</Text>;
}
```

### Navigation Methods
```typescript
// Push - Add to stack
router.push('/page');

// Navigate - Go to route (smart routing)
router.navigate('/page');

// Replace - Replace current route
router.replace('/page');

// Back - Go back
router.back();

// Can go back?
const canGoBack = router.canGoBack();

// Dismiss modal/sheet
router.dismiss();
```

## Dynamic Routes

### Single Dynamic Segment
```typescript
// app/events/[event].tsx
import { useLocalSearchParams } from 'expo-router';

export default function EventDetail() {
  const { event } = useLocalSearchParams<{ event: string }>();
  
  return <Text>Event: {event}</Text>;
}

// Navigate: router.push('/events/pikachu')
// URL: /events/pikachu
```

### Multiple Dynamic Segments
```typescript
// app/guides/[region]/[guide].tsx
import { useLocalSearchParams } from 'expo-router';

export default function GuideDetail() {
  const { region, guide } = useLocalSearchParams<{
    region: string;
    guide: string;
  }>();
  
  return <Text>{region} - {guide}</Text>;
}

// Navigate: router.push('/guides/kanto/gym-leaders')
// URL: /guides/kanto/gym-leaders
```

### Catch-All Routes
```typescript
// app/docs/[...slug].tsx
import { useLocalSearchParams } from 'expo-router';

export default function Docs() {
  const { slug } = useLocalSearchParams<{ slug: string[] }>();
  // slug will be an array of path segments
  
  return <Text>Docs: {slug.join('/')}</Text>;
}

// Navigate: router.push('/docs/api/reference/functions')
// slug: ['api', 'reference', 'functions']
```

## Modals & Sheets

### Modal Presentation
```typescript
// app/_layout.tsx
<Stack>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen
    name="settings"
    options={{
      presentation: 'modal',
      title: 'Settings',
    }}
  />
</Stack>
```

### Full-Screen Modal
```typescript
<Stack.Screen
  name="create-post"
  options={{
    presentation: 'modal',
    headerShown: true,
    title: 'Create Post',
    headerLeft: () => (
      <Pressable onPress={() => router.back()}>
        <Text>Cancel</Text>
      </Pressable>
    ),
  }}
/>
```

### Form Sheet (iOS)
```typescript
<Stack.Screen
  name="filter"
  options={{
    presentation: 'formSheet',
    sheetAllowedDetents: [0.5, 1], // Half and full height
  }}
/>
```

## Route Guards & Protection

### Redirect Based on Auth
```typescript
// app/_layout.tsx
import { useAuthStore } from '~/store/authStore';
import { Redirect } from 'expo-router';

export default function RootLayout() {
  const { isLoggedIn, loading } = useAuthStore();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isLoggedIn) {
    return <Redirect href="/auth/sign-in" />;
  }
  
  return <Stack>{/* routes */}</Stack>;
}
```

### Protected Route Component
```typescript
// components/ProtectedRoute.tsx
import { useAuthStore } from '~/store/authStore';
import { Redirect } from 'expo-router';

export function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuthStore();
  
  if (!isLoggedIn) {
    return <Redirect href="/auth/sign-in" />;
  }
  
  return children;
}

// Usage in route
export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
```

## Deep Linking

### Configure URL Scheme
```json
// app.json
{
  "expo": {
    "scheme": "pokepages",
    "web": {
      "bundler": "metro"
    }
  }
}
```

### Handle Deep Links
```typescript
// Deep link: pokepages://events/pikachu
// Opens: /events/pikachu

// Web URL: https://pokepages.app/events/pikachu
// Opens: /events/pikachu

// Both work automatically!
```

### Custom Link Handling
```typescript
import { useFocusEffect } from 'expo-router';
import { Linking } from 'react-native';

export default function Page() {
  useFocusEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link:', url);
      // Custom handling
    });
    
    return () => subscription.remove();
  });
}
```

## SEO & Meta Tags (Web)

### Head Component
```typescript
import Head from 'expo-router/head';

export default function Page() {
  return (
    <>
      <Head>
        <title>Page Title | PokePages</title>
        <meta name="description" content="Page description" />
        <meta property="og:title" content="Page Title" />
        <meta property="og:description" content="Page description" />
        <meta property="og:image" content="https://pokepages.app/og-image.png" />
        <link rel="canonical" href="https://pokepages.app/page" />
      </Head>
      
      <View>{/* Page content */}</View>
    </>
  );
}
```

### Dynamic Meta Tags
```typescript
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  
  return (
    <>
      <Head>
        <title>{post.title} | PokePages</title>
        <meta name="description" content={post.description} />
        <meta property="og:title" content={post.title} />
        <meta property="og:image" content={post.imageUrl} />
      </Head>
      
      <View>{/* Post content */}</View>
    </>
  );
}
```

## Static Rendering (Web)

### Generate Static Params
```typescript
// app/events/[event].tsx
export async function generateStaticParams() {
  const events = await getEvents();
  
  return events.map((event) => ({
    event: event.slug,
  }));
}

// Generates static pages at build time:
// /events/pikachu
// /events/charizard
// /events/mewtwo
```

### Incremental Static Regeneration
```typescript
export const revalidate = 60; // Revalidate every 60 seconds

export default function Page() {
  // This page will be regenerated at most once per minute
}
```

## Navigation Hooks

### useRouter
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/page');
router.back();
router.replace('/page');
```

### usePathname
```typescript
import { usePathname } from 'expo-router';

const pathname = usePathname();
// Current route: /events/pikachu → pathname: "/events/pikachu"
```

### useSearchParams
```typescript
import { useSearchParams } from 'expo-router';

const searchParams = useSearchParams();
// URL: /search?q=pikachu
// searchParams.get('q') → "pikachu"
```

### useSegments
```typescript
import { useSegments } from 'expo-router';

const segments = useSegments();
// URL: /guides/PLZA/strategies/123
// segments: ["guides", "PLZA", "strategies", "123"]
```

### useRootNavigationState
```typescript
import { useRootNavigationState } from 'expo-router';

const navigationState = useRootNavigationState();
const isReady = navigationState?.key != null;
```

## Best Practices

### 1. Route Organization
✅ **DO:** Group related routes
```
app/
├── (app)/           # Main app
├── (auth)/          # Authentication
└── (onboarding)/    # Onboarding
```

❌ **DON'T:** Flat structure for complex apps
```
app/
├── home.tsx
├── profile.tsx
├── login.tsx
├── signup.tsx
├── onboarding1.tsx
├── onboarding2.tsx
```

### 2. Navigation
✅ **DO:** Use Link for web SEO
```typescript
<Link href="/profile">Profile</Link>
```

❌ **DON'T:** Always use router.push
```typescript
<Pressable onPress={() => router.push('/profile')}>
```

### 3. Type Safety
✅ **DO:** Type your params
```typescript
const { id } = useLocalSearchParams<{ id: string }>();
```

❌ **DON'T:** Use any
```typescript
const { id } = useLocalSearchParams(); // id is any
```

### 4. Layouts
✅ **DO:** Share layouts via `_layout.tsx`
```
guides/
├── _layout.tsx      # Shared layout
├── beginner.tsx
└── advanced.tsx
```

❌ **DON'T:** Duplicate layout code
```typescript
// In each file
<Header />
<Content />
<Footer />
```

### 5. Dynamic Routes
✅ **DO:** Use descriptive param names
```
[username].tsx
[postId].tsx
[eventSlug].tsx
```

❌ **DON'T:** Generic names
```
[id].tsx
[item].tsx
[data].tsx
```

## Performance

### Lazy Loading
Routes are automatically code-split and lazy-loaded for web builds.

### Async Routes (Experimental)
```json
// app.json
{
  "expo": {
    "experiments": {
      "typedRoutes": true
    },
    "plugins": [
      [
        "expo-router",
        {
          "asyncRoutes": {
            "web": true,
            "default": "development"
          }
        }
      ]
    ]
  }
}
```

## Troubleshooting

### Routes Not Updating
Clear Metro bundler cache:
```bash
npm start -- --clear
```

### Type Errors
Regenerate types:
```bash
npx expo customize tsconfig.json
```

### Deep Links Not Working
Check URL scheme in `app.json` and rebuild app.

## Resources
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Expo Router GitHub](https://github.com/expo/expo/tree/main/packages/expo-router)
- [File-based Routing Guide](https://docs.expo.dev/routing/introduction/)

### Styling

# Styling with Uniwind (Tailwind for React Native)

## Overview
PokePages uses **Uniwind** - fast Tailwind `className` bindings for React Native.

Key mindset:
- Prefer `className` utilities over `StyleSheet.create()` for layout/spacing/typography.
- Keep design tokens + theming in **CSS** (Uniwind), not in `tailwind.config.js`.

## Why Uniwind?

### Advantages
- Familiar Tailwind class syntax
- Cross-platform styling (iOS/Android/Web)
- Build-time style computation (fast)
- Theming via CSS (no Tailwind config required)
- Pseudo-classes (e.g. `active:`) and responsive breakpoints

### Key Differences vs NativeWind
Uniwind’s important differences (relevant when migrating):
- **Tailwind 4 only** (you’ll need `tailwindcss@4`)
- Default `rem` is **16px** (NativeWind default was 14px)
- Themes live in **CSS**, not `tailwind.config.js`
- No NativeWind `ThemeProvider` required
- No automatic class dedupe on web (use `tailwind-merge` if you rely on conflicts)

## Setup

### Install
Follow the official quickstart: https://docs.uniwind.dev/quickstart

Typical packages:
```bash
npm install uniwind
npm install --save-dev tailwindcss@^4
```

### Metro configuration
Uniwind is wired through Metro via `withUniwindConfig`:
```js
// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
});
```

If you want to keep NativeWind’s old `rem = 14px` behavior (we probably don't and won't ever use this):
```js
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  polyfills: {
    rem: 14,
  },
});
```

### Global CSS
Uniwind uses Tailwind 4 CSS imports:
```css
/* src/global.css */
@import 'tailwindcss';
@import 'uniwind';

/* Theme + tokens (example pattern) */
@layer theme {
  :root {
    @variant light {
      --color-primary: #ef5350;
      --color-background: #fafafa;
      --color-typography: #212121;
    }

    @variant dark {
      --color-primary: #ef5350;
      --color-background: #121212;
      --color-typography: #ffffff;
    }
  }
}

/* Utilities / components */
@layer utilities {
  .typography-header {
    @apply text-4xl font-bold tracking-tight;
  }

  .typography-body {
    @apply text-base leading-6;
  }
}
```

Import the CSS once at your root entry (Expo Router root layout / app root):
```ts
import '@/global.css';
```

## Basic Usage

### Simple styling
```ts
import { Pressable, Text } from 'react-native';

export function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable className="bg-black px-4 py-3 rounded-lg active:opacity-80" onPress={onPress}>
      <Text className="text-white font-semibold text-center">{title}</Text>
    </Pressable>
  );
}
```

### Common patterns

Flex layouts:
```ts
<View className="flex-col gap-4" />
<View className="flex-row items-center gap-2" />
<View className="flex-1 justify-center items-center" />
<View className="flex-row justify-between items-center" />
```

Spacing:
```ts
<View className="p-4" />
<View className="px-4 py-2" />
<View className="mt-4 mb-2" />
<View className="flex-row gap-2" />
```

Dark mode:
```ts
<View className="bg-white dark:bg-black">
  <Text className="text-black dark:text-white">Hello</Text>
</View>
```

Responsive (breakpoints):
```ts
<View className="w-full md:w-1/2 lg:w-1/3" />
```

## Handling conditional / conflicting classNames

### Use `cn()` with `tailwind-merge`
Unlike NativeWind, Uniwind does not automatically deduplicate conflicting classNames (especially on web).
Use a `cn()` helper that merges classes:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Example:
```ts
<View className={cn('bg-red-500', isActive && 'bg-blue-500')} />
```

## Migration

### Migration from StyleSheet
Aim to migrate incrementally: start with layout + spacing + typography.

Before:
```ts
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
});

export function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Title</Text>
    </View>
  );
}
```

After:
```ts
import { Text, View } from 'react-native';

export function Screen() {
  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-2">Title</Text>
    </View>
  );
}
```

Notes:
- Prefer `gap-*` over `marginBottom` stacks where possible.
- If you have dynamic numeric styles, keep `style={{ ... }}` locally for that single value.

### Migration from NativeWind
Use the official guide as the source of truth: https://docs.uniwind.dev/migration-from-nativewind

Practical checklist:
1. Upgrade to `tailwindcss@4` (Uniwind requires Tailwind 4).
2. Remove the NativeWind Babel preset (`nativewind/babel`) from `babel.config.js`.
3. Replace NativeWind’s Metro config with Uniwind’s `withUniwindConfig`.
4. Update your `global.css` header to:
   ```css
   @import 'tailwindcss';
   @import 'uniwind';
   ```
5. Delete `nativewind.d.ts` (no longer needed).
6. Move theme/token configuration from `tailwind.config.js` into CSS (`@layer theme` + `@variant`).
7. Remove `tailwind.config.js` if it only existed for NativeWind theming.
8. If you had font families in `tailwind.config.js`, move them into CSS (Uniwind docs note RN doesn’t support font fallbacks).
9. Optional: set `polyfills.rem = 14` in Metro if you need old sizing behavior.
10. Remove NativeWind’s `ThemeProvider` (keep React Navigation’s theme provider if you use it).
11. If you used NativeWind’s `cssInterop`, migrate to Uniwind’s `withUniwind` API.
12. Safe area utilities:
    - If using open-source Uniwind, forward insets via `react-native-safe-area-context`:
      ```ts
      import { SafeAreaListener } from 'react-native-safe-area-context';
      import { Uniwind } from 'uniwind';

      export function App() {
        return (
          <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
            <View className="p-safe">{/* content */}</View>
          </SafeAreaListener>
        );
      }
      ```
13. If you relied on conflicting class ordering, adopt `tailwind-merge` (`cn()` above).

## Debugging & Tooling

### Editor support
Install **Tailwind CSS IntelliSense** in VS Code for autocomplete and hover previews.

### Docs lookup (Uniwind + NativeWind)
- Uniwind docs: https://docs.uniwind.dev/
- Uniwind migration from NativeWind: https://docs.uniwind.dev/migration-from-nativewind
- NativeWind docs: https://www.nativewind.dev/

This repo’s MCP server includes tools so you don’t have to paste URLs:
- `list-docs` — shows known docs ids (e.g. `uniwind`, `nativewind`)
- `search-docs` — searches docs by `docId` + `query`

Example lookups:
- `search-docs` with `docId=uniwind` and `query=ThemeProvider`
- `search-docs` with `docId=nativewind` and `query=cssInterop`

If you need an ad-hoc URL that isn’t in the registry yet, you can still use:
- `fetch-web-doc` with `url=...` and `query=...`

## Resources
- Uniwind: https://docs.uniwind.dev/
- Class names: https://docs.uniwind.dev/class-names
- Theming basics: https://docs.uniwind.dev/theming/basics
- FAQ (including `tailwind-merge` guidance): https://docs.uniwind.dev/faq
- Tailwind CSS (v4): https://tailwindcss.com/docs

### Performance

# React Native Performance & Best Practices Guide

## 1. App Startup Optimization (Time to Interactive - TTI)

### Minimize Startup Work
- **Don't load everything immediately** - users don't need all features in the first second
- Avoid putting 5-10 different functions in your first `useEffect` hook
- Don't initialize all tracking, load user data, and do everything upfront
- Lazy load what you can - don't load the user's complete medical record before they've signed in

### Use Profiling Tools
**React Native DevTools Profiler:**
- Hit "record" in the profiler, navigate your app, then stop profiling
- Identify views and functionalities that take the longest to render
- Look at seconds taken to render specific components

**Sentry Insights:**
- Provides nicer-looking insights from real apps in production
- Gives detailed information about what's happening in your real app

### Activate Async Routes with Expo Router
```json
{
  "expo-router": {
    "asyncRoutes": {
      "web": true,
      "default": "development"
    }
  }
}
```
- Components only mounted when required
- Not everything loaded initially
- ⚠️ **Caution:** Can improve startup time, but might decrease performance at later stages

### Use Expo Atlas
- Analyze the bundle of your application
- See all packages and modules included
- Identify packages taking up excessive time/space
- Some installed packages might be unexpectedly large

---

## 2. Avoiding Unnecessary Re-renders

### Understand Re-renders with DevTools
**Enable Highlight Updates:**
1. Open React Native DevTools Profiler
2. Click settings icon
3. Enable "Highlight updates when components render"
4. Navigate your app and see boxes appear when components render

**Analyze Flame Graphs:**
- Look for tall flames/bigger candles
- These indicate components loading slower

### Enable React Compiler
- **Expo SDK 54+:** Enabled by default
- **Below SDK 54:** Install Babel plugin and enable in `app.json`
- Automatically removes unnecessary `useMemo` and `useCallback` hooks
- Optimizes your app automatically

**Remember:** No reason to blame React Native for poor performance if your React code is poorly written in the first place.

---

## 3. Animation Performance (Target: 60 FPS)

### Show Performance Monitor
- Open DevTools → "Show perf monitor"
- See two numbers: UI thread and JavaScript thread
- Move around your app to identify where UI thread numbers drop
- Goal: Maintain 60 FPS at all times

### Avoid Blocking JavaScript Thread
- Use **Reanimated** or **Worklets** for smooth animations
- Move animations off the JavaScript thread
- Heavy computations should be on your backend when possible
- Use **React Transition API** for big computations that can't be moved to backend
  - Wrap computation in transition block
  - Observe with stages
  - Don't block JavaScript thread

---

## 4. List Performance Optimization

### Use Proper List Components
- ❌ **Avoid:** Default `FlatList` for complex cases
- ✅ **Use:** `FlashList` (tried and tested) or `LegendList` (newer, great JS implementation)
- Lists are where React Native performance often suffers most

### Efficient List Rendering
- **Pre-process your data** - don't calculate everything in render function
- Avoid rerendering everything on every change
- Don't put heavy computation in list render functions
- Works for `FlatList`, `FlashList`, and `LegendList`

### Understanding List Mutations
**Common Problems:**
- Incorrectly updating state → list doesn't rerender at all
- Unnecessarily rerendering entire list

**Solution:**
- Use **immutable updates** so React understands changes
- With React compiler or memoization, list items only rerender when required
- Update items correctly in terms of React patterns

---

## 5. State Management Best Practices

### Use Context Selectively
- ❌ **Don't:** Use context for everything (like using a fire hose to water a bonsai tree)
- ❌ **Don't:** Put every setting in one giant context
- ✅ **Do:** Have smaller contexts for specific cases (settings, users, theme)
- Context can quickly trigger unnecessary rerenders across entire component tree

### Use Proper State Management Libraries
**Recommended Libraries:**
- **Jotai** - Atomic state management
- **Zustand** - Most popular state management currently
- Both offer great performance
- Different implementations - try both to find your preference

---

## 6. Memory Leak Prevention

### Common Memory Leak Sources
- Event listeners not closed
- Intervals never cleared
- WebSocket connections never closed
- Async operations never cancelled
- Not using cleanup in `useEffect`

### Solutions
- Always use cleanup functions in `useEffect`
- Code might be longer, but necessary to prevent leaks
- Mobile apps stay in memory much longer than websites
- Small leaks compound over time → sluggish app or complete crashes
- Use profiling tools to identify JS memory leaks

**Important:** Write decent JavaScript/TypeScript code - there's no excuse.

---

## 7. Performance Measurement Tools

### React Native Profiling Documentation
- In-depth official documentation
- Learn to use regular React Native debugging tools

### Flashlight
- Generates performance score (like Lighthouse for browsers)
- Currently Android only (iOS support in development)

### Sentry Tracing
- Use in both front-end and back-end
- See full traces and pinpoint problems
- Identify slow API calls and database queries
- Include spans in your application
- Track specific operations

**Key Principle:** Measure first, optimize later. Always start with profiling.

---

## 8. Component Best Practices (2026)

### Prefer Pressable over TouchableOpacity
- ❌ **Stop using:** `TouchableOpacity` (outdated)
- ✅ **Use:** `Pressable` (comes with React Native)
- More events available: `onPressIn`, `onPressOut`, `onLongPress`
- More versatile and customizable

**Recommended Package:** `Presto` by Enso
- Abstraction from Pressable
- Automatic haptics and animations
- Configure haptics at entry point
- Can disable per-instance if needed

### Use Platform File Extensions
❌ **Avoid:** Runtime platform checks everywhere
```javascript
// Bad: Runtime checks
if (Platform.OS === 'ios') {
  // iOS code
}
```

✅ **Use:** Platform-specific files
```
ProfileScreen.tsx          // Default for all platforms
ProfileScreen.ios.tsx      // iOS-specific
ProfileScreen.android.tsx  // Android-specific
ProfileScreen.native.tsx   // iOS + Android
ProfileScreen.web.tsx      // Web-specific
```
- Easier to understand and maintain
- Better for native functionality (e.g., Expo UI Swift)
- Scales better as app grows

### Prefer Form Sheets over Modals (iOS)
- ✅ **Use:** Presentation form sheets instead of modals
- Beautiful blur background with liquid glass effect (iOS 18+)
- Can constrain detents (e.g., 45% of screen)
- User can expand/collapse
- More native feel than modal views
- Works on Android (present as modal with slide-from-bottom animation)

### Prefer FlatList over ScrollView
**When to use ScrollView:**
- Short, known lists (e.g., 3-4 items)

**When to use FlatList/LegendList:**
- Data from APIs
- Long lists
- Unknown list lengths

**FlatList Benefits:**
- `ListEmptyComponent` - automatically render when array is empty
- `ListHeaderComponent` - sticky headers
- Many other helpful properties
- Better performance for large datasets

**Pro Tip:** Use `contentInsetAdjustmentBehavior="automatic"` instead of wrapping in `SafeAreaView`
- Works with both `ScrollView` and `FlatList`
- Respects large headers on iOS
- Content fits nicely within scroll area

### Keep App Routes Lean
**With Expo Router:**
- Keep files in `/app` folder focused on routing only
- Don't add logic, state, data fetching in route files
- Import screen components from `/components` or `/screens`

```typescript
// Good: app/paywall.tsx
export default function PaywallRoute() {
  return <PaywallScreen />;
}

// Bad: app/paywall.tsx
export default function PaywallRoute() {
  const [data, setData] = useState();
  // lots of logic here...
}
```

**Benefits:**
- Easy refactoring
- Can reuse screens in multiple routes
- Present in different ways if needed
- Simpler navigation updates
- Easier to maintain and scale

---

## 9. Understanding JavaScript vs UI Thread

### Thread Responsibilities

**JavaScript Thread (Yellow):**
- Where React code lives
- Logic, state updates, API calls
- Decides what should be shown
- Doesn't draw anything on UI

**UI Thread (Blue/Main Thread):**
- Handles everything you see
- Rendering views
- Handling touches
- Running animations
- All visuals

### How Threads Work Together
1. JavaScript thread processes events (button press, state change)
2. JavaScript thread sends render request to UI thread
3. UI thread repaints/refreshes the UI
4. User sees the update

**Performance Issue:** If you block JavaScript thread with heavy computation, entire app freezes.

---

## 10. React Compiler (Expo SDK 54+)

### Enabling/Disabling
```json
// app.json
{
  "experiments": {
    "reactCompiler": true  // true by default in SDK 54+
  }
}
```

### What It Does
- Automatically prevents unnecessary re-renders
- Memoizes components and functions
- Works without manual `useMemo` or `useCallback`
- Significantly improves performance

### Health Check
```bash
npx react-compiler-healthcheck@latest
```
- Checks if your project can adopt React compiler
- Identifies issues preventing adoption

### VS Code Extension
**React Compiler Marker:**
- Shows if components are optimized for React compiler
- Real-time feedback while coding
- Helps identify issues immediately

---

## 11. Multi-Threading with React Native Worklets

### What Are Worklets?
- Similar to Web Workers
- Allow multi-threading in React Native
- Offload heavy computations to separate thread
- Keep app responsive during heavy tasks

### Basic Usage
```typescript
import { createWorkletRuntime, runOnRuntime } from 'react-native-worklets';

// Create runtime
const workerRuntime = createWorkletRuntime('worker', () => {
  console.log('Worker runtime initialized');
});

// Run heavy computation
runOnRuntime(workerRuntime, () => {
  'worklet'; // Required directive
  // Heavy computation here
  // This runs on separate thread
});
```

### Benefits
- JavaScript thread stays free
- App remains responsive
- Heavy computations don't block UI
- Perfect for:
  - Real-time data processing
  - Math-heavy logic
  - Image processing
  - Complex calculations

### How It Works
1. User triggers action (e.g., button press)
2. Event received in JS thread
3. Heavy task offloaded to worklet thread
4. Worklet thread processes (may be blocked)
5. JS thread continues processing other tasks
6. UI thread remains responsive
7. Result sent back to JS thread
8. State updated and UI refreshed

---

## 12. Best Practices Checklist

### Code Quality
- ✅ Use TypeScript
- ✅ Use static JavaScript features (`const`, `let`, not `var`)
- ✅ Use `import`/`export` (not `require` except for assets)
- ✅ Enable ESLint and static analysis
- ✅ Write decent React code first

### Performance
- ✅ Test on real devices (not simulator)
- ✅ Use React compiler (SDK 54+)
- ✅ Use latest APIs (e.g., `use` hook instead of custom context hooks)
- ✅ Minimize startup work
- ✅ Lazy load features
- ✅ Avoid blocking UI thread
- ✅ Use proper list components (FlashList/LegendList)
- ✅ Choose appropriate state management

### Measurement
- ✅ Profile first, optimize later
- ✅ Use React Native DevTools
- ✅ Use Sentry tracing
- ✅ Use Flashlight (Android)
- ✅ Know your numbers (measure improvements)
- ✅ Track performance metrics

---

## Performance Goals

**60 FPS** - The threshold at which your app feels truly native
- Better user reviews
- Longer session times
- Fewer abandoned interactions
- More engaged users

### Animation

# Animations with React Native Reanimated

## Overview
PokePages uses **React Native Reanimated** for high-performance animations that run on the UI thread. This avoids jank, keeps 60 FPS, and enables gesture-driven interactions.

## Why Reanimated?
✅ Runs on the UI thread (worklets) → no JS thread blocking
✅ Declarative + imperative APIs
✅ Gesture-driven animations with `react-native-gesture-handler`
✅ Layout animations, shared values, and derived values
✅ Works across iOS, Android, and Web (with Hermes)

## Setup Checklist
- Install Reanimated and Gesture Handler (already in project)
- Enable Reanimated Babel plugin (Expo handles this)
- Keep `react-native-gesture-handler` at the root: `GestureHandlerRootView` in `_layout.tsx`
- Use Hermes engine (default for Expo SDK 50+)

## Core Patterns

### 1) Shared Values (state on UI thread)
```tsx
const progress = useSharedValue(0);
```

### 2) Derived/Animated Styles
```tsx
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: 1 + progress.value * 0.2 }],
  opacity: 0.6 + progress.value * 0.4,
}));

return <Animated.View style={animatedStyle} />;
```

### 3) Animations
```tsx
progress.value = withTiming(1, { duration: 500 });
progress.value = withSpring(1, { damping: 15, stiffness: 150 });
progress.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
```

### 4) Gestures
```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const pan = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
    translateY.value = e.translationY;
  })
  .onEnd(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  });

return (
  <GestureDetector gesture={pan}>
    <Animated.View style={animatedStyle} />
  </GestureDetector>
);
```

### 5) Layout Animations
```tsx
import { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

<Animated.View
  entering={FadeIn.duration(250)}
  exiting={FadeOut.duration(200)}
  layout={Layout.springify()}
>
  {children}
</Animated.View>
```

## Usage Examples in PokePages
- `components/Animation/HelloWave.tsx` uses `useSharedValue`, `withRepeat`, `withSequence`, `withTiming` to drive a looping wave.
- Drawer/tab layouts and guide screens use Reanimated shared values for scroll/gesture-driven UI polish.
- Ensure all animated wrappers use `Animated.View`/`Animated.Text` instead of plain primitives when styles depend on shared values.

## Performance Guidelines
- Prefer Reanimated over `Animated` for complex/interactive animations.
- Keep heavy calculations off the JS thread; do math inside worklets.
- Avoid allocating new objects/functions every frame—derive inside `useAnimatedStyle`.
- Use `withTiming` for deterministic transitions, `withSpring` for natural motion, `withRepeat` for loops.
- Combine with `react-native-gesture-handler` for touch/drag interactions.

## Safety / Gotchas
- Animated styles must be serializable (no functions/Date/Map, etc.).
- Don’t read mutable JS refs inside worklets—use shared values instead.
- When mixing with React state, sync by setting shared values in effects.
- Ensure `GestureHandlerRootView` wraps the app (already in `_layout.tsx`).

## Debugging
- Use the performance monitor to watch UI vs JS thread load.
- If animation janks: check for JS thread blocks (expensive loops, heavy renders).
- Validate that Hermes is enabled (Expo default) for best Reanimated support.

## Quick Patterns
- **Pulse:** `withRepeat(withTiming(1, { duration: 800 }), -1, true)` on scale/opacity.
- **Press feedback:** on press in → `withSpring(0.94)`, on release → `withSpring(1)`.
- **List item mount:** `entering={FadeInDown.springify()}` for cards/rows.
- **Sticky headers:** drive translateY with scroll shared values.

## References
- Official docs: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/
- Gesture Handler: https://docs.swmansion.com/react-native-gesture-handler/docs

### Meta Tags

# SEO & Shareability Implementation Guide for Poké Pages

## Overview
This guide provides step-by-step instructions for implementing comprehensive SEO meta tags and social media shareability across all pages in the Poké Pages Expo Router app. Based on our analysis, we'll add Open Graph, Twitter Cards, structured data, and other SEO elements to improve search rankings and social sharing previews.

## Prerequisites
- Import `Head` from `expo-router/head` in each page component
- Define page-specific title, description, and keywords variables
- Use the web URL `https://pokepages.app` for canonical links

## Heading Hierarchy & Accessibility Guidelines

### Proper Heading Structure
Every page MUST have proper heading hierarchy for SEO and accessibility:

1. **H1 (Level 1 Heading)**: 
   - Use `typography-header` class with Modak font
   - Must appear exactly ONCE per page as the main page title
   - Should be the first major heading users see
   - Use `accessibilityRole="header"` and `accessibilityLevel={1}` on React Native Text components
   ```tsx
   <Text 
     className="typography-header text-app-text dark:text-dark-app-text" 
     style={{ fontFamily: 'Modak' }}
     accessibilityRole="header"
     accessibilityLevel={1}
   >
     {pageTitle}
   </Text>
   ```

2. **H2 (Level 2 Headings)**:
   - Use `typography-subheader` class
   - Can appear multiple times per page for major sections
   - Use `accessibilityRole="header"` and `accessibilityLevel={2}` on React Native Text components
   ```tsx
   <Text 
     className="typography-subheader text-app-text dark:text-dark-app-text"
     accessibilityRole="header"
     accessibilityLevel={2}
   >
     Section Title
   </Text>
   ```

3. **Semantic Structure**:
   - Never skip heading levels (don't jump from h1 to h3)
   - Headings should create a logical outline of page content
   - Use appropriate ARIA labels for screen readers

### Button Accessibility
All interactive buttons should use the Press Start 2P font for consistent game-style UI:
```tsx
<Pressable>
  <Text 
    style={{ fontFamily: 'PressStart2P', fontSize: 10 }}
    className="text-app-white"
  >
    Button Text
  </Text>
</Pressable>
```

## Core Meta Tags Template

### For Each Page Component:
1. **Import Head**: Add `import Head from 'expo-router/head';` at the top
2. **Define SEO Variables**: Create title, description, and keywords constants
3. **Add Head Component**: Place the Head component inside the return statement, before other JSX

### Basic Template:
```tsx
// At the top of your component
const title = 'Page Title | Poké Pages';
const description = 'Page description under 160 characters';
const keywords = 'keyword1, keyword2, pokemon related terms';

// Inside return statement, before other JSX
<Head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="keywords" content={keywords} />

  {/* Open Graph / Facebook */}
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:site_name" content="Poké Pages" />
  <meta property="og:url" content="https://pokepages.app/current-page-path" />
  <meta property="og:image" content="https://pokepages.app/images/page-preview.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  {/* Twitter Cards */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content="https://pokepages.app/images/page-preview.jpg" />

  {/* Additional SEO */}
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="author" content="Poké Pages" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://pokepages.app/current-page-path" />
</Head>
```

## Page-Specific Implementation

### 1. Home Page (`src/app/(drawer)/index.tsx`) - ✅ COMPLETED
- **Title**: "Poké Pages | The Ultimate Pokémon Companion App"
- **Description**: Focus on community, events, and features
- **Keywords**: Pokemon events, community, strategies, news
- **Image**: `home-preview.png`

### 2. Events (`src/app/(drawer)/events/index.tsx`) - ✅ COMPLETED
- **Title**: "Pokémon Events | Global Challenge Events & Mystery Gifts | PokePages"
- **Description**: Global Pokemon challenge events and Mystery Gift rewards
- **Keywords**: Pokemon events, mystery gift, global challenge, raids
- **Image**: `events-preview.png`

### 3. Type Analyzer (`src/app/(drawer)/resources/type/analyzer.tsx`) - ✅ COMPLETED
- **Title**: "Pokémon Type Analyzer | Type Effectiveness Calculator | PokePages"
- **Description**: Focus on calculator functionality
- **Keywords**: Type effectiveness, pokemon types, calculator
- **Image**: (uses analyzer-specific image)

### 4. Type Info (`src/app/(drawer)/resources/type/info.tsx`) - ✅ COMPLETED
- **Title**: "Pokémon Type Information | Type Colors & Pokémon Lists | PokePages"
- **Description**: Type information with colors and Pokemon lists
- **Keywords**: Pokemon types, type colors, dual types
- **Image**: `type-info-preview.png`

### 5. Ask AI (`src/app/(drawer)/resources/ask.tsx`) - ✅ COMPLETED
- **Title**: "Ask AI About Pokémon | AI-Powered Pokémon Assistant | PokePages"
- **Description**: AI assistant for Pokemon questions
- **Keywords**: Pokemon AI, assistant, questions
- **Image**: `ask-ai-preview.png`

### 6. PLZA Strategies (`src/app/(drawer)/guides/PLZA/strategies/index.tsx`) - ✅ COMPLETED
- **Title**: "Pokémon Legends Z-A Strategies & Guides | PokePages"
- **Description**: Complete strategy guides for Legends Z-A
- **Keywords**: Pokemon legends za strategies, guides, shiny hunting
- **Image**: `plza-strategies-preview.png`

### 7. Social Hub (`src/app/(drawer)/social/index.tsx`) - ✅ COMPLETED
- **Title**: "Social Hub | Connect with Pokémon Trainers | PokePages"
- **Description**: Connect with fellow trainers
- **Keywords**: Pokemon social, community, trainer network
- **Image**: `social-preview.png`

### 8. Social Feed (`src/app/(drawer)/social/(tabs)/feed.tsx`) - ✅ COMPLETED
- **Title**: "Social Feed | Pokémon Trainer Community | PokePages"
- **Description**: Explore posts from the community
- **Keywords**: Pokemon feed, trainer posts, community
- **Image**: `feed-preview.png`

### 9. Messages (`src/app/(drawer)/social/(tabs)/messages.tsx`) - ✅ COMPLETED
- **Title**: "Messages | Trainer Conversations | PokePages"
- **Description**: Connect through direct messages
- **Keywords**: Pokemon messages, trainer chat
- **Image**: `messages-preview.png`
- **Note**: Uses `noindex, nofollow` for privacy

### 10. Create Post (`src/app/(drawer)/social/(tabs)/post.tsx`) - ✅ COMPLETED
- **Title**: "Create Post | Share Your Pokémon Adventure | PokePages"
- **Description**: Share your Pokemon journey
- **Keywords**: Create pokemon post, share pokemon
- **Image**: `post-preview.png`
- **Note**: Uses `noindex, nofollow` for user-generated content

### Remaining Pages - TODO
Apply the template to:
- `/guides/gen9/*` pages (map, strategies, raid-counter, top50)
- `/guides/PLZA/*` individual strategy pages
- `/events/[counterEvent]` dynamic event pages
- Individual conversation pages

## Advanced SEO Features

### Structured Data (Schema.org)
For content-rich pages, add JSON-LD structured data:

```tsx
// Define structured data object
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage", // or Article, CollectionPage, etc.
  "headline": title,
  "description": description,
  "author": {
    "@type": "Organization",
    "name": "PokePages"
  },
  "publisher": {
    "@type": "Organization",
    "name": "PokePages"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://pokepages.app/page-path"
  },
  "keywords": keywords,
  // Add page-specific entities (VideoGame, Article, etc.)
};

// Add to Head component
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(structuredData),
  }}
/>
```

### Open Graph Images
To improve social sharing, add:
```tsx
<meta property="og:image" content="https://pokepages.app/images/page-preview.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

## Implementation Checklist

### For Each Page:
- [ ] Import Head from expo-router/head
- [ ] Define title (50-60 chars)
- [ ] Define description (150-160 chars)
- [ ] Define relevant keywords
- [ ] Add basic meta tags (including og:image)
- [ ] Add Open Graph tags
- [ ] Add Twitter Card tags
- [ ] Add canonical URL
- [ ] Test on web build

### Global Considerations:
- [ ] Create reusable SEO component for consistency
- [ ] Add og:image to all pages
- [ ] Implement structured data where appropriate
- [ ] Test social sharing from web URLs
- [ ] Verify mobile responsiveness

## Testing & Validation

### SEO Testing:
1. **Web Build**: Run `npx expo export --platform web`
2. **Meta Tag Checker**: Use tools like:
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Google Rich Results Test: https://search.google.com/test/rich-results

### Shareability Testing:
1. Copy page URL from web build
2. Paste in Facebook/Twitter post composer
3. Verify rich preview appears with correct title, description, and image

## Best Practices

### Content Guidelines:
- **Titles**: Include brand name, be descriptive, under 60 characters
- **Descriptions**: Compelling, keyword-rich, under 160 characters
- **Keywords**: Relevant Pokemon terms, avoid keyword stuffing
- **URLs**: Use clean, descriptive paths for canonical links

### Technical Guidelines:
- **Canonical URLs**: Always point to https://pokepages.app
- **Robots Meta**: Use "index, follow" for public pages
- **Viewport**: Essential for mobile SEO
- **Author**: Consistent branding

### Social Media Specific:
- **Open Graph**: Required for Facebook, LinkedIn, Discord
- **Twitter Cards**: Use "summary_large_image" for better visibility
- **Images**: 1200x630px recommended for OG images

## Priority Implementation Order

1. **High Priority**: Home page, type analyzer, main feature pages
2. **Medium Priority**: Guide pages, event pages
3. **Low Priority**: Profile pages, secondary features

## Notes for GitHub Copilot
When implementing:
- Always include 3-5 lines of context when editing
- Use replace_string_in_file for efficiency
- Test changes in web build
- Follow the established pattern from existing pages
- Suggest improvements based on page content

## Notes for Developer
- Update meta content when page content changes
- Monitor Google Search Console for indexing
- Track social shares and engagement
- Regularly test meta tags after updates
- Consider adding sitemap.xml for better crawling

### Offline First

What “offline-first” really means (and why it matters)

Offline-first apps treat the local device (or browser) database as the primary source of truth — reads and writes happen locally first instead of relying on immediate server communication. 
Expo Documentation
+1

When online, the app syncs changes (writes, updates, deletions) with the server (or remote backend). This means the app remains usable even with poor or no network — improving UX, resiliency, and responsiveness. 
Expo Documentation
+2
Canadian Software Agency Inc.
+2

For a unified codebase serving both mobile (iOS/Android) and web (PWA or web build), that approach makes a lot of sense: data should be accessible in both contexts, sync across devices, and degrade gracefully when offline. 
Relevant Software
+1

Because of these benefits, many libraries and architectures lean toward "local-first + sync" rather than "always online." 
Expo Documentation
+1

🛠 Key technical building blocks

These are the main pieces you’ll need — or should consider — when building offline-first with Expo + React Native + Web.

Function / responsibility	Typical solution or tool (mobile + web)
Local storage / database	For simple data: key-value (settings, tokens) → e.g. @react-native-async-storage/async-storage. 
Coding Easy Peasy
+1

For structured data / complex queries: SQLite (via Expo), or databases like WatermelonDB, Realm, or similar. 
Canadian Software Agency Inc.
+2
Syndell Technologies
+2

Network status detection	Use a connectivity monitoring library — e.g. @react-native-community/netinfo — so the app knows when it's offline vs online. 
Canadian Software Agency Inc.
+2
MoldStud
+2

Sync / queue system — for writes done offline to send when online	Maintain a local queue of actions/changes made offline. When connectivity returns, replay / sync queued writes to server. 
Relevant Software
+2
iFlair Web Technologies
+2

For mobile (Expo) you can use background-task or background-fetch APIs to periodically attempt sync. 
Canadian Software Agency Inc.
+1

Conflict detection & resolution (if multiple devices or concurrent edits possible)	Use versioning or timestamp-based metadata. On sync, detect conflicts and decide a strategy (e.g. “last write wins” or merge). Many offline-first guides suggest tracking metadata fields such as lastModifiedAt, isDirty, version. 
Canadian Software Agency Inc.
+2
Coding Easy Peasy
+2

State management + persistence	Use state libraries that can persist data locally across sessions — e.g. Redux Persist, or a reactive database like WatermelonDB which loads data only when needed. 
iFlair Web Technologies
+1

(For web build) Offline / PWA caching & storage	Use browser-compatible storage: e.g. IndexedDB (via libraries like PouchDB) or caching strategies so data/asset retrieval works when no network. For PWAs, background sync / service-worker-based sync helps mirror native-mobile offline patterns. 
codekeel.com
+2
MoldStud
+2
🎯 Best Practices & Architectural Guidelines

Here are more high-level, strategic guidelines — especially useful when starting a new project with offline-first in mind.

Design for offline from day one
Don’t treat offline support as a “later feature.” From the outset: define which data must be accessible offline (user data, content, preferences…), and design your data models accordingly. 
Canadian Software Agency Inc.
+1

Also design your UI/UX with offline scenarios in mind (e.g. show offline status, grey out features that require server). 
Coding Easy Peasy
+1

Use a layered storage approach
For simple config or small data, key-value storage is fine. But for structured data (lists, objects, relationships) use a local database (SQLite, Realm, WatermelonDB, etc.). 
Canadian Software Agency Inc.
+1

This layered strategy helps optimize performance and storage usage while preserving flexibility.

Queue offline writes + use background sync
When user performs actions offline (form submissions, updates, creating items, etc.), store them in a queue. When connectivity returns, flush that queue by syncing to server. 
Relevant Software
+2
iFlair Web Technologies
+2

On mobile (with Expo), use background-fetch / background-tasks so sync can happen even if the app was closed. 
Canadian Software Agency Inc.
+1

Use optimistic UI + local updates for instant feedback
As soon as user performs an action (e.g. adds a record), update the local storage/state and UI immediately (optimistic update). Then sync to server in background. This keeps the app responsive even offline. 
Expo Documentation
+2
MoldStud
+2

Conflict resolution strategy
If multiple devices or web + mobile clients can edit same data, when syncing, you must detect conflicts. Common methods: timestamp-based “last-write-wins.” Once that works, you can consider more robust merge logic if needed. 
Canadian Software Agency Inc.
+2
iFlair Web Technologies
+2

Make sure to store metadata (e.g. lastModified, isDirty) in your data model so conflict resolution is easier. 
Canadian Software Agency Inc.
+1

Provide clear offline UI/UX & feedback
Let users know when they are offline and when the app is syncing. E.g. show offline banner, sync status, maybe a “sync now” button. 
iFlair Web Technologies
+1

Handle failed sync gracefully: retry, queue failures, alert the user if needed, ensure data isn’t lost. 
Canadian Software Agency Inc.
+1

Minimize data transfer & sync only “deltas”
When syncing, avoid sending all data. Instead, only sync changes — i.e. what’s new, changed, or deleted since last sync. This reduces bandwidth, improves performance, and avoids redundant writes. 
Relevant Software
+2
Syndell Technologies
+2

Also implement pagination / lazy loading for large datasets, to avoid loading everything at once unnecessarily. 
Canadian Software Agency Inc.
+1

Test thoroughly under offline / flaky network conditions
Simulate offline mode, network flapping (going on/off), slow networks, background/foreground transitions — especially on mobile — to ensure sync logic, queueing, conflict resolution, UI feedback works correctly. 
Canadian Software Agency Inc.
+2
MoldStud
+2

⚠️ Pitfalls & Things to Watch Out For (especially when supporting both web and mobile)

Some storage or sync libraries work better on mobile than web — or vice versa. For example, a library built with SQLite may run fine on mobile but might not have a straightforward web equivalent. That means you need a careful abstraction layer. 
Canadian Software Agency Inc.
+2
Syndell Technologies
+2

If using web + mobile, you might need separate implementations under the hood: e.g. local database (SQLite) on mobile, but IndexedDB (or similar) on web. That means you need a unified “data access layer” abstraction so your UI/business logic doesn’t care where data comes from.

Sync conflicts — without proper versioning or conflict resolution, you risk data loss or inconsistent state when multiple clients (web + mobile) update data offline.

Background sync is harder on web: service workers and background-sync APIs may work differently across browsers, and may not always be reliable (especially on mobile browsers).

🔧 Recommendations / What I’d Do If I Were You (with Your Background)

Given that you already use JS/TS (since you work with Unreal + UE-for-Fortnite, C++, but likely comfortable with structured thinking) — and that you may want to support multiple platforms — here’s a recommended stack/approach for a new offline-first app:

Use Expo + React Native for cross-platform mobile + web.

Abstract your data access layer behind a repository/service API.

On mobile: use SQLite (via Expo) or a database like WatermelonDB (if relational data, querying) or Realm (if support available).

On web: use IndexedDB (via a wrapper like PouchDB) or any other local-storage + sync-capable solution.

For state management: use something like Redux (or lighter alternative) + Redux Persist, or use a reactive database store (WatermelonDB).

For offline write & sync: implement a queue of “pending actions.” When network returns (detect via NetInfo or equivalent), run sync logic. On mobile, consider using background-fetch or background-tasks so sync can happen even if app is closed.

Include UI indicators: show offline mode, show sync progress, maybe a “sync now” button.

Add metadata fields (e.g. lastModified, isDirty) to your data models to support conflict resolution.

For sync algorithm: simplest is “last write wins.” Once that works, you can consider more complex merge logic if needed.

What’s “new(er)” in Expo-compatible storage
expo-storage

The npm package “expo-storage” is listed as of November 2025. According to its npm entry, it aims to give a “simple and efficient solution for persistent data storage in Expo / React Native applications,” presumably to overcome some limitations of older storage libraries. 
npm

That suggests it’s meant for newer-ish projects, and could be a replacement or alternative to older libraries — especially if you want something that “just works” with the current Expo ecosystem.

expo-storage-universal

Another newer package is “expo-storage-universal,” which provides a “universal storage implementation for Expo that works across all platforms” (i.e. mobile native + web). 
npm
+1

It offers a consistent API, type-safe wrappers for different data types, etc. This is especially useful if you want a unified interface for both mobile and web under one codebase. 
npm

Combined with Other Modern Solutions: State + Persistence + Sync — e.g. TinyBase + expo‑sqlite

According to the official Expo “local-first” guidance, if you need more than key-value storage (e.g. structured or relational data, offline-first logic, syncing), pairing a reactive store like TinyBase with a persistence layer (like expo-sqlite on native, or browser storage on web) is a modern “blessed pattern.” 
Expo Documentation
+2
Expo Documentation
+2

This means you can treat your app’s data as first-class state (with reactive updates, queries, relations, etc.), while still persisting it across app sessions — and have something that works across mobile and web. 
Expo Documentation
+2
tinybase.org
+2

⚠️ Why there’s no “one true” localStorage library in Expo — and what to pick depending on your needs

Legacy / older storage (e.g. @react-native-async-storage/async-storage): This has been the de facto key-value storage for a long time, and is documented by Expo. 
Expo Documentation
+1

Limitations: AsyncStorage is great for small amounts of simple data (settings, tokens, small caches), but it’s not ideal for large datasets, relational data, or complex offline-first syncing needs. 
Expo Documentation
+1

Modern / future-oriented approach: If you want to build a “local-first” app — with syncing, offline capability, possibly structured and relational data — combining a reactive state store (like TinyBase) with a more robust persistence layer (SQLite on native, localStorage/IndexedDB on web) tends to be the recommended modern path. 
Expo Documentation
+2
Expo Documentation
+2

Unified API for all platforms: If you just need key-value storage that works both on mobile (native) and web, “expo-storage-universal” aims to give a consistent API across platforms, which makes it convenient for code reuse. 
npm
+1

🎯 My Recommendation (Given What You Build, Mr DJ)

Since you want a codebase that works both for web and mobile, and likely want more than just trivial key-value — I’d lean toward:

Use expo-storage-universal (for simple persistent key-value needs) or expo-storage for basic storage needs — especially if you may not need complex data structures.

If your data is more complex (lists, relationships, frequent updates, offline + sync logic), consider TinyBase + expo-sqlite (on native) + fallbacks to web storage for web builds — as per the "local-first" architecture recommended by Expo.

---

## ✅ Conflict Resolution Strategy for PokePages

Based on the `favoriteFeaturesStore` implementation, we use **optimistic updates with server validation**:

1. **Local-first writes**: Update local storage immediately when user takes action (instant UI feedback)
2. **Background sync**: Send change to server immediately if online
3. **Rollback on failure**: If server rejects the change, revert local state to previous value
4. **Server wins on conflicts**: On app startup or reconnection, fetch server state and overwrite local cache
5. **No queue for failures**: Failed syncs are retried immediately on next action, not queued

This pattern works well for user preferences and claim tracking where:
- Changes are infrequent
- Server is authoritative source of truth
- Users expect to see their changes immediately
- Conflicts are rare (user unlikely to claim same event on two devices simultaneously)

For event claims specifically:
- Local AsyncStorage/localStorage is primary for reads (fast, offline-capable)
- All writes update local immediately + sync to Supabase
- On init/foreground, fetch server claims and merge (server wins)
- If claim timestamp on server is newer, use server value

### Plesk Deployment

# Plesk Deployment

_Disclaimer: Plesk is serving the **static web export** of the Expo app, not running the Expo app/SSR. Expo Router SSR has not been made to work on Plesk yet._

## Static Web (primary pokepages.app)
- Build: `npx expo export -p web` (produces `dist/`).
- Deploy: drag-and-drop contents of `dist/` into `/httpdocs` in Plesk File Manager (or `rsync`/SFTP if preferred).
- Keep `sitemap.xml`, `robots.txt`, `service-worker.js` in `/httpdocs` with the static site.
- Cache busting: exports include hashed assets; no extra step needed. If you see stale assets, clear the Plesk caching layer/CDN if enabled.
- Rollback: keep dated `dist` zips; re-upload prior archive if needed.

## API / Node.js (subdomain api.pokepages.app)
- Host path: `/server` on the subdomain.
- Runtime: Node 22.x (per Plesk UI); package manager `npm`.
- Start file: `api-server.js`; start scripts also available (`start-api-server.bat/.sh`).
- Deploy flow:
  1) Run `./scripts/build-api-server-win.ps1` locally (or your preferred build) to produce the `api-server/` folder.
  2) Upload the built `api-server/` contents (package.json, start scripts, compiled JS, env) into `/server`.
  3) In Plesk Node.js screen: set Document Root `/server`, Application Root `/server`, Startup File `api-server.js`.
  4) Install prod deps: use **NPM install** in Plesk (or upload `node_modules` from CI if faster/locked-down).
  5) Restart app from the Plesk Node.js dashboard.
- Env: keep `.env` or `api-server.env` alongside the server files; Plesk custom environment variables can override.
- Logs: `/logs` for Plesk domain logs; app-level logs can be emitted to stdout/stderr (visible in Plesk) or to `/server/logs`.
- Backups: dated zip archives live in `/server` (e.g., `December15_2025.zip`) for quick rollback.

## Python APIs on Plesk (pattern reference)
- Host path: `/home/deployer/[repo-name]` (outside `httpdocs`).
- Service: run Python app there; expose via its local port (e.g., gunicorn/uvicorn/flask dev server).
- NGINX mapping: proxy requests like `domain.com/api/[api-name]/...` to that local port.
- Examples to mirror:
  - DavidsPortfolio: https://github.com/DavidJGrimsley/DavidsPortfolio
  - quantum-jam-2025-choose-your-own-adventure: https://github.com/ReneJSchwartz/quantum-jam-2025-choose-your-own-adventure
- Steps (summary):
  1) Deploy code to `/home/deployer/[repo]`, create venv, install deps.
  2) Run the Python server with systemd/supervisor (ensure it listens on localhost-only port).
  3) In Plesk/NGINX config, add a location block `location /api/[api-name]/ { proxy_pass http://127.0.0.1:PORT; }`.
  4) Reload/restart NGINX. Keep static site untouched in `/httpdocs`.

### NGINX Configuration Example (Flask/FastAPI)
Add this in **Plesk → Domains → [Your Domain] → Apache & nginx Settings → Additional nginx directives**:

```nginx
# USE THIS AS A TEMPLATE FOR WHAT TO COPY INTO PLESK "Additional nginx directives" FIELD
# For domain: YourDomain.com
# Location: Domains → YourDomain.com → Apache & nginx Settings → Additional nginx directives

# NOTE: /api and /api/quantum pages are served by your frontend website (Expo/React)
# Only proxy specific API endpoints and docs to the Flask/Python app

# Proxy API endpoints to the Flask app running locally
location ~ ^/public-facing/api/quantum/(quantum_text|quantum_gate|quantum_echo_types|health)$ {
	proxy_pass http://127.0.0.1:8000;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
	proxy_set_header X-Forwarded-Port $server_port;
	# CORS is handled by Flask - don't add duplicate headers here
}

# Proxy Swagger UI to Flask app (exact match for priority)
location = /public-facing/api/quantum/docs {
	proxy_pass http://127.0.0.1:8000;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
}

# Proxy OpenAPI spec to Flask app (exact match for priority)
location = /public-facing/api/quantum/openapi.yaml {
	proxy_pass http://127.0.0.1:8000;
	proxy_set_header Host $host;
	add_header Content-Type application/x-yaml;
}
```

**Key Points:**
- Use regex `location ~` for multiple endpoints under same path prefix
- Use exact match `location =` for specific resources (docs, openapi.yaml) to ensure priority
- Let the Python app handle CORS headers; don't duplicate in NGINX
- Replace `8000` with your actual local port
- Replace `/public-facing/api/quantum/` pattern with your API namespace

## Operational Notes
- Static vs API separation: static site lives in `/httpdocs`; API runtime lives in `/server` (subdomain). Avoid mixing.
- SSR status: not supported yet on this Plesk setup; treat web as exported static.
- Deploy cadence: keep dated archives for both static exports and API builds for quick rollback.
- Health checks: ensure `/health` and `/health/test-db` stay reachable on the API; add simple uptime monitor hitting the subdomain.
  `

### Build Scripts

# Build & Export Scripts

## Sitemap Generation
- Entry: `scripts/generateSitemap.ts` (copied to [copilot/files/generateSitemap.ts](files/generateSitemap.ts)).
- Flow:
  - Runs `npx expo export -p web` (respects `dist/` output if present).
  - Reads `dist/server/app/+html.js` for Expo Router static paths, filters out dynamic or disabled routes, and applies optional extra routes.
  - Excludes patterns: `_sitemap`, `_not-found`, `_layout`, `/api/`, `/ai/`, `/dex-tracker/`, `/fave`, `/profile`, `/settings`, `/app-events`, `/map`.
  - Assigns `priority`/`changefreq` per route map, writes `public/sitemap.xml`, then copies to `dist/sitemap.xml` when `dist` exists.
- Run locally: `npx ts-node scripts/generateSitemap.ts` (ensure `expo export` available). After running, deploy `dist/` so the generated sitemap ships with the web build.

## API Server Build (Windows PowerShell)
- Entry: `scripts/build-api-server-win.ps1` (copied to [copilot/files/build-api-server-win.ps1](files/build-api-server-win.ps1)).
- Flow:
  - Cleans `api-server/` dir, recreates structure.
  - Runs `tsc -p tsconfig.api-server.json` into `api-server/`.
  - Copies `api-server/package.json`, `start-api-server.bat/.sh`, `api-server.ts`, and optional `.env`/`.env.prod` into `api-server/`.
- Run: `pwsh -File scripts/build-api-server-win.ps1` (from repo root). Add `-Env prod` to copy `.env.prod` instead of `.env`.
- Start built server: `cd api-server && npm install --omit=dev && npm run start`.

## Server Runtime Practices (api-server.ts highlights)
- Normalizes paths to lowercase and strips trailing slashes before routing.
- CORS with explicit allowlist; responds early on `OPTIONS`.
- Health endpoints: `/health` (static) and `/health/test-db` (DB connectivity check).
- Graceful shutdown on `SIGINT`/`SIGTERM` with HTTP server close.
- Optional debug endpoint guarded by env flag; logs include boot duration and request timing metrics.

### Index

# PokePages Practices Index

This index replaces the old general guide. Each topic now lives in its own focused doc.

- [architecture.md](architecture.md) — App layout, module boundaries, platform files, routing vs screens.
- [stateManagement.md](stateManagement.md) — Zustand patterns, store structure, selectors, persistence.
- [databaseArchitecture.md](databaseArchitecture.md) — Drizzle + Supabase schema, RLS, migrations, seed/fixtures.
- [styling.md](styling.md) — Uniwind setup, tokens/theming in CSS, responsive patterns, migration notes.
- [routing.md](routing.md) — Expo Router conventions, file-based routes, guards, linking.
- [animation.md](animation.md) — Reanimated/worklets guidance, transitions, thread separation.
- [performance.md](performance.md) — Startup, re-render control, lists, compiler, worklets, measurement.
- [icons.md](icons.md) — Asset checklist, icon naming, SmartUtilify copy scripts, PWA icon paths.
- [pwa.md](pwa.md) — Progressive Web App setup, manifest, service worker, auto-updates, theme-color.
- [buildScripts.md](buildScripts.md) — Local build/export scripts, sitemap generation, API server build.
- [pleskDeployment.md](pleskDeployment.md) — How we deploy static web builds and the API on Plesk.

If you add a new guide, link it here so this page stays the entry point for best practices.

### General (legacy)

# React Native Performance & Best Practices Guide

## 1. App Startup Optimization (Time to Interactive - TTI)

### Minimize Startup Work
- **Don't load everything immediately** - users don't need all features in the first second
- Avoid putting 5-10 different functions in your first `useEffect` hook
- Don't initialize all tracking, load user data, and do everything upfront
- Lazy load what you can - don't load the user's complete medical record before they've signed in

### Use Profiling Tools
**React Native DevTools Profiler:**
- Hit "record" in the profiler, navigate your app, then stop profiling
- Identify views and functionalities that take the longest to render
- Look at seconds taken to render specific components

**Sentry Insights:**
- Provides nicer-looking insights from real apps in production
- Gives detailed information about what's happening in your real app

### Activate Async Routes with Expo Router
```json
{
  "expo-router": {
    "asyncRoutes": {
      "web": true,
      "default": "development"
    }
  }
}
```
- Components only mounted when required
- Not everything loaded initially
- ⚠️ **Caution:** Can improve startup time, but might decrease performance at later stages

### Use Expo Atlas
- Analyze the bundle of your application
- See all packages and modules included
- Identify packages taking up excessive time/space
- Some installed packages might be unexpectedly large

---

## 2. Avoiding Unnecessary Re-renders

### Understand Re-renders with DevTools
**Enable Highlight Updates:**
1. Open React Native DevTools Profiler
2. Click settings icon
3. Enable "Highlight updates when components render"
4. Navigate your app and see boxes appear when components render

**Analyze Flame Graphs:**
- Look for tall flames/bigger candles
- These indicate components loading slower

### Enable React Compiler
- **Expo SDK 54+:** Enabled by default
- **Below SDK 54:** Install Babel plugin and enable in `app.json`
- Automatically removes unnecessary `useMemo` and `useCallback` hooks
- Optimizes your app automatically

**Remember:** No reason to blame React Native for poor performance if your React code is poorly written in the first place.

---

## 3. Animation Performance (Target: 60 FPS)

### Show Performance Monitor
- Open DevTools → "Show perf monitor"
- See two numbers: UI thread and JavaScript thread
- Move around your app to identify where UI thread numbers drop
- Goal: Maintain 60 FPS at all times

### Avoid Blocking JavaScript Thread
- Use **Reanimated** or **Worklets** for smooth animations
- Move animations off the JavaScript thread
- Heavy computations should be on your backend when possible
- Use **React Transition API** for big computations that can't be moved to backend
  - Wrap computation in transition block
  - Observe with stages
  - Don't block JavaScript thread

---

## 4. List Performance Optimization

### Use Proper List Components
- ❌ **Avoid:** Default `FlatList` for complex cases
- ✅ **Use:** `FlashList` (tried and tested) or `LegendList` (newer, great JS implementation)
- Lists are where React Native performance often suffers most

### Efficient List Rendering
- **Pre-process your data** - don't calculate everything in render function
- Avoid rerendering everything on every change
- Don't put heavy computation in list render functions
- Works for `FlatList`, `FlashList`, and `LegendList`

### Understanding List Mutations
**Common Problems:**
- Incorrectly updating state → list doesn't rerender at all
- Unnecessarily rerendering entire list

**Solution:**
- Use **immutable updates** so React understands changes
- With React compiler or memoization, list items only rerender when required
- Update items correctly in terms of React patterns

---

## 5. State Management Best Practices

### Use Context Selectively
- ❌ **Don't:** Use context for everything (like using a fire hose to water a bonsai tree)
- ❌ **Don't:** Put every setting in one giant context
- ✅ **Do:** Have smaller contexts for specific cases (settings, users, theme)
- Context can quickly trigger unnecessary rerenders across entire component tree

### Use Proper State Management Libraries
**Recommended Libraries:**
- **Jotai** - Atomic state management
- **Zustand** - Most popular state management currently
- Both offer great performance
- Different implementations - try both to find your preference

---

## 6. Memory Leak Prevention

### Common Memory Leak Sources
- Event listeners not closed
- Intervals never cleared
- WebSocket connections never closed
- Async operations never cancelled
- Not using cleanup in `useEffect`

### Solutions
- Always use cleanup functions in `useEffect`
- Code might be longer, but necessary to prevent leaks
- Mobile apps stay in memory much longer than websites
- Small leaks compound over time → sluggish app or complete crashes
- Use profiling tools to identify JS memory leaks

**Important:** Write decent JavaScript/TypeScript code - there's no excuse.

---

## 7. Performance Measurement Tools

### React Native Profiling Documentation
- In-depth official documentation
- Learn to use regular React Native debugging tools

### Flashlight
- Generates performance score (like Lighthouse for browsers)
- Currently Android only (iOS support in development)

### Sentry Tracing
- Use in both front-end and back-end
- See full traces and pinpoint problems
- Identify slow API calls and database queries
- Include spans in your application
- Track specific operations

**Key Principle:** Measure first, optimize later. Always start with profiling.

---

## 8. Component Best Practices (2026)

### Prefer Pressable over TouchableOpacity
- ❌ **Stop using:** `TouchableOpacity` (outdated)
- ✅ **Use:** `Pressable` (comes with React Native)
- More events available: `onPressIn`, `onPressOut`, `onLongPress`
- More versatile and customizable

**Recommended Package:** `Presto` by Enso
- Abstraction from Pressable
- Automatic haptics and animations
- Configure haptics at entry point
- Can disable per-instance if needed

### Use Platform File Extensions
❌ **Avoid:** Runtime platform checks everywhere
```javascript
// Bad: Runtime checks
if (Platform.OS === 'ios') {
  // iOS code
}
```

✅ **Use:** Platform-specific files
```
ProfileScreen.tsx          // Default for all platforms
ProfileScreen.ios.tsx      // iOS-specific
ProfileScreen.android.tsx  // Android-specific
ProfileScreen.native.tsx   // iOS + Android
ProfileScreen.web.tsx      // Web-specific
```
- Easier to understand and maintain
- Better for native functionality (e.g., Expo UI Swift)
- Scales better as app grows

### Prefer Form Sheets over Modals (iOS)
- ✅ **Use:** Presentation form sheets instead of modals
- Beautiful blur background with liquid glass effect (iOS 18+)
- Can constrain detents (e.g., 45% of screen)
- User can expand/collapse
- More native feel than modal views
- Works on Android (present as modal with slide-from-bottom animation)

### Prefer FlatList over ScrollView
**When to use ScrollView:**
- Short, known lists (e.g., 3-4 items)

**When to use FlatList/LegendList:**
- Data from APIs
- Long lists
- Unknown list lengths

**FlatList Benefits:**
- `ListEmptyComponent` - automatically render when array is empty
- `ListHeaderComponent` - sticky headers
- Many other helpful properties
- Better performance for large datasets

**Pro Tip:** Use `contentInsetAdjustmentBehavior="automatic"` instead of wrapping in `SafeAreaView`
- Works with both `ScrollView` and `FlatList`
- Respects large headers on iOS
- Content fits nicely within scroll area

### Keep App Routes Lean
**With Expo Router:**
- Keep files in `/app` folder focused on routing only
- Don't add logic, state, data fetching in route files
- Import screen components from `/components` or `/screens`

```typescript
// Good: app/paywall.tsx
export default function PaywallRoute() {
  return <PaywallScreen />;
}

// Bad: app/paywall.tsx
export default function PaywallRoute() {
  const [data, setData] = useState();
  // lots of logic here...
}
```

**Benefits:**
- Easy refactoring
- Can reuse screens in multiple routes
- Present in different ways if needed
- Simpler navigation updates
- Easier to maintain and scale

---

## 9. Understanding JavaScript vs UI Thread

### Thread Responsibilities

**JavaScript Thread (Yellow):**
- Where React code lives
- Logic, state updates, API calls
- Decides what should be shown
- Doesn't draw anything on UI

**UI Thread (Blue/Main Thread):**
- Handles everything you see
- Rendering views
- Handling touches
- Running animations
- All visuals

### How Threads Work Together
1. JavaScript thread processes events (button press, state change)
2. JavaScript thread sends render request to UI thread
3. UI thread repaints/refreshes the UI
4. User sees the update

**Performance Issue:** If you block JavaScript thread with heavy computation, entire app freezes.

---

## 10. React Compiler (Expo SDK 54+)

### Enabling/Disabling
```json
// app.json
{
  "experiments": {
    "reactCompiler": true  // true by default in SDK 54+
  }
}
```

### What It Does
- Automatically prevents unnecessary re-renders
- Memoizes components and functions
- Works without manual `useMemo` or `useCallback`
- Significantly improves performance

### Health Check
```bash
npx react-compiler-healthcheck@latest
```
- Checks if your project can adopt React compiler
- Identifies issues preventing adoption

### VS Code Extension
**React Compiler Marker:**
- Shows if components are optimized for React compiler
- Real-time feedback while coding
- Helps identify issues immediately

---

## 11. Multi-Threading with React Native Worklets

### What Are Worklets?
- Similar to Web Workers
- Allow multi-threading in React Native
- Offload heavy computations to separate thread
- Keep app responsive during heavy tasks

### Basic Usage
```typescript
import { createWorkletRuntime, runOnRuntime } from 'react-native-worklets';

// Create runtime
const workerRuntime = createWorkletRuntime('worker', () => {
  console.log('Worker runtime initialized');
});

// Run heavy computation
runOnRuntime(workerRuntime, () => {
  'worklet'; // Required directive
  // Heavy computation here
  // This runs on separate thread
});
```

### Benefits
- JavaScript thread stays free
- App remains responsive
- Heavy computations don't block UI
- Perfect for:
  - Real-time data processing
  - Math-heavy logic
  - Image processing
  - Complex calculations

### How It Works
1. User triggers action (e.g., button press)
2. Event received in JS thread
3. Heavy task offloaded to worklet thread
4. Worklet thread processes (may be blocked)
5. JS thread continues processing other tasks
6. UI thread remains responsive
7. Result sent back to JS thread
8. State updated and UI refreshed

---

## 12. Best Practices Checklist

### Code Quality
- ✅ Use TypeScript
- ✅ Use static JavaScript features (`const`, `let`, not `var`)
- ✅ Use `import`/`export` (not `require` except for assets)
- ✅ Enable ESLint and static analysis
- ✅ Write decent React code first

### Performance
- ✅ Test on real devices (not simulator)
- ✅ Use React compiler (SDK 54+)
- ✅ Use latest APIs (e.g., `use` hook instead of custom context hooks)
- ✅ Minimize startup work
- ✅ Lazy load features
- ✅ Avoid blocking UI thread
- ✅ Use proper list components (FlashList/LegendList)
- ✅ Choose appropriate state management

### Measurement
- ✅ Profile first, optimize later
- ✅ Use React Native DevTools
- ✅ Use Sentry tracing
- ✅ Use Flashlight (Android)
- ✅ Know your numbers (measure improvements)
- ✅ Track performance metrics

---

## Performance Goals

**60 FPS** - The threshold at which your app feels truly native
- Better user reviews
- Longer session times
- Fewer abandoned interactions
- More engaged users

**Remember:** Performance isn't just about speed - it's about user experience and retention.
