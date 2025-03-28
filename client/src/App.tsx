import { Switch, Route } from "wouter";
import { ProtectedRoute } from "./lib/protected-route";
import { Toaster } from "@/components/ui/toaster";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ConversionHistoryPage from "@/pages/conversion-history-page";
import SettingsPage from "@/pages/settings-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <HomePage />} />
      <ProtectedRoute path="/convert" component={() => <HomePage />} />
      <ProtectedRoute path="/history" component={() => <ConversionHistoryPage />} />
      <ProtectedRoute path="/settings" component={() => <SettingsPage />} />
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
