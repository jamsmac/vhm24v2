
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

## Route Recalculation
- [x] Detect deviation from route path (50m threshold)
- [x] Calculate distance from user to nearest point on route path
- [x] Trigger automatic recalculation when deviation exceeds threshold
- [x] Add cooldown to prevent excessive recalculations (10s)
- [x] Show recalculation indicator (orange banner + toast)
- [x] Preserve travel mode during recalculation
- [x] Update route steps and ETA after recalculation
- [x] Voice announcement of new route when enabled
- [x] Test route recalculation functionality (48 tests passing)

## Manual Route Recalculation
- [x] Add recalculate button to route panel controls (RefreshCw icon)
- [x] Allow manual recalculation without cooldown restriction
- [x] Show loading state on button during recalculation (spinning icon)
- [x] Error handling for missing location/route
- [x] Test manual recalculation functionality (48 tests passing)

## Alternative Routes
- [x] Request multiple routes from Directions API (provideRouteAlternatives: true)
- [x] Store and display alternative route options (AlternativeRoute interface)
- [x] Create route selection UI with distance/duration comparison
- [x] Allow user to switch between routes (selectRoute function)
- [x] Highlight selected route on map (setRouteIndex)
- [x] Update route info panel when route is selected
- [x] Voice announcement of available alternatives
- [x] Test alternative routes functionality (48 tests passing)

## Gamification System
- [x] Create database tables: gamification_tasks, user_task_completions, points_transactions, user_preferences
- [x] Build points system API (earn, balance, history, admin adjustment)
- [x] Build tasks API (list, complete, admin CRUD, seed defaults)
- [x] Create points display component in Tasks page
- [x] Create tasks list UI with progress indicators and completion status
- [x] Implement one-click Telegram linking with points reward (100 points)
- [x] Implement one-click Email linking with points reward (50 points)
- [x] Add admin panel for managing tasks (/admin/tasks)
- [x] Test gamification functionality (66 tests passing)

## Homepage Customization
- [x] Create user_preferences table for section settings (homeSections JSON)
- [x] Build API for saving/loading user preferences (getPreferences, updatePreferences)
- [x] Create drag-and-drop section reordering UI (framer-motion Reorder)
- [x] Add section visibility toggles (eye/eye-off icons)
- [x] Add section size options (compact/normal/large)
- [x] Save preferences to user profile (upsertUserPreferences)
- [x] Add HomeSettings link in Settings page
- [x] Test homepage customization (66 tests passing)

## Apply Preferences to Home Page
- [x] Fetch user preferences on Home page load (trpc.gamification.getPreferences)
- [x] Create section components map for dynamic rendering
- [x] Apply section order from preferences (sorted by order)
- [x] Apply section visibility from preferences (filter visible)
- [x] Apply section size variants from preferences (compact/normal/large)
- [x] Handle loading state while fetching preferences (Loader2 spinner)
- [x] Fallback to defaults for new users (defaultSections array)
- [x] Test preferences application (66 tests passing)

## Homepage Preview in Settings
- [x] Create miniature preview component showing section layout (HomePreview)
- [x] Update preview in real-time as user changes settings (AnimatePresence)
- [x] Show section order, visibility, and size in preview
- [x] Add toggle to show/hide preview panel (collapsible card)
- [x] Style preview to match actual homepage appearance (phone frame design)
- [x] Test preview functionality (66 tests passing)

## Preset Homepage Templates
- [x] Create template definitions (minimalist, standard, expanded, quick order)
- [x] Add template selection UI with visual previews (2x2 grid)
- [x] Apply template settings when selected
- [x] Show confirmation dialog before applying template with preview
- [x] Update preview when template is selected
- [x] Test preset templates functionality (66 tests passing)

## Referral System
- [x] Create referrals table in database schema (referrals, referral_codes)
- [x] Generate unique referral codes for each user (8-char alphanumeric)
- [x] Build API endpoints for referral tracking (getStats, getCode, list, trackClick, validateCode, applyCode)
- [x] Create referral page with shareable link (/profile/referral)
- [x] Award points to referrer when friend joins (200 points)
- [x] Award bonus points to new user from referral (100 points)
- [x] Show referral statistics (invited count, earned points, pending)
- [x] Add "Invite Friends" link to Profile menu
- [x] Test referral system functionality (85 tests passing)

## Rewards Store
- [x] Create rewards table in database schema
- [x] Create user_rewards table for purchased rewards
- [x] Build API endpoints for rewards (list, purchase, redeem, adminList, adminCreate, adminUpdate, adminDelete)
- [x] Create rewards store page with available rewards (/profile/rewards)
- [x] Show user's purchased rewards with status tabs (active/redeemed/expired)
- [x] Implement reward redemption flow with unique codes
- [x] Add admin panel for managing rewards (/admin/rewards)
- [x] Test rewards store functionality (109 tests passing)

## Points-Based Rewards (1 point = 1 sum)
- [x] Remove QR code component (not needed)
- [x] Update rewards to award points directly (pointsAwarded field)
- [x] Simplify reward types (bonus_points, promo_code as main types)
- [x] Update rewards store UI to show points awarded
- [x] Simplified claim flow (points added automatically on claim)
- [x] Support promo codes for machine entry
- [x] Update admin panel for new reward fields
- [x] Test points-based rewards functionality (113 tests passing)

## Points Payment Integration (1 point = 1 sum)
- [x] Add points balance display in Cart page
- [x] Add toggle/slider for using points in payment
- [x] Allow partial payment (use some points + pay remaining)
- [x] Allow full payment with points (if balance sufficient)
- [x] Update order total calculation with points discount
- [x] Add API endpoint for order with points payment
- [x] Deduct points from user balance on successful order
- [x] Record points transaction in history
- [x] Show points used in order confirmation
- [x] Test points payment functionality (126 tests passing)

## Points History Page
- [x] Create PointsHistory page component (/profile/points-history)
- [x] Display all points transactions with date, type, amount, description
- [x] Add filter tabs (All, Earned, Spent)
- [x] Show current balance at top
- [x] Add visual indicators for credits (+) and debits (-)
- [x] Add navigation link from Profile menu
- [x] Test points history page (126 tests passing)

## Points Notifications
- [x] Add notification creation to addPointsTransaction function
- [x] Create notification templates for credits (task, order, referral)
- [x] Create notification templates for debits (redemption, payment)
- [x] Include amount and new balance in notification message
- [x] Test points notifications (137 tests passing)

## Points Notification Settings
- [x] Add pointsNotifications preferences to user_preferences schema
- [x] Create API endpoint for getting/updating points notification settings
- [x] Update addPointsTransaction to check user preferences before sending
- [x] Create PointsNotificationSettings page UI
- [x] Add link to settings from NotificationSettings page
- [x] Test points notification settings (137 tests passing)

## Telegram Bot Notifications
- [x] Create Telegram Bot notification service (sendTelegramMessage)
- [x] Add telegramEnabled preference to user settings
- [x] Update PointsNotificationSettings UI with Telegram toggle
- [x] Integrate Telegram notifications into addPointsTransaction
- [x] TELEGRAM_BOT_TOKEN configured (@vendhubbot)
- [x] Test Telegram Bot notifications (147 tests passing)

## Welcome Message for New Users
- [x] Create welcome message template with app features
- [x] Add sendWelcomeMessage function to telegramBot.ts
- [x] Integrate welcome message into user registration flow (upsertUser)
- [x] Test welcome message sending (157 tests passing)

## Payment Methods Reorder
- [x] Move Telegram Stars payment to bottom, regular methods (Click, Payme, Uzum) at top
