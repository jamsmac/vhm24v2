import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { TelegramProvider } from "./contexts/TelegramContext";
import BottomNav from "./components/BottomNav";
import Onboarding from "./components/Onboarding";
import { useOnboardingStore } from "./stores/onboardingStore";
import { useEffect } from "react";

// Pages
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Locations from "./pages/Locations";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import OrderHistory from "./pages/OrderHistory";
import Bonuses from "./pages/Bonuses";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import OrderSuccess from "./pages/OrderSuccess";
import Favorites from "./pages/Favorites";
import DrinkDetail from "./pages/DrinkDetail";
import Promotions from "./pages/Promotions";
import NotificationSettings from "./pages/NotificationSettings";
import LevelProgressPage from "./pages/profile/LevelProgressPage";
import TelegramConnectPage from "./pages/profile/TelegramConnectPage";
import AchievementsPage from "./pages/profile/AchievementsPage";
import PointsHistoryPage from "./pages/profile/PointsHistoryPage";
import DailyQuestsPage from "./pages/profile/DailyQuestsPage";
import LeaderboardPage from "./pages/profile/LeaderboardPage";
import Landing from "./pages/Landing";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminPromoCodes from "./pages/admin/PromoCodes";
import AdminQuests from "./pages/admin/Quests";
import AdminEmployees from "./pages/admin/Employees";
import AdminMachines from "./pages/admin/Machines";
import AdminIngredients from "./pages/admin/Ingredients";
import AdminCleaningSupplies from "./pages/admin/CleaningSupplies";
import AdminSpareParts from "./pages/admin/SpareParts";
import AdminWarehouse from "./pages/admin/Warehouse";
import AdminContractors from "./pages/admin/Contractors";
import AdminSalesImport from "./pages/admin/SalesImport";
import AdminInventoryCheck from "./pages/admin/InventoryCheck";
import AdminBunkers from "./pages/admin/Bunkers";
import AdminMixers from "./pages/admin/Mixers";
import AdminTasks from "./pages/admin/Tasks";
import AdminAssignments from "./pages/admin/Assignments";
import AdminWorkLogs from "./pages/admin/WorkLogs";
import AdminPerformance from "./pages/admin/Performance";
import AdminRoute from "./components/AdminRoute";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Main Routes */}
      <Route path="/" component={Home} />
      <Route path="/landing" component={Landing} />
      <Route path="/scan" component={Scan} />
      <Route path="/locations" component={Locations} />
      <Route path="/drink/:id" component={DrinkDetail} />
      <Route path="/promotions" component={Promotions} />
      <Route path="/menu/:id" component={Menu} />
      <Route path="/cart" component={Cart} />
      
      {/* Profile Routes */}
      <Route path="/profile" component={Profile} />
      <Route path="/profile/history" component={OrderHistory} />
      <Route path="/profile/bonuses" component={Bonuses} />
      <Route path="/profile/favorites" component={Favorites} />
      <Route path="/profile/settings" component={Settings} />
      <Route path="/profile/help" component={Help} />
      <Route path="/profile/notifications" component={NotificationSettings} />
      <Route path="/profile/level" component={LevelProgressPage} />
      <Route path="/profile/telegram" component={TelegramConnectPage} />
      <Route path="/profile/achievements" component={AchievementsPage} />
      <Route path="/profile/points-history" component={PointsHistoryPage} />
      <Route path="/profile/daily-quests" component={DailyQuestsPage} />
      <Route path="/profile/leaderboard" component={LeaderboardPage} />
      
      {/* Order Routes */}
      <Route path="/order/success" component={OrderSuccess} />
      
      {/* Admin Routes - Protected */}
      <Route path="/admin">
        <AdminRoute><AdminDashboard /></AdminRoute>
      </Route>
      <Route path="/admin/products">
        <AdminRoute><AdminProducts /></AdminRoute>
      </Route>
      <Route path="/admin/orders">
        <AdminRoute><AdminOrders /></AdminRoute>
      </Route>
      <Route path="/admin/promo">
        <AdminRoute><AdminPromoCodes /></AdminRoute>
      </Route>
      <Route path="/admin/quests">
        <AdminRoute><AdminQuests /></AdminRoute>
      </Route>
      <Route path="/admin/employees">
        <AdminRoute><AdminEmployees /></AdminRoute>
      </Route>
      <Route path="/admin/machines">
        <AdminRoute><AdminMachines /></AdminRoute>
      </Route>
      <Route path="/admin/ingredients">
        <AdminRoute><AdminIngredients /></AdminRoute>
      </Route>
      <Route path="/admin/cleaning">
        <AdminRoute><AdminCleaningSupplies /></AdminRoute>
      </Route>
      <Route path="/admin/spare-parts">
        <AdminRoute><AdminSpareParts /></AdminRoute>
      </Route>
      <Route path="/admin/warehouse">
        <AdminRoute><AdminWarehouse /></AdminRoute>
      </Route>
      <Route path="/admin/contractors">
        <AdminRoute><AdminContractors /></AdminRoute>
      </Route>
      <Route path="/admin/sales-import">
        <AdminRoute><AdminSalesImport /></AdminRoute>
      </Route>
      <Route path="/admin/inventory-check">
        <AdminRoute><AdminInventoryCheck /></AdminRoute>
      </Route>
      <Route path="/admin/bunkers">
        <AdminRoute><AdminBunkers /></AdminRoute>
      </Route>
      <Route path="/admin/mixers">
        <AdminRoute><AdminMixers /></AdminRoute>
      </Route>
      <Route path="/admin/tasks">
        <AdminRoute><AdminTasks /></AdminRoute>
      </Route>
      <Route path="/admin/assignments">
        <AdminRoute><AdminAssignments /></AdminRoute>
      </Route>
      <Route path="/admin/work-logs">
        <AdminRoute><AdminWorkLogs /></AdminRoute>
      </Route>
      <Route path="/admin/performance">
        <AdminRoute><AdminPerformance /></AdminRoute>
      </Route>
      
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Component to manage tg-mode class on html element
function TelegramModeManager() {
  const { themeMode, telegramThemeParams } = useTheme();
  
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'telegram') {
      root.classList.add('tg-mode');
    } else {
      root.classList.remove('tg-mode');
    }
    
    return () => {
      root.classList.remove('tg-mode');
    };
  }, [themeMode]);
  
  return null;
}

// Toaster with theme-aware styles
function ThemedToaster() {
  const { theme, themeMode, telegramThemeParams } = useTheme();
  
  // Get toast styles based on theme mode
  const getToastStyle = () => {
    if (themeMode === 'telegram' && telegramThemeParams) {
      return {
        background: telegramThemeParams.secondary_bg_color || telegramThemeParams.bg_color || '#FDF8F3',
        border: `1px solid ${theme === 'dark' ? '#3a3a3a' : '#E8DDD4'}`,
        color: telegramThemeParams.text_color || '#2C1810',
      };
    }
    
    if (theme === 'dark') {
      return {
        background: '#2a2a2a',
        border: '1px solid #3a3a3a',
        color: '#f5f5f5',
      };
    }
    
    return {
      background: '#FDF8F3',
      border: '1px solid #E8DDD4',
      color: '#2C1810',
    };
  };
  
  return (
    <Toaster 
      position="top-center"
      toastOptions={{
        style: getToastStyle(),
      }}
    />
  );
}

/**
 * VendHub Telegram Web App
 * Modern design with bottom navigation
 * Full Telegram themeParams integration
 */
function AppContent() {
  const { shouldShowOnboarding, completeOnboarding } = useOnboardingStore();
  const showOnboarding = shouldShowOnboarding();

  return (
    <>
      <TelegramModeManager />
      <ThemedToaster />
      {showOnboarding ? (
        <Onboarding onComplete={completeOnboarding} />
      ) : (
        <>
          <Router />
          <BottomNav />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TelegramProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </TelegramProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
