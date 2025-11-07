import { useAuth } from "@/hooks/useAuth";
import { useLocation, Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  // const [location] = useLocation(); // No longer needed for simplified auth

  // With simplified useAuth, isAuthenticated is always true and isLoading is always false.
  // This component will now always render its children.
  return <>{children}</>;
}