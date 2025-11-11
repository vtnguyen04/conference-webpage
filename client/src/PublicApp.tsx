// src/PublicApp.tsx
import { Switch, Route } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import HomePage from "@/pages/public/HomePage";
import AboutPage from "@/pages/public/AboutPage";
import ProgramPage from "@/pages/public/ProgramPage";
import SpeakersPage from "@/pages/public/SpeakersPage";
import SponsorsPage from "@/pages/public/SponsorsPage";
import AnnouncementsPage from "@/pages/public/AnnouncementsPage";
import AnnouncementDetailPage from "@/pages/public/AnnouncementDetailPage";
import SightseeingPage from "@/pages/public/SightseeingPage";
import SightseeingDetailPage from "@/pages/public/SightseeingDetailPage";
import RegistrationPage from "@/pages/public/RegistrationPage";
import RegistrationConfirmedPage from "@/pages/public/RegistrationConfirmedPage";
import RegistrationFailedPage from "@/pages/public/RegistrationFailedPage";
import ContactPage from "@/pages/public/ContactPage";
import NotFound from "@/pages/NotFound";
import DocumentsPage from "@/pages/public/DocumentsPage";

export function PublicApp() {
  return (
    <PublicLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/about" component={AboutPage} />
        
        {/* Active Conference Routes (non-year-specific) */}
        <Route path="/program" component={ProgramPage} />
        <Route path="/speakers" component={SpeakersPage} />
        <Route path="/sponsors" component={SponsorsPage} />
        <Route path="/announcements" component={AnnouncementsPage} />
        <Route path="/announcements/:id" component={AnnouncementDetailPage} />
        <Route path="/documents" component={DocumentsPage} />

        {/* Year-specific routes for past conferences */}
        <Route path="/conference/:slug" component={ProgramPage} /> {/* Default for slug */}
        <Route path="/conference/:slug/program" component={ProgramPage} />
        <Route path="/conference/:slug/speakers" component={SpeakersPage} />
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
    </PublicLayout>
  );
}