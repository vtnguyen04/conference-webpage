import { announcementService } from "@/services/announcementService";
import { documentService } from "@/services/documentService";
import { organizerService } from "@/services/organizerService";
import { sessionService } from "@/services/sessionService";
import { sightseeingService } from "@/services/sightseeingService";
import { speakerService } from "@/services/speakerService";
import { sponsorService } from "@/services/sponsorService";
import type { Announcement, Document, Organizer, Session, Sightseeing, Speaker, Sponsor } from "@shared/types";
import { useQuery } from "@tanstack/react-query";

export function usePublicSpeakers(slug?: string) {
  return useQuery<Speaker[]>({
    queryKey: ["api", "speakers", "slug", slug],
    queryFn: () => slug ? speakerService.getSpeakers(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicSessions(slug?: string) {
  return useQuery<Session[]>({
    queryKey: ["api", "sessions", "slug", slug],
    queryFn: () => slug ? sessionService.getSessions(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicSponsors(slug?: string) {
  return useQuery<Sponsor[]>({
    queryKey: ["api", "sponsors", "slug", slug],
    queryFn: () => slug ? sponsorService.getSponsors(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicOrganizers(slug?: string) {
  return useQuery<Organizer[]>({
    queryKey: ["api", "organizers", "slug", slug],
    queryFn: () => slug ? organizerService.getOrganizers(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicAnnouncements(slug?: string) {
  return useQuery<Announcement[]>({
    queryKey: ["api", "announcements", "slug", slug],
    queryFn: () => slug ? announcementService.getAnnouncements(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicAnnouncement(id?: string, slug?: string) {
  return useQuery<Announcement>({
    queryKey: slug ? ["api", "announcements", slug, id] : ["api", "announcements", id],
    queryFn: () => id ? announcementService.getAnnouncementById(id, slug) : Promise.reject("Missing ID"),
    enabled: !!id,
  });
}

export function usePublicSightseeing(slug?: string) {
  return useQuery<Sightseeing[]>({
    queryKey: ["api", "sightseeing", "slug", slug],
    queryFn: () => slug ? sightseeingService.getSightseeings(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicSightseeingItem(id?: string, slug?: string) {
  return useQuery<Sightseeing>({
    queryKey: slug ? ["api", "sightseeing", slug, id] : ["api", "sightseeing", id],
    queryFn: () => id ? sightseeingService.getSightseeingById(id, slug) : Promise.reject("Missing ID"),
    enabled: !!id,
  });
}

export function usePublicDocuments(slug?: string) {
  return useQuery<Document[]>({
    queryKey: ["api", "documents", "slug", slug],
    queryFn: () => slug ? documentService.getAll(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicDocument(id?: string, slug?: string) {
  return useQuery<Document>({
    queryKey: slug ? ["api", "documents", slug, id] : ["api", "documents", id],
    queryFn: () => id ? documentService.getById(id, slug) : Promise.reject("Missing ID"),
    enabled: !!id,
  });
}
