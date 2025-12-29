
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
- [ ] Create machines management page
- [ ] Add admin role protection
- [ ] Write vitest tests for admin endpoints

## Geolocation Caching
- [x] Create useGeolocation hook with localStorage caching
- [x] Load cached location immediately on mount
- [x] Update cache when new position is obtained
- [x] Add cache expiration (30 minutes)
- [x] Update Home page to use cached geolocation
- [x] Show "обновляется..." indicator when refreshing from cache
- [x] Test geolocation caching (19 tests passing)

## Welcome Bonus & Loyalty System Enhancement
- [x] Add welcome bonus for new users (15,000 points = espresso price)
- [x] Create welcome bonus banner on Home page with claim button
- [x] Award bonus points via claimWelcomeBonus API endpoint
- [x] Send welcome notification about bonus points (in-app + Telegram)
- [x] Enhance loyalty levels with permanent discounts:
  - Bronze: 0% discount (starting level)
  - Silver: 3% permanent discount (100k UZS spent)
  - Gold: 5% permanent discount (500k UZS spent)
  - Platinum: 10% permanent discount (1M UZS spent)
- [x] Add level discount helper functions (getLevelDiscount, applyLevelDiscount)
- [x] Add next level info helper (getNextLevelInfo)
- [x] All TypeScript errors resolved (19 tests passing)

## Telegram Registration Flow
- [x] Create Telegram bot deep link for registration (t.me/vendhubbot?start=...)
- [x] Create TelegramConnectPage with bot link and bonus info
- [x] Add route /profile/telegram to App.tsx
- [x] Add Telegram link to Profile menu
- [x] Send welcome message via Telegram after successful registration

## Level Discount in Cart
- [x] Display current level and discount percentage in cart
- [x] Calculate and apply level discount to order total
- [x] Show discount breakdown in order summary (promo + level discount)
- [x] Update checkout confirmation with discount info

## Level Progress Page
- [x] Create dedicated level progress page (/profile/level)
- [x] Visual progress bar showing progress to next level
- [x] Display current level benefits and perks
- [x] Show next level requirements and benefits
- [x] All levels overview with thresholds
- [x] Link from Profile menu to level page

## First Order Bonus
- [x] Track first order completion via totalOrders count
- [x] Award 10,000 bonus points after first successful order
- [x] Send in-app notification about first order bonus
- [x] Send Telegram notification about first order bonus
