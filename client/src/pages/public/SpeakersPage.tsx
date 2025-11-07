import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import type { Speaker } from "@shared/schema";

export default function SpeakersPage() {
  const { data: speakers = [], isLoading } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers"],
  });

  const moderators = speakers.filter((s) => s.role === "moderator");
  const regularSpeakers = speakers.filter((s) => s.role === "speaker");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  const SpeakerCard = ({ speaker }: { speaker: Speaker }) => (
    <Card className="overflow-hidden hover-elevate transition-all h-full" data-testid={`card-speaker-${speaker.id}`}>
      <CardContent className="p-6">
        <div className="text-center">
          {speaker.photoUrl ? (
            <img
              src={speaker.photoUrl}
              alt={speaker.name}
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-card"
              data-testid={`img-speaker-photo-${speaker.id}`}
            />
          ) : (
            <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-muted flex items-center justify-center border-4 border-card">
              <User className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <h3 className="text-lg font-semibold mb-1" data-testid={`text-speaker-name-${speaker.id}`}>
            {speaker.name}
          </h3>
          {speaker.title && (
            <p className="text-sm text-muted-foreground mb-2" data-testid={`text-speaker-title-${speaker.id}`}>
              {speaker.title}
            </p>
          )}
          {speaker.credentials && (
            <p className="text-xs text-muted-foreground mb-2" data-testid={`text-speaker-credentials-${speaker.id}`}>
              {speaker.credentials}
            </p>
          )}
          {speaker.specialty && (
            <Badge variant="secondary" className="mb-3" data-testid={`badge-speaker-specialty-${speaker.id}`}>
              {speaker.specialty}
            </Badge>
          )}
          {speaker.bio && (
            <p className="text-sm text-muted-foreground mt-4 text-left" data-testid={`text-speaker-bio-${speaker.id}`}>
              {speaker.bio}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-12" data-testid="text-speakers-title">
            Chủ tọa & Diễn giả
          </h1>

          {/* Moderators Section */}
          {moderators.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-primary" data-testid="text-moderators-title">
                Chủ tọa
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moderators.map((speaker) => (
                  <SpeakerCard key={speaker.id} speaker={speaker} />
                ))}
              </div>
            </section>
          )}

          {/* Speakers Section */}
          {regularSpeakers.length > 0 && (
            <section>
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-accent" data-testid="text-speakers-section-title">
                Diễn giả
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularSpeakers.map((speaker) => (
                  <SpeakerCard key={speaker.id} speaker={speaker} />
                ))}
              </div>
            </section>
          )}

          {speakers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground" data-testid="text-no-speakers">
                  Danh sách chủ tọa và diễn giả đang được cập nhật.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
