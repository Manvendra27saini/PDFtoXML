import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ConversionHistoryPage from "@/pages/conversion-history-page";
import SettingsPage from "@/pages/settings-page";
import NotFound from "@/pages/not-found";
import { AuthRoute } from "@/lib/auth-route";

function Router() {
  return (
    <Switch>
      <AuthRoute path="/" component={HomePage} />
      <AuthRoute path="/convert" component={HomePage} />
      <AuthRoute path="/history" component={ConversionHistoryPage} />
      <AuthRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
