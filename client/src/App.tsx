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
import Tasks from "./pages/Tasks";
import LinkEmail from "./pages/LinkEmail";
import HomeSettings from "./pages/HomeSettings";
import Referral from "./pages/Referral";
import RewardsStore from "./pages/RewardsStore";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminPromoCodes from "./pages/admin/PromoCodes";
import AdminMachines from "./pages/admin/Machines";
import AdminMachinesMap from "./pages/admin/MachinesMap";
import AdminTasks from "./pages/admin/Tasks";
import AdminRewards from "./pages/admin/Rewards";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Main Routes */}
      <Route path="/" component={Home} />
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
      <Route path="/profile/tasks" component={Tasks} />
      <Route path="/profile/link-email" component={LinkEmail} />
      <Route path="/profile/home-settings" component={HomeSettings} />
      <Route path="/profile/referral" component={Referral} />
      <Route path="/profile/rewards" component={RewardsStore} />
      
      {/* Order Routes */}
      <Route path="/order/success" component={OrderSuccess} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/promo" component={AdminPromoCodes} />
      <Route path="/admin/machines" component={AdminMachines} />
      <Route path="/admin/machines/map" component={AdminMachinesMap} />
      <Route path="/admin/tasks" component={AdminTasks} />
      <Route path="/admin/rewards" component={AdminRewards} />
      
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
