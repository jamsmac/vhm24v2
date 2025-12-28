import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TelegramProvider } from "./contexts/TelegramContext";
import BottomNav from "./components/BottomNav";

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

function Router() {
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
      
      {/* Order Routes */}
      <Route path="/order/success" component={OrderSuccess} />
      
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * VendHub Telegram Web App
 * Modern design with bottom navigation
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TelegramProvider>
          <TooltipProvider>
            <Toaster 
              position="top-center"
              toastOptions={{
                style: {
                  background: '#FDF8F3',
                  border: '1px solid #E8DDD4',
                  color: '#2C1810',
                },
              }}
            />
            <Router />
            <BottomNav />
          </TooltipProvider>
        </TelegramProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
