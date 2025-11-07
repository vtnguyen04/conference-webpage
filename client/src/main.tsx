// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { PublicApp } from "./PublicApp";
import { AdminApp } from "./AdminApp"; // Import AdminApp
import { useLocation, Router } from "wouter"; // Import useLocation and Router
import "./index.css";

function App() {
  const [location] = useLocation();
  console.log('main.tsx - Current location:', location);

  // Determine if we are in the admin section
  const isAdminRoute = location.startsWith("/admin");
  console.log('main.tsx - isAdminRoute:', isAdminRoute);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isAdminRoute ? <AdminApp /> : <PublicApp />} {/* Conditionally render AdminApp or PublicApp */}
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