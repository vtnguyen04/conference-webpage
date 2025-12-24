// src/PublicApp.tsx
import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { Loader2 } from "lucide-react";

// Lazy load all public pages for code splitting
const HomePage = React.lazy(() => import("@/pages/public/HomePage"));
const AboutPage = React.lazy(() => import("@/pages/public/AboutPage"));
const ProgramPage = React.lazy(() => import("@/pages/public/ProgramPage"));
const SpeakersPage = React.lazy(() => import("@/pages/public/SpeakersPage"));
const OrganizersPage = React.lazy(() => import("@/pages/public/OrganizersPage"));
const SponsorsPage = React.lazy(() => import("@/pages/public/SponsorsPage"));
const AnnouncementsPage = React.lazy(() => import("@/pages/public/AnnouncementsPage"));
const AnnouncementDetailPage = React.lazy(() => import("@/pages/public/AnnouncementDetailPage"));
const SightseeingPage = React.lazy(() => import("@/pages/public/SightseeingPage"));
const SightseeingDetailPage = React.lazy(() => import("@/pages/public/SightseeingDetailPage"));
const RegistrationPage = React.lazy(() => import("@/pages/public/RegistrationPage"));
const RegistrationConfirmedPage = React.lazy(() => import("@/pages/public/RegistrationConfirmedPage"));
const RegistrationFailedPage = React.lazy(() => import("@/pages/public/RegistrationFailedPage"));
const ContactPage = React.lazy(() => import("@/pages/public/ContactPage"));
const DocumentsPage = React.lazy(() => import("@/pages/public/DocumentsPage"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));


export function PublicApp() {
  return (
    <PublicLayout>
      <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/about" component={AboutPage} />
          
          {/* Active Conference Routes (non-year-specific) */}
          <Route path="/program" component={ProgramPage} />
          <Route path="/speakers" component={SpeakersPage} />
          <Route path="/organizers" component={OrganizersPage} />
          <Route path="/sponsors" component={SponsorsPage} />
          <Route path="/announcements" component={AnnouncementsPage} />
          <Route path="/announcements/:id" component={AnnouncementDetailPage} />
          <Route path="/documents" component={DocumentsPage} />

          {/* Year-specific routes for past conferences */}
          <Route path="/conference/:slug" component={ProgramPage} /> {/* Default for slug */}
          <Route path="/conference/:slug/program" component={ProgramPage} />
          <Route path="/conference/:slug/speakers" component={SpeakersPage} />
          <Route path="/conference/:slug/organizers" component={OrganizersPage} />
          <Route path="/conference/:slug/sponsors" component={SponsorsPage} />
          <Route path="/conference/:slug/announcements" component={AnnouncementsPage} />
          <Route path="/conference/:slug/announcements/:id" component={AnnouncementDetailPage} />
          <Route path="/conference/:slug/documents" component={DocumentsPage} />

          {/* General Routes (non-conference specific) */}
          <Route path="/sightseeing" component={SightseeingPage} />
          <Route path="/sightseeing/:id" component={SightseeingDetailPage} />
          <Route path="/register" component={RegistrationPage} />
          <Route path="/registration-confirmed" component={RegistrationConfirmedPage} />
          <Route path="/registration-failed" component={RegistrationFailedPage} />
          <Route path="/contact" component={ContactPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </PublicLayout>
  );
}