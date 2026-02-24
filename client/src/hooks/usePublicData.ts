import { useQuery } from "@tanstack/react-query";
import { speakerService } from "@/services/speakerService";
import { sessionService } from "@/services/sessionService";
import { sponsorService } from "@/services/sponsorService";
import { organizerService } from "@/services/organizerService";
import { announcementService } from "@/services/announcementService";
import { sightseeingService } from "@/services/sightseeingService";
import type { Speaker, Session, Sponsor, Organizer, Announcement, Sightseeing } from "@shared/types";

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
