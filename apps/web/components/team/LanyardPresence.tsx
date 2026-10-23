"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LanyardData,
  LanyardSpotify,
  LanyardActivity,
  LanyardDiscordUser,
} from "@nova/shared";
import {
  Music2,
  ExternalLink,
  Laptop,
  Smartphone,
  Globe,
  Gamepad2,
  Code2,
  Terminal,
  Activity as ActivityIcon,
  Sparkles,
} from "lucide-react";
import {
  getLanyardAvatarDecorationUrl,
  getLanyardActivityAssetUrl,
} from "@/hooks/useLanyard";

// ==========================================
// 1. LIVE SPOTIFY PLAYER CARD
// ==========================================
export function SpotifyPlayerCard({
  spotify,
  compact = false,
}: {
  spotify: LanyardSpotify;
  compact?: boolean;
}) {
  const [now, setNow] = useState(Date.now());

  // Tick every second to update elapsed track progress
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalDuration = Math.max(0, spotify.timestamps.end - spotify.timestamps.start);
  const elapsed = Math.min(
    totalDuration,
    Math.max(0, now - spotify.timestamps.start)
  );
  const progressPercent = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const spotifyUrl = spotify.track_id
    ? `https://open.spotify.com/track/${spotify.track_id}`
    : `https://open.spotify.com/search/${encodeURIComponent(
        `${spotify.song} ${spotify.artist}`
      )}`;

  if (compact) {
    return (
      <a
        href={spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group/spot flex items-center gap-2 p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={spotify.album_art_url}
          alt={spotify.album}
          className="w-7 h-7 rounded-md object-cover shadow-sm shrink-0 group-hover/spot:scale-105 transition-transform"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="flex items-end gap-0.5 h-2.5">
              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms] h-full" />
              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:200ms] h-2/3" />
              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:400ms] h-4/5" />
            </span>
            <p className="text-[11px] font-semibold text-emerald-300 truncate">
              {spotify.song}
            </p>
          </div>
          <p className="text-[10px] text-zinc-400 truncate">{spotify.artist}</p>
        </div>
      </a>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-zinc-950/80 to-zinc-950/90 p-4 shadow-xl backdrop-blur-xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
          <span className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms] h-full" />
            <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
            <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms] h-4/5" />
          </span>
          <span>Listening to Spotify</span>
        </div>
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px]"
          onClick={(e) => e.stopPropagation()}
        >
          <span>Open Track</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Track Details */}
      <div className="flex items-center gap-3.5">
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 relative group"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={spotify.album_art_url}
            alt={spotify.album}
            className="w-16 h-16 rounded-xl object-cover shadow-lg border border-white/10 group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Music2 className="h-6 w-6 text-white" />
          </div>
        </a>

        <div className="min-w-0 flex-1 space-y-1">
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block font-bold text-sm text-white hover:text-emerald-400 transition-colors truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {spotify.song}
          </a>
          <p className="text-xs text-zinc-300 truncate">by {spotify.artist}</p>
          <p className="text-[11px] text-zinc-400 truncate">on {spotify.album}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>{formatTime(elapsed)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. DISCORD ACTIVITY CARD
// ==========================================
export function ActivityCard({ activity }: { activity: LanyardActivity }) {
  const isCustomStatus = activity.type === 4;
  const isCoding =
    activity.name.toLowerCase().includes("code") ||
    activity.name.toLowerCase().includes("visual studio");
  const isTerminal = activity.name.toLowerCase().includes("terminal");

  const largeImgUrl = getLanyardActivityAssetUrl(
    activity.application_id,
    activity.assets?.large_image
  );
  const smallImgUrl = getLanyardActivityAssetUrl(
    activity.application_id,
    activity.assets?.small_image
  );

  // Custom Status
  if (isCustomStatus) {
    if (!activity.state && !activity.emoji) return null;
    return (
      <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-3 flex items-center gap-2.5 text-xs">
        {activity.emoji && (
          <span className="text-base shrink-0">
            {activity.emoji.id ? (
              <img
                src={`https://cdn.discordapp.com/emojis/${activity.emoji.id}.${
                  activity.emoji.animated ? "gif" : "webp"
                }?size=32`}
                alt={activity.emoji.name}
                className="w-4 h-4 inline-block"
              />
            ) : (
              activity.emoji.name
            )}
          </span>
        )}
        {activity.state && (
          <span className="text-zinc-200 font-medium italic truncate">
            &ldquo;{activity.state}&rdquo;
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/50 p-3.5 space-y-2 text-xs">
      <div className="flex items-center gap-3">
        {largeImgUrl ? (
          <div className="relative shrink-0">
            <img
              src={largeImgUrl}
              alt={activity.assets?.large_text || activity.name}
              className="w-11 h-11 rounded-lg object-cover bg-zinc-800"
            />
            {smallImgUrl && (
              <img
                src={smallImgUrl}
                alt={activity.assets?.small_text || "badge"}
                className="w-4 h-4 rounded-full border-2 border-zinc-950 absolute -bottom-1 -right-1 bg-zinc-800"
              />
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0">
            {isCoding ? (
              <Code2 className="h-5 w-5 text-cyan-400" />
            ) : isTerminal ? (
              <Terminal className="h-5 w-5 text-emerald-400" />
            ) : (
              <Gamepad2 className="h-5 w-5 text-indigo-400" />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-bold text-white truncate">{activity.name}</p>
          {activity.details && (
            <p className="text-zinc-300 text-[11px] truncate font-medium">
              {activity.details}
            </p>
          )}
          {activity.state && (
            <p className="text-zinc-400 text-[10px] truncate">{activity.state}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. ACTIVE DEVICE BADGES
// ==========================================
export function DeviceBadges({ presence }: { presence: LanyardData }) {
  const {
    active_on_discord_desktop,
    active_on_discord_mobile,
    active_on_discord_web,
  } = presence;

  if (
    !active_on_discord_desktop &&
    !active_on_discord_mobile &&
    !active_on_discord_web
  ) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
      <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[9px]">
        Active on:
      </span>
      {active_on_discord_desktop && (
        <span
          title="Desktop App"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-white/5 text-zinc-300"
        >
          <Laptop className="h-2.5 w-2.5 text-cyan-400" />
          <span>Desktop</span>
        </span>
      )}
      {active_on_discord_mobile && (
        <span
          title="Mobile App"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-white/5 text-zinc-300"
        >
          <Smartphone className="h-2.5 w-2.5 text-emerald-400" />
          <span>Mobile</span>
        </span>
      )}
      {active_on_discord_web && (
        <span
          title="Web App"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-white/5 text-zinc-300"
        >
          <Globe className="h-2.5 w-2.5 text-purple-400" />
          <span>Web</span>
        </span>
      )}
    </div>
  );
}

// ==========================================
// 4. AVATAR WITH LIVE DECORATION & STATUS
// ==========================================
export function LanyardAvatar({
  presence,
  fallbackAvatar,
  borderColor,
  size = "md",
}: {
  presence?: LanyardData;
  fallbackAvatar: string;
  borderColor?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const decorationUrl = presence ? getLanyardAvatarDecorationUrl(presence) : null;
  const status = presence?.discord_status || "offline";

  // Size mapping
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
  };

  const statusDotSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
    xl: "h-5 w-5",
  };

  // Avatar source priority: Discord live avatar if available, otherwise configured avatar
  const avatarSrc = useMemo(() => {
    if (presence?.discord_user?.avatar) {
      const ext = presence.discord_user.avatar.startsWith("a_") ? "gif" : "webp";
      return `https://cdn.discordapp.com/avatars/${presence.discord_user.id}/${presence.discord_user.avatar}.${ext}?size=256`;
    }
    return fallbackAvatar;
  }, [presence, fallbackAvatar]);

  const renderStatus = () => {
    switch (status) {
      case "online":
        return (
          <span className={`relative flex ${statusDotSizes[size]}`}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span
              className={`relative inline-flex rounded-full ${statusDotSizes[size]} bg-emerald-500 border-2 border-[#0a0d14]`}
            ></span>
          </span>
        );
      case "idle":
        return (
          <span
            className={`inline-flex rounded-full ${statusDotSizes[size]} bg-amber-500 border-2 border-[#0a0d14]`}
          />
        );
      case "dnd":
        return (
          <span
            className={`inline-flex rounded-full ${statusDotSizes[size]} bg-rose-500 border-2 border-[#0a0d14]`}
          />
        );
      default:
        return (
          <span
            className={`inline-flex rounded-full ${statusDotSizes[size]} bg-zinc-500 border-2 border-[#0a0d14]`}
          />
        );
    }
  };

  return (
    <div className="relative shrink-0 inline-block">
      {/* Base Avatar */}
      <img
        src={avatarSrc}
        alt="User Avatar"
        className={`${sizeClasses[size]} rounded-full border-2 object-cover bg-zinc-900 transition-transform`}
        style={{ borderColor: borderColor || "#6366f1" }}
      />

      {/* Discord Avatar Decoration Preset Overlay */}
      {decorationUrl && (
        <img
          src={decorationUrl}
          alt="Avatar Decoration"
          className="absolute -top-[14%] -left-[14%] w-[128%] h-[128%] pointer-events-none select-none z-10"
        />
      )}

      {/* Live Status Dot */}
      <div className="absolute -bottom-0.5 -right-0.5 z-20">
        {renderStatus()}
      </div>
    </div>
  );
}

