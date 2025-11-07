// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import { PublicApp } from "./PublicApp"; // <-- Import PublicApp
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PublicApp /> {/* <-- Sử dụng PublicApp */}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);