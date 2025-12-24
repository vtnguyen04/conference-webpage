import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
// Dynamically import PublicApp and AdminApp
const PublicApp = React.lazy(() => import("./PublicApp").then(module => ({ default: module.PublicApp })));
const AdminApp = React.lazy(() => import("./AdminApp").then(module => ({ default: module.AdminApp })));
import { useLocation, Router } from "wouter";
import "./index.css";

function App() {
  const [location] = useLocation();

  const isAdminRoute = location.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Suspense fallback={<div>Loading...</div>}> {/* Add Suspense boundary */}
          {isAdminRoute ? <AdminApp /> : <PublicApp />}
        </Suspense>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);