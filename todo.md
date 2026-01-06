
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
- [x] Write vitest tests for admin endpoints (29 tests passed)
- [x] Write vitest tests for document parsing (21 tests passed)

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

## Achievements Page
- [x] Create Achievements page (/profile/achievements)
- [x] Design badge system with categories (orders, social, loyalty)
- [x] Implement badge unlocking logic
- [x] Add badge icons and visual design
- [x] Show progress towards locked badges
- [x] Link from Profile menu

## Confetti Animation
- [x] Install canvas-confetti library
- [x] Create useConfetti hook with multiple animation types
- [x] Trigger confetti on welcome bonus claim (Home.tsx)
- [x] Trigger confetti on first order bonus (OrderSuccess.tsx)
- [x] Trigger confetti on platinum level view (LevelProgressPage.tsx)
- [x] Trigger confetti on achievement click (AchievementsPage.tsx)

## Achievement Notifications & Social Badges
- [x] Add social badges (referral, review, telegram connected)
- [x] Create AchievementUnlockModal component with animation
- [x] Track unlocked achievements in localStorage store
- [x] Send push notification on achievement unlock (in-app + Telegram)
- [x] Show modal when new achievement is unlocked
- [x] Add confetti to achievement modal

## Points History Page
- [x] Create points transactions table in database
- [x] Build PointsHistoryPage with transaction list
- [x] Add filtering by transaction type (all, earn, spend, bonus)
- [x] Show balance changes with icons and colors
- [x] Link from Profile menu

## Daily Quests System
- [x] Create daily quests schema in database
- [x] Build DailyQuestsPage with quest cards
- [x] Implement quest progress tracking
- [x] Add quest completion rewards with confetti
- [x] Reset quests daily (midnight)

## Leaderboard
- [x] Create leaderboard API endpoint
- [x] Build LeaderboardPage with rankings
- [x] Show user avatars and achievement counts
- [x] Highlight current user position with podium
- [x] Top 3 podium visualization

## Daily Quests Seed Data
- [x] Create default daily quests templates (order, spend, visit)
- [x] Seed quests function in db.ts
- [x] Reset quests at midnight automatically

## Quest Progress Auto-Update
- [x] Update "make order" quest on order completion
- [x] Update "spend" quest on order payment
- [x] Update "visit app" quest on stats query
- [x] Send notification when quest is completed

## Leaderboard Filters
- [x] Add weekly/monthly/all-time filter tabs
- [x] Calculate rankings based on selected period
- [x] Show period-specific stats in UI

## Data Integration from External Sources
- [x] Download menu data from Google Drive file (VHInfo.xlsx)
- [x] Clone vendify-menu-maps repository
- [x] Extract drinks menu with prices (16 coffee products, 8 energy drinks, 11 soft drinks)
- [x] Extract vending machines data and groupings (15 machines in 4 groups)
- [x] Create shared/menuData.ts with all products and machines
- [x] Create Landing page with app links and admin navigation
- [x] Add navigation links to iOS/Android apps, Telegram bot, and admin panel

## Daily Quests Seed Data via Admin
- [x] Create admin endpoint to seed daily quests
- [x] Add admin UI for managing quests (/admin/quests)
- [x] CRUD operations for quests (create, update, delete)
- [x] Toggle quest active status

## Weekly Quests System
- [x] Add isWeekly field to daily_quests schema
- [x] Add weekly quests to seed data (5 orders, 100k spend, 7-day streak)
- [x] Update DailyQuestsPage with tabs for daily/weekly
- [x] Higher rewards for weekly quests (5,000-10,000 points)
- [x] Auto-reset weekly quests on Monday

## Streak System
- [x] Add currentStreak, longestStreak, lastQuestCompletedDate to users table
- [x] Create updateUserStreak and getUserStreak functions
- [x] Show streak card in DailyQuestsPage with fire icon
- [x] Display streak bonus multiplier for 7+ day streaks

## Auto-seed Quests for New Users
- [x] Trigger quest seeding on first user login (dailyQuests endpoint)
- [x] Create user quest progress entries automatically (initializeDailyQuestProgress)
- [x] Ensure quests are only seeded once per user (seedDailyQuests checks existing)

## Push Notification for New Daily Quests
- [x] Send in-app notification when new quests are available
- [x] Send Telegram notification about new daily quests
- [x] Admin button to notify all users about new quests
- [x] Trigger notification at midnight when quests reset (cron job)
- [x] Create scheduled task for midnight notification (node-cron)
- [x] Reset user quest progress at midnight
- [x] Admin buttons for manual daily/weekly reset

## Admin Panel - Vending Business Management

### Employees Management
- [x] Create employees table in database (13 roles)
- [x] Build admin employees page with CRUD
- [x] Add employee roles (platform_owner, platform_admin, org_owner, org_admin, manager, supervisor, operator, technician, collector, warehouse_manager, warehouse_worker, accountant, investor)
- [ ] Track employee assignments to machines

### Machines Management (Extended)
- [x] Extend machines table with detailed specs (serial, model, manufacturer)
- [x] Build admin machines page with CRUD
- [ ] Add machine components tracking
- [ ] Track machine maintenance history
- [ ] Assign employees to machines

### Ingredients Management
- [x] Create ingredients table in database
- [x] Build admin ingredients page with CRUD
- [x] Track ingredient stock levels with progress bars
- [x] Set low stock alerts (visual warning)

### Cleaning Supplies Management
- [x] Create cleaning supplies table
- [x] Build admin cleaning supplies page with CRUD
- [x] Track stock levels with progress bars
- [x] Set low stock alerts (visual warning)

### Bunkers Management
- [x] Create bunkers table (ingredient containers)
- [x] Build admin bunkers page
- [x] Track bunker capacity and fill levels
- [x] Link bunkers to machines

### Mixers Management
- [x] Create mixers table
- [x] Build admin mixers page
- [x] Track mixer maintenance
- [x] Link mixers to machines

### Spare Parts Management
- [x] Create spare parts table
- [x] Build admin spare parts page with CRUD
- [x] Track spare parts inventory with stock levels
- [x] Link parts to machine models (compatibility)

### Warehouse Management
- [x] Create warehouse zones table
- [x] Build admin warehouse page with zones and movements tabs
- [x] Track stock movements (in/out)
- [x] Show zone capacity and fill levels

### Contractors Management
- [x] Create contractors table
- [x] Build admin contractors page with CRUD
- [x] Track contractor services (supplier, service, logistics)
- [x] Telegram integration for contractors


## Document Upload & Data Import System

### Document Parser
- [ ] Create document upload endpoint (Excel, CSV, Word, TXT, MD, PDF, images)
- [ ] Implement Excel parser with automatic column detection
- [ ] Implement CSV parser with delimiter detection
- [ ] Implement PDF text extraction
- [ ] Implement image OCR for receipts/documents
- [ ] Create document preview modal
- [ ] Track uploaded files history

### Sales Data Import
- [x] Create sales_records table in database
- [x] Build admin sales import page with drag-drop upload
- [x] Auto-detect data structure from uploaded files
- [x] Deduplicate records on import
- [x] Support date range filtering
- [x] Support payment type filtering (Cash, QR, VIP, Card)
- [x] Pagination for large datasets (50/100/250/500 per page)
- [x] Export filtered data to Excel/CSV

### Bunkers Management (Extended)
- [x] Build admin bunkers page with CRUD
- [x] Link bunkers to machines
- [x] Link bunkers to ingredients
- [x] Track bunker capacity and fill levels
- [x] Low level alerts (threshold-based)
- [x] Refill history tracking

### Mixers Management
- [x] Build admin mixers page with CRUD
- [x] Link mixers to machines
- [x] Track mixer maintenance cycles
- [x] Maintenance alerts (cycle-based)
- [x] Maintenance history tracking

### Inventory Reconciliation (Инвентаризация)
- [x] Create inventory_checks table
- [x] Build inventory reconciliation page
- [x] Compare expected vs actual stock levels
- [x] Calculate discrepancies (shortages/overages)
- [x] Generate reconciliation reports
- [x] Track reconciliation history
- [x] Link discrepancies to responsible employees

### Stock Movement Tracking
- [ ] Extend stock movements with detailed action types
- [ ] Track all material movements (ingredients, cleaning, spare parts)
- [ ] Register employee for each action
- [ ] Track source and destination (warehouse zone, machine, bunker)
- [ ] Generate movement reports
- [ ] Compare movements with sales data

### Sales vs Stock Analysis
- [ ] Calculate expected consumption from sales
- [ ] Compare with actual stock movements
- [ ] Identify discrepancies
- [ ] Generate variance reports
- [ ] Alert on significant variances


## Document Parsing Implementation
- [x] Install xlsx library for Excel parsing
- [x] Create server endpoint for file upload
- [x] Implement Excel parser with automatic column detection
- [x] Implement CSV parser with delimiter detection
- [x] Auto-detect data structure from uploaded files
- [x] Map detected columns to database fields
- [x] Preview parsed data before import
- [x] Batch import with progress tracking
- [x] Handle duplicate records detection

## Mixers Management Page
- [x] Create Mixers admin page with CRUD
- [x] Link mixers to machines
- [x] Track mixer types (coffee, milk, syrup, etc.)
- [x] Track mixer status (active, maintenance, inactive)
- [x] Implement maintenance cycle tracking
- [x] Show maintenance alerts (cycle-based)
- [x] Maintenance history log
- [x] Add navigation link in admin sidebar


## Comprehensive System Review & Enhancement

### Role-Based Access Control (RBAC)
- [ ] Audit current user roles (admin, user, operator, manager)
- [ ] Implement role-based route protection for admin pages
- [ ] Add middleware for role checking on server endpoints
- [ ] Create role-specific UI elements (hide/show based on permissions)
- [ ] Add permission matrix documentation
- [ ] Test role transitions and access denial scenarios

### Business Process Workflows
- [ ] Review inventory check workflow (draft → in_progress → completed → approved)
- [ ] Review maintenance workflow for mixers and machines
- [ ] Review sales import workflow (upload → preview → validate → import)
- [ ] Add workflow state transitions with validation
- [ ] Add workflow history tracking
- [ ] Implement approval mechanisms for critical operations

### Task Management
- [ ] Create tasks table for tracking work assignments
- [ ] Link tasks to employees, machines, and inventory checks
- [ ] Add task priorities (low, medium, high, urgent)
- [ ] Add task statuses (pending, in_progress, completed, cancelled)
- [ ] Add task due dates and notifications
- [ ] Create tasks admin page with kanban/list views

### Data Integrity & Relationships
- [ ] Review and enforce foreign key constraints
- [ ] Add cascade delete rules where appropriate
- [ ] Validate bunker-ingredient-machine relationships
- [ ] Validate mixer-machine relationships
- [ ] Add stock level consistency checks
- [ ] Add transaction logging for critical operations

### Missing CRUD Operations
- [ ] Add edit functionality for employees
- [ ] Add edit functionality for ingredients
- [ ] Add edit functionality for bunkers
- [ ] Add edit functionality for mixers
- [ ] Add delete confirmations with dependency checks
- [ ] Add bulk operations (bulk delete, bulk status update)

### Validation & Error Handling
- [ ] Add input validation for all forms
- [ ] Add server-side validation for all endpoints
- [ ] Improve error messages (user-friendly, actionable)
- [ ] Add validation for stock movements (prevent negative stock)
- [ ] Add validation for maintenance cycles (prevent invalid dates)
- [ ] Add validation for file uploads (size, format, content)

### Reporting & Analytics
- [ ] Create sales analytics dashboard
- [ ] Create inventory turnover reports
- [ ] Create maintenance schedule reports
- [ ] Create employee performance reports
- [ ] Add export functionality for all reports
- [ ] Add date range filtering for all reports


## Comprehensive System Review & Enhancement

### Role-Based Access Control (RBAC)
- [x] Audit current user roles (admin, user, operator, manager)
- [x] Implement role-based route protection for admin pages (AdminRoute component)
- [x] Add middleware for role checking on server endpoints
- [x] Create role-specific UI elements (hide/show based on permissions)
- [x] Add permission matrix documentation
- [x] Test role transitions and access denial scenarios

### Business Process Workflows
- [x] Review inventory check workflow (draft → in_progress → completed → approved)
- [x] Create inventoryWorkflow.ts with state transitions
- [x] Review maintenance workflow for mixers and machines
- [x] Create maintenanceWorkflow.ts with maintenance tracking
- [x] Add workflow state transitions with validation
- [x] Add workflow history tracking
- [x] Implement approval mechanisms for critical operations

### Task Management
- [x] Create tasks table for tracking work assignments
- [x] Create task_comments table for communication
- [x] Build admin tasks page with kanban board
- [x] Link tasks to employees, machines, and inventory checks
- [x] Add task priorities (low, medium, high, urgent)
- [x] Add task statuses (pending, in_progress, completed, cancelled)
- [x] Add task due dates and notifications
- [x] Create tasks admin page with kanban/list views

### Data Integrity & Relationships
- [ ] Review and enforce foreign key constraints
- [ ] Add cascade delete rules where appropriate
- [ ] Validate bunker-ingredient-machine relationships
- [ ] Validate mixer-machine relationships
- [ ] Add stock level consistency checks
- [ ] Add transaction logging for critical operations

### Missing CRUD Operations
- [ ] Add edit functionality for employees
- [ ] Add edit functionality for ingredients
- [ ] Add edit functionality for bunkers
- [ ] Add edit functionality for mixers
- [ ] Add delete confirmations with dependency checks
- [ ] Add bulk operations (bulk delete, bulk status update)

### Validation & Error Handling
- [ ] Add input validation for all forms
- [ ] Add server-side validation for all endpoints
- [ ] Improve error messages (user-friendly, actionable)
- [ ] Add validation for stock movements (prevent negative stock)
- [ ] Add validation for maintenance cycles (prevent invalid dates)
- [ ] Add validation for file uploads (size, format, content)

### Reporting & Analytics
- [ ] Create sales analytics dashboard
- [ ] Create inventory turnover reports
- [ ] Create maintenance schedule reports
- [ ] Create employee performance reports
- [ ] Add export functionality for all reports
- [ ] Add date range filtering for all reports


## Step-by-Step Enhancements (New)

### Step 1: Fix TypeScript Errors
- [ ] Add welcomeBonusReceived field to users schema
- [ ] Update pointsTransactionType enum to include "points" type
- [ ] Run pnpm db:push to sync schema
- [ ] Verify all TypeScript errors resolved

### Step 2: Implement CRUD Edit Operations
- [ ] Add edit dialog for ingredients (update name, category, price)
- [ ] Add edit dialog for bunkers (update capacity, machine link)
- [ ] Add edit dialog for mixers (update type, maintenance cycle)
- [ ] Add edit endpoints to server/routers.ts
- [ ] Add update mutations to tRPC procedures
- [ ] Test all edit operations

### Step 3: Real-Time Sync Between Admin & Mobile
- [ ] Implement WebSocket server for real-time updates
- [ ] Add event emitters for machine/menu changes
- [ ] Create sync procedures in tRPC
- [ ] Add client-side listeners for updates
- [ ] Test sync when admin updates machines
- [ ] Test sync when admin updates menu items

### Step 4: Workflow Enhancements
- [ ] Add approval workflow for inventory checks
- [ ] Add audit trail logging for all operations
- [ ] Add notifications for workflow state changes
- [ ] Add approval buttons to inventory check page
- [ ] Add audit log viewer to admin dashboard
- [ ] Test workflow transitions and notifications

### Step 5: OCR Integration
- [ ] Integrate Tesseract.js for OCR processing
- [ ] Add photo upload to sales import
- [ ] Extract text from images
- [ ] Parse extracted text for sales data
- [ ] Add OCR preview to import dialog
- [ ] Test with sample photos

### Step 6: Final Testing & Deployment
- [ ] Run all vitest tests
- [ ] Verify no TypeScript errors
- [ ] Test all new features in browser
- [ ] Save final checkpoint
- [ ] Document all changes


## Step-by-Step Enhancements

### Step 1: Fix TypeScript Errors
- [x] Fix AdminRoute.tsx to use 'loading' instead of 'isLoading'
- [x] Fix Bunkers.tsx and InventoryCheck.tsx to use 'description' instead of 'subtitle'
- [x] Fix uploadRoutes.ts to use 'status' instead of 'importStatus'
- [x] Fix inventoryWorkflow.ts import path and rewrite to use Drizzle ORM
- [x] Fix maintenanceWorkflow.ts import path and rewrite to use Drizzle ORM
- [x] Add downlevelIteration to tsconfig.json
- [x] Fix Set iteration in Bunkers.tsx using Array.from()
- [x] All TypeScript errors resolved - project compiles successfully

### Step 2: Implement CRUD Edit Operations
- [ ] Add edit dialog for ingredients (currently only view/add)
- [ ] Add edit dialog for bunkers (currently only view/add)
- [ ] Add edit dialog for mixers (currently only view/add)
- [ ] Create edit endpoints in routers.ts
- [ ] Add form validation for edit operations
- [ ] Write vitest tests for edit endpoints

### Step 3: Real-Time Sync Between Admin & Mobile App
- [ ] Implement WebSocket connection for real-time updates
- [ ] Sync machine status changes to mobile app
- [ ] Sync menu item updates to mobile app
- [ ] Sync ingredient availability to mobile app
- [ ] Add polling fallback for browsers without WebSocket support

### Step 4: Workflow Enhancements
- [ ] Add approval workflows for inventory checks
- [ ] Add approval workflows for maintenance tasks
- [ ] Create audit trail for all admin operations
- [ ] Add email/Telegram notifications for approvals
- [ ] Track who made changes and when

### Step 5: OCR Integration for Document Processing
- [ ] Integrate Tesseract.js for image OCR
- [ ] Extract text from receipt images
- [ ] Parse receipt data (date, items, amounts)
- [ ] Auto-populate sales import from receipt photos
- [ ] Add confidence score for OCR results


## Bug Fixes

### Quest Progress DATE() Query Error
- [x] Fixed DATE() function error in daily quest progress queries
- [x] Convert JavaScript Date objects to YYYY-MM-DD format before SQL comparison
- [x] Fixed in initializeDailyQuestProgress, updateDailyQuestProgress, and claimDailyQuestReward functions
- [x] Added CAST(dateStr AS DATE) for proper MySQL type comparison
- [x] Error on /cart page resolved
- [x] Error on /profile page resolved
