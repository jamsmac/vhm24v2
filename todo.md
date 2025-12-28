
## Database Integration
- [x] Resolve Home.tsx conflicts after feature upgrade
- [x] Design database schema (orders, favorites, cart, order_history)
- [x] Push database migrations
- [x] Create API endpoints for orders
- [x] Create API endpoints for favorites
- [x] Create API endpoints for cart
- [x] Create frontend hooks for API endpoints (useDataSync)
- [x] Write vitest tests for API endpoints (10 tests passed)

## Admin Panel
- [x] Create admin layout with sidebar navigation
- [x] Create dashboard with statistics overview
- [x] Create products management page (CRUD)
- [x] Create orders management page with status updates
- [x] Create promo codes management page (CRUD)
- [x] Add admin-only API endpoints
- [x] Add admin routes to App.tsx
- [x] Create machines management page
- [ ] Add admin role protection
- [ ] Write vitest tests for admin endpoints

## Machines Management
- [x] Update database schema for machine inventory tracking
- [x] Create machines management page with status monitoring
- [x] Add inventory level tracking per machine
- [x] Add API endpoints for machines CRUD and inventory
- [x] Test machines management functionality

## Interactive Machines Map
- [x] Create MachinesMap component with Google Maps integration
- [x] Add custom markers for different machine statuses (online/offline/maintenance)
- [x] Implement status filtering controls
- [x] Add machine info popup on marker click
- [x] Integrate map into admin panel (/admin/machines/map)
- [x] Add list/map view toggle
- [x] Test map functionality

## Route Navigation
- [x] Create useRouteNavigation hook with Google Directions API
- [x] Create RoutePanel component for route info display
- [x] Add "Build Route" button to machine cards
- [x] Display route on map with walking/driving options
- [x] Show estimated time and distance
- [x] Add option to open in external maps app (Google Maps, Яндекс.Карты, 2GIS)
- [x] Integrate into Locations page with NavigatorDialog
- [x] Test route navigation functionality

## Route Display on Map
- [x] Update useRouteNavigation hook to return route polyline data
- [x] Render route polyline on Google Maps using DirectionsRenderer
- [x] Add route info panel with distance, time, and travel mode
- [x] Add clear route button
- [x] Add travel mode selector (walking/driving)
- [x] Add quick links to open in Google Maps or Yandex Maps
- [x] Test route display functionality (works with geolocation)

## Turn-by-Turn Directions
- [x] Extract navigation steps from DirectionsResult
- [x] Create expandable directions panel component
- [x] Display step icons (turn left, turn right, straight, U-turn, destination)
- [x] Show distance and duration for each step
- [x] Add expand/collapse animation with framer-motion
- [x] Add scrollable list for many steps (max-h-48)
- [x] Test directions display functionality (works with geolocation)

## Voice Navigation
- [x] Create useVoiceNavigation hook with Web Speech API
- [x] Add voice toggle button to route info panel
- [x] Implement automatic step announcements
- [x] Add "Play All" button to read all steps sequentially
- [x] Add per-step play buttons with visual highlighting
- [x] Add language support (Russian - ru-RU)
- [x] Add voice settings (rate: 0.9)
- [x] Announce route start with distance and duration
- [x] Highlight currently speaking step in directions panel
- [x] Test voice navigation functionality (18 tests passing)

## Real-Time Location Tracking
- [x] Create useLocationTracking hook with Geolocation API
- [x] Add user position marker on the map (blue dot with accuracy circle)
- [x] Calculate distance to each route step using Haversine formula
- [x] Auto-highlight current step based on proximity (30m threshold)
- [x] Auto-announce next step via voice when approaching (100m)
- [x] Add tracking toggle button (blue locate icon in route panel)
- [x] Handle location permission errors gracefully (Russian messages)
- [x] Mark completed steps with checkmark icon
- [x] Dim past steps in directions panel
- [x] Test location tracking functionality (20 tests passing)

## Estimated Arrival Time (ETA)
- [x] Calculate ETA from current time + remaining duration
- [x] Display ETA in route info panel (green/blue pill with clock icon)
- [x] Update ETA in real-time as user travels
- [x] Recalculate remaining duration based on completed steps
- [x] Format time in local timezone (HH:MM) using ru-RU locale
- [x] Add visual indicator for ETA updates (pulsing clock when tracking)
- [x] Show updated remaining time with strikethrough original
- [x] Test ETA functionality (48 tests passing)
