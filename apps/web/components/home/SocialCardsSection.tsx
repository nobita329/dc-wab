"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SocialCardsSection as SocialCardsSectionType, DiscordWidgetData } from "@nova/shared";
import { ExternalLink, Users } from "lucide-react";

interface SocialCardsSectionProps {
  socialCards?: SocialCardsSectionType;
  discordServerId?: string;
}

export function SocialCardsSection({
  socialCards,
  discordServerId = "1540761150797389915",
}: SocialCardsSectionProps) {
  // If disabled, return null
  if (socialCards?.enabled === false) return null;

  // Real-time Discord presence for the Discord card
  const { data: discordData } = useQuery<DiscordWidgetData>({
    queryKey: ["discordWidgetData", discordServerId],
    queryFn: async () => {
      const res = await api.get(`/api/discord/widget?serverId=${discordServerId}`);
      return res.data;
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const defaultCards = [
    {
      id: "card-youtube",
      platform: "youtube" as const,
      title: "YouTube",
      subtitle: "404 subs",
      url: "https://youtube.com/@nobitahost",
      color: "#ef4444",
    },
    {
      id: "card-instagram",
      platform: "instagram" as const,
      title: "Instagram",
      subtitle: "@nobita_dev.in",
      url: "https://instagram.com/nobita_dev.in",
      color: "#ec4899",
    },
    {
      id: "card-github",
      platform: "github" as const,
      title: "GitHub",
      subtitle: "-- repos",
      url: "https://github.com",
      color: "#71717a",
    },
    {
      id: "card-discord",
      platform: "discord" as const,
      title: "Discord",
      subtitle: "30 Members Online",
      url: "https://discord.com/invite/PR2x6RGf",
      color: "#5865F2",
      buttonText: "Join",
    },
  ];

  const items = socialCards?.items && socialCards.items.length > 0 ? socialCards.items : defaultCards;

  const renderIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return (
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.25)]">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        );
      case "instagram":
        return (
          <div className="w-12 h-12 rounded-full bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(236,72,153,0.25)]">
            <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
        );
      case "github":
        return (
          <div className="w-12 h-12 rounded-full bg-zinc-700/30 border border-zinc-500/30 flex items-center justify-center text-zinc-300 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(161,161,170,0.15)]">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </div>
        );
      case "discord":
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(88,101,242,0.3)]">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </div>
        );
    }
  };

  const getBorderColor = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "border-red-500/30 hover:border-red-500/70 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]";
      case "instagram":
        return "border-pink-500/30 hover:border-pink-500/70 hover:shadow-[0_0_25px_rgba(236,72,153,0.2)]";
      case "github":
        return "border-zinc-500/30 hover:border-zinc-400/70 hover:shadow-[0_0_25px_rgba(161,161,170,0.15)]";
      case "discord":
      default:
        return "border-[#5865F2]/40 hover:border-[#5865F2]/80 hover:shadow-[0_0_25px_rgba(88,101,242,0.25)]";
    }
  };

  return (
    <section className="relative py-6 sm:py-8 overflow-hidden">
      <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Optional Title / Subtitle if configured */}
        {(socialCards?.title || socialCards?.subtitle) && (
          <div className="text-center mb-8">
            {socialCards.title && (
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {socialCards.title}
              </h3>
            )}
            {socialCards.subtitle && (
              <p className="mt-1 text-sm text-zinc-400">
                {socialCards.subtitle}
              </p>
            )}
          </div>
        )}

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const isDiscord = item.platform === "discord";
            const inviteUrl =
              isDiscord && discordData?.instant_invite
                ? discordData.instant_invite
                : item.url;

            // Live presence display for Discord card
            const subtitleText =
              isDiscord && discordData?.presence_count !== undefined
                ? `${discordData.presence_count} Members Online`
                : item.subtitle;

            return (
              <div
                key={item.id}
                className={`group relative rounded-2xl border bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-4 sm:p-5 backdrop-blur-xl transition-all duration-300 flex items-center justify-between gap-4 ${getBorderColor(
                  item.platform
                )}`}
              >
                {/* Left: Icon + Info */}
                <a
                  href={inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 min-w-0 flex-1 group-hover:opacity-95"
                >
                  {renderIcon(item.platform)}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-base font-bold text-white tracking-tight truncate group-hover:text-zinc-100">
                        {item.title}
                      </h4>
                      {!isDiscord && (
                        <ExternalLink className="h-3 w-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isDiscord && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      )}
                      <p className="text-xs font-medium text-zinc-400 truncate">
                        {subtitleText}
                      </p>
                    </div>
                  </div>
                </a>

                {/* Right: Action Button for Discord or optional custom */}
                {isDiscord ? (
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all duration-200 active:scale-95 hover:scale-105"
                  >
                    {item.buttonText || "Join"}
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

