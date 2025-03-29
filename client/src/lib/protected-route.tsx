import { Route, Redirect } from "wouter";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

type ComponentType = React.ComponentType<any> | (() => React.ReactNode);

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentType;
}) {
  // Use the useAuth hook to get authentication state and user data
  const { user, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="large" />
        </div>
      </Route>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Show protected component if authenticated
  return <Route path={path} component={Component} />
}
