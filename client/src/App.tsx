import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TelegramProvider } from "./contexts/TelegramContext";

// Pages
import Home from "./pages/Home";
import Locations from "./pages/Locations";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import OrderHistory from "./pages/OrderHistory";
import Bonuses from "./pages/Bonuses";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import OrderSuccess from "./pages/OrderSuccess";

function Router() {
  return (
    <Switch>
      {/* Main Routes */}
      <Route path="/" component={Home} />
      <Route path="/locations" component={Locations} />
      <Route path="/menu/:id" component={Menu} />
      <Route path="/cart" component={Cart} />
      
      {/* Profile Routes */}
      <Route path="/profile" component={Profile} />
      <Route path="/profile/history" component={OrderHistory} />
      <Route path="/profile/bonuses" component={Bonuses} />
      <Route path="/profile/settings" component={Settings} />
      <Route path="/profile/help" component={Help} />
      
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
 * "Warm Brew" Design System - Light theme optimized for Telegram
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
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
          </TooltipProvider>
        </TelegramProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
