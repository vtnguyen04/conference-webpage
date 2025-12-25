import { useQuery } from "@tanstack/react-query";
import type { Conference } from "@shared/types";
import { conferenceService } from "@/services/conferenceService";
export const useActiveConference = () => {
    const { data: conference, isLoading, error } = useQuery<Conference>({
        queryKey: ["/api/conferences/active"],
        queryFn: conferenceService.getActiveConference,
    });
    return { conference, isLoading, error };
};
