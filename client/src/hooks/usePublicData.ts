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
    queryKey: ["/api/speakers", slug],
    queryFn: () => slug ? speakerService.getSpeakers(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicSessions(slug?: string) {
  return useQuery<Session[]>({
    queryKey: ["/api/sessions", slug],
    queryFn: () => slug ? sessionService.getSessions(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicSponsors(slug?: string) {
  return useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors", slug],
    queryFn: () => slug ? sponsorService.getSponsors(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicOrganizers(slug?: string) {
  return useQuery<Organizer[]>({
    queryKey: ["/api/organizers", slug],
    queryFn: () => slug ? organizerService.getOrganizers(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicAnnouncements(slug?: string) {
  return useQuery<Announcement[]>({
    queryKey: ["/api/announcements", slug],
    queryFn: () => slug ? announcementService.getAnnouncements(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicAnnouncement(id?: string) {
  return useQuery<Announcement>({
    queryKey: ["/api/announcements", id],
    queryFn: () => id ? announcementService.getAnnouncementById(id) : Promise.reject("Missing ID"),
    enabled: !!id,
  });
}

export function usePublicSightseeing(slug?: string) {
  return useQuery<Sightseeing[]>({
    queryKey: ["/api/sightseeing", slug],
    queryFn: () => slug ? sightseeingService.getSightseeings(slug) : Promise.resolve([]),
    enabled: !!slug,
  });
}

export function usePublicSightseeingItem(id?: string) {
  return useQuery<Sightseeing>({
    queryKey: ["/api/sightseeing", id],
    queryFn: () => id ? sightseeingService.getSightseeingById(id) : Promise.reject("Missing ID"),
    enabled: !!id,
  });
}
