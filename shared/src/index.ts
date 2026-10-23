import { z } from "zod";

// ==========================================
// User & Auth Types
// ==========================================
export interface User {
  id: string;
  username: string;
  email?: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export const LoginRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// ==========================================
// Settings Types
// ==========================================
export interface BrandingSettings {
  siteTitle: string;
  siteTagline: string;
  logoText: string;
  logoImageUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  defaultTheme: "dark" | "light" | "system";
  // Panel Customization & Identity
  panelName?: string;
  panelLogo?: string;
  panelFaviconName?: string;
  panelFaviconLogo?: string;
  panelMotd?: string;
  panelMotdSubtitle?: string;
  panelMotdPosition?: "left" | "right" | "top";
  panelMotdEnabled?: boolean;
  panelMotdImage?: string;
  panelMotdLink?: string;
  // Panel Background & Glassmorphism
  backgroundType?: "color" | "gradient" | "image" | "video";
  backgroundUrl?: string;
  backgroundFit?: "cover" | "contain" | "fill";
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundOpacity?: number;
  panelTransparency?: number;
  panelBlur?: number;
  overlayColor?: string;
  overlayOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  favoriteWallpapers?: string[];
  glassTint?: string;
  enablePublicBackground?: boolean;
  videoAutoplay?: boolean;
  videoLoop?: boolean;
  videoMuted?: boolean;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImageUrl: string;
  twitterHandle: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  themeColor?: string;
  robotsIndex?: string;
}

export interface FeatureSettings {
  allowUserCustomBackground: boolean;
  allowUserTransparency: boolean;
  allowUserBlur: boolean;
  allowUserTheme: boolean;
  allowUserWallpapers: boolean;
  enablePublicBackground: boolean;
  enableVideoBackground: boolean;
  enableMotdBanner: boolean;
  enableGlassmorphism: boolean;
  defaultUserTheme: "dark" | "light" | "system";
  lastSavedTime?: string;
}

export interface SocialLink {
  id: string;
  platform: "github" | "twitter" | "linkedin" | "instagram" | "youtube" | "dribbble" | "other";
  label: string;
  url: string;
  enabled: boolean;
}

export interface SiteSettings {
  branding: BrandingSettings;
  seo: SeoSettings;
  features?: FeatureSettings;
  socials: SocialLink[];
  updatedAt: string;
  updatedBy: string;
}

export interface UserPanelPreferences {
  userId: string;
  theme?: "dark" | "light" | "system";
  backgroundType?: "color" | "gradient" | "image" | "video";
  backgroundUrl?: string;
  backgroundFit?: "cover" | "contain" | "fill";
  backgroundPosition?: "center" | "top" | "bottom" | "left" | "right";
  backgroundOpacity?: number;
  panelTransparency?: number;
  panelBlur?: number;
  overlayColor?: string;
  overlayOpacity?: number;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  favoriteWallpapers?: string[];
  updatedAt?: string;
}

export const BrandingSettingsSchema = z.object({
  siteTitle: z.string().min(1),
  siteTagline: z.string(),
  logoText: z.string().min(1),
  logoImageUrl: z.string(),
  faviconUrl: z.string(),
  primaryColor: z.string(),
  accentColor: z.string(),
  fontFamily: z.string(),
  borderRadius: z.string(),
  defaultTheme: z.enum(["dark", "light", "system"]),
  // Panel Customization
  panelName: z.string().default("").optional(),
  panelLogo: z.string().default("").optional(),
  panelFaviconName: z.string().default("").optional(),
  panelFaviconLogo: z.string().default("").optional(),
  panelMotd: z.string().default("").optional(),
  panelMotdSubtitle: z.string().default("").optional(),
  panelMotdPosition: z.enum(["left", "right", "top"]).default("left").optional(),
  panelMotdEnabled: z.boolean().default(true).optional(),
  panelMotdImage: z.string().default("").optional(),
  panelMotdLink: z.string().default("").optional(),
  // Panel Background & Glassmorphism
  backgroundType: z.enum(["color", "gradient", "image", "video"]).default("image").optional(),
  backgroundUrl: z.string().default("").optional(),
  backgroundFit: z.enum(["cover", "contain", "fill"]).default("cover").optional(),
  backgroundPosition: z.enum(["center", "top", "bottom", "left", "right"]).default("center").optional(),
  backgroundOpacity: z.number().min(0).max(100).default(100).optional(),
  panelTransparency: z.number().min(0).max(100).default(35).optional(),
  panelBlur: z.number().min(0).max(40).default(16).optional(),
  overlayColor: z.string().default("#09090b").optional(),
  overlayOpacity: z.number().min(0).max(100).default(0).optional(),
  gradientFrom: z.string().default("#7c3aed").optional(),
  gradientTo: z.string().default("#06b6d4").optional(),
  gradientAngle: z.number().min(0).max(360).default(135).optional(),
  favoriteWallpapers: z.array(z.string()).default([]).optional(),
  glassTint: z.string().default("#12111a").optional(),
  enablePublicBackground: z.boolean().default(true).optional(),
  videoAutoplay: z.boolean().default(true).optional(),
  videoLoop: z.boolean().default(true).optional(),
  videoMuted: z.boolean().default(true).optional(),
});

export const SeoSettingsSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  keywords: z.array(z.string()),
  ogImageUrl: z.string(),
  twitterHandle: z.string(),
  canonicalUrl: z.string().default("").optional(),
  ogTitle: z.string().default("").optional(),
  ogDescription: z.string().default("").optional(),
  themeColor: z.string().default("#7c3aed").optional(),
  robotsIndex: z.string().default("index, follow").optional(),
});

export const FeatureSettingsSchema = z.object({
  allowUserCustomBackground: z.boolean().default(true),
  allowUserTransparency: z.boolean().default(true),
  allowUserBlur: z.boolean().default(true),
  allowUserTheme: z.boolean().default(true),
  allowUserWallpapers: z.boolean().default(true),
  enablePublicBackground: z.boolean().default(true),
  enableVideoBackground: z.boolean().default(true),
  enableMotdBanner: z.boolean().default(true),
  enableGlassmorphism: z.boolean().default(true),
  defaultUserTheme: z.enum(["dark", "light", "system"]).default("dark"),
  lastSavedTime: z.string().optional(),
});

export const UserPanelPreferencesSchema = z.object({
  userId: z.string().min(1),
  theme: z.enum(["dark", "light", "system"]).optional(),
  backgroundType: z.enum(["color", "gradient", "image", "video"]).optional(),
  backgroundUrl: z.string().optional(),
  backgroundFit: z.enum(["cover", "contain", "fill"]).optional(),
  backgroundPosition: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
  backgroundOpacity: z.number().min(0).max(100).optional(),
  panelTransparency: z.number().min(0).max(100).optional(),
  panelBlur: z.number().min(0).max(40).optional(),
  overlayColor: z.string().optional(),
  overlayOpacity: z.number().min(0).max(100).optional(),
  gradientFrom: z.string().optional(),
  gradientTo: z.string().optional(),
  gradientAngle: z.number().min(0).max(360).optional(),
  favoriteWallpapers: z.array(z.string()).optional(),
  updatedAt: z.string().optional(),
});

export const SocialLinkSchema = z.object({
  id: z.string(),
  platform: z.enum(["github", "twitter", "linkedin", "instagram", "youtube", "dribbble", "other"]),
  label: z.string(),
  url: z.string(),
  enabled: z.boolean(),
});

export const SiteSettingsSchema = z.object({
  branding: BrandingSettingsSchema,
  seo: SeoSettingsSchema,
  features: FeatureSettingsSchema.optional(),
  socials: z.array(SocialLinkSchema),
});

export const DEFAULT_GLOBAL_SETTINGS: SiteSettings = {
  branding: {
    siteTitle: "Nova Studio — Creative Digital Agency",
    siteTagline: "Crafting transcendent digital experiences, immersive brands, and high-performance web applications.",
    logoText: "NOVA STUDIO",
    logoImageUrl: "",
    faviconUrl: "/favicon.ico",
    primaryColor: "#7c3aed",
    accentColor: "#06b6d4",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    defaultTheme: "dark",
    panelName: "NOVA STUDIO",
    panelLogo: "",
    panelFaviconName: "Nova Web Panel",
    panelFaviconLogo: "/favicon.ico",
    panelMotd: "Welcome to Nova Studio — Elite Engineering & Creative System",
    panelMotdSubtitle: "Latest stable architecture release active",
    panelMotdPosition: "left",
    panelMotdEnabled: true,
    panelMotdImage: "",
    panelMotdLink: "",
    backgroundType: "image",
    backgroundUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop",
    backgroundFit: "cover",
    backgroundPosition: "center",
    backgroundOpacity: 100,
    panelTransparency: 35,
    panelBlur: 16,
    overlayColor: "#09090b",
    overlayOpacity: 0,
    gradientFrom: "#7c3aed",
    gradientTo: "#06b6d4",
    gradientAngle: 135,
    favoriteWallpapers: [],
    glassTint: "#12111a",
    enablePublicBackground: true,
    videoAutoplay: true,
    videoLoop: true,
    videoMuted: true,
  },
  seo: {
    metaTitle: "Nova Studio — High Impact Digital Design & Engineering",
    metaDescription: "Nova Studio is an elite creative digital agency specializing in modern web design, scalable architectures, and interactive digital experiences.",
    keywords: ["creative studio", "digital agency", "web development", "nextjs", "react", "ux design", "branding"],
    ogImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
    twitterHandle: "@novastudio",
    canonicalUrl: "",
    ogTitle: "Nova Studio — High Impact Digital Design & Engineering",
    ogDescription: "Elite creative digital agency specializing in modern web design and interactive systems.",
    themeColor: "#7c3aed",
    robotsIndex: "index, follow",
  },
  features: {
    allowUserCustomBackground: true,
    allowUserTransparency: true,
    allowUserBlur: true,
    allowUserTheme: true,
    allowUserWallpapers: true,
    enablePublicBackground: true,
    enableVideoBackground: true,
    enableMotdBanner: true,
    enableGlassmorphism: true,
    defaultUserTheme: "dark",
    lastSavedTime: "2026-10-23T00:00:00.000Z",
  },
  socials: [
    { id: "1", platform: "github", label: "GitHub", url: "https://github.com", enabled: true },
    { id: "2", platform: "twitter", label: "X / Twitter", url: "https://twitter.com", enabled: true },
    { id: "3", platform: "dribbble", label: "Dribbble", url: "https://dribbble.com", enabled: true },
    { id: "4", platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com", enabled: true },
  ],
  updatedAt: "2026-10-23T00:00:00.000Z",
  updatedBy: "system",
};

// ==========================================
// Wallpaper Types (4K Wallpapers Integration)
// ==========================================
export interface WallpaperItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  fullUrl: string;
  resolution: string;
  sourceUrl?: string;
}

export interface WallpaperCategory {
  id: string;
  name: string;
  count: number;
}

export interface WallpaperResponse {
  success: boolean;
  wallpapers: WallpaperItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  categories: WallpaperCategory[];
}

// ==========================================
// Home Page Content Types
// ==========================================
export interface NavItem {
  id: string;
  label: string;
  href: string;
  isExternal?: boolean;
  order: number;
}

export interface AnnouncementBanner {
  enabled: boolean;
  badge: string;
  text: string;
  linkText: string;
  linkHref: string;
}

export interface HeroSection {
  badge: string;
  headline: string;
  subheadline: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  showClientCount: boolean;
  clientCountText: string;
  backgroundImageUrl: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  tags: string[];
  linkUrl: string;
  featured: boolean;
}

export interface ProjectsSection {
  title: string;
  subtitle: string;
  badge: string;
  items: ProjectItem[];
}

export interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight: string;
}

export interface ServicesSection {
  title: string;
  subtitle: string;
  badge: string;
  items: ServiceItem[];
}

export interface TestimonialItem {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  avatarUrl: string;
  rating: number;
}

export interface TestimonialsSection {
  title: string;
  subtitle: string;
  badge: string;
  items: TestimonialItem[];
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  description: string;
}

export interface StatsSection {
  title: string;
  subtitle: string;
  items: StatItem[];
}

export interface CtaSection {
  badge: string;
  headline: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export interface DiscordSection {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle: string;
  serverId: string;
  channelId: string;
  autoInviteLink?: string;
  showWidgetBot: boolean;
  showLiveRoster: boolean;
}

export interface DiscordMember {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  status: "online" | "idle" | "dnd" | "offline";
  avatar_url: string;
  game?: {
    name: string;
  };
}

export interface DiscordWidgetData {
  id: string;
  name: string;
  instant_invite: string | null;
  channels: { id: string; name: string; position: number }[];
  members: DiscordMember[];
  presence_count: number;
}

// ==========================================
// Lanyard Discord Live Presence Types
// ==========================================
export interface LanyardTimestamps {
  start?: number;
  end?: number;
}

export interface LanyardSpotify {
  track_id: string;
  timestamps: {
    start: number;
    end: number;
  };
  song: string;
  artist: string;
  album_art_url: string;
  album: string;
}

export interface LanyardDiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  public_flags?: number;
  bot?: boolean;
  avatar_decoration_data?: {
    asset: string;
    sku_id?: string;
    expires_at?: number | null;
  } | null;
  global_name?: string | null;
  display_name?: string | null;
}

export interface LanyardActivity {
  type: number; // 0: Playing, 1: Streaming, 2: Listening, 3: Watching, 4: Custom status, 5: Competing
  state?: string;
  name: string;
  id: string;
  details?: string;
  created_at?: number;
  timestamps?: LanyardTimestamps;
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  sync_id?: string;
  session_id?: string;
  party?: {
    id?: string;
  };
  flags?: number;
  emoji?: {
    name: string;
    id?: string;
    animated?: boolean;
  };
  application_id?: string;
}

export interface LanyardData {
  spotify: LanyardSpotify | null;
  listening_to_spotify: boolean;
  kv: Record<string, string>;
  discord_user: LanyardDiscordUser;
  discord_status: "online" | "idle" | "dnd" | "offline";
  activities: LanyardActivity[];
  active_on_discord_web: boolean;
  active_on_discord_desktop: boolean;
  active_on_discord_mobile: boolean;
}

export interface LanyardResponse {
  success: boolean;
  data?: LanyardData;
  error?: {
    message: string;
    code: string;
  };
}

export interface LanyardWsHello {
  op: 1;
  d: {
    heartbeat_interval: number;
  };
}

export interface LanyardWsEvent {
  op: 0;
  seq: number;
  t: "INIT_STATE" | "PRESENCE_UPDATE";
  d: LanyardData | Record<string, LanyardData>;
}

export interface CommandSection {
  enabled: boolean;
  badge: string;
  title: string;
  highlightText: string;
  description: string;
  command: string;
}

export interface SocialCardItem {
  id: string;
  platform: "youtube" | "instagram" | "github" | "discord" | "custom";
  title: string;
  subtitle: string;
  url: string;
  color: string;
  buttonText?: string;
}

export interface SocialCardsSection {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  items: SocialCardItem[];
}

export interface FooterSection {
  copyrightText: string;
  description: string;
  columns: {
    id: string;
    title: string;
    links: { label: string; href: string }[];
  }[];
}

export interface TeamMember {
  id: string;
  category: "Leadership" | "Development" | "Moderation & Support" | string;
  name: string;
  role: string;
  roleShort: string;
  desc: string;
  status: "online" | "idle" | "dnd" | "offline";
  game?: string;
  color: string;
  avatar: string;
  discordId?: string;
}

export interface TeamPageData {
  title: string;
  badge: string;
  subtitle: string;
  stats: {
    label: string;
    value: string;
    description: string;
  }[];
  categories: string[];
  members: TeamMember[];
}

export const TeamMemberSchema = z.object({
  id: z.string(),
  category: z.string(),
  name: z.string(),
  role: z.string(),
  roleShort: z.string(),
  desc: z.string(),
  status: z.enum(["online", "idle", "dnd", "offline"]).default("online"),
  game: z.string().optional(),
  color: z.string().default("blue"),
  avatar: z.string(),
  discordId: z.string().optional(),
});

export const TeamPageDataSchema = z.object({
  title: z.string(),
  badge: z.string(),
  subtitle: z.string(),
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      description: z.string(),
    })
  ),
  categories: z.array(z.string()),
  members: z.array(TeamMemberSchema),
});

// ==========================================
// Tutorials & YouTube Types
// ==========================================
export interface TutorialItem {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount?: number;
  publishedAt: string;
  featured: boolean;
  sortOrder: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TutorialSettings {
  channelName: string;
  channelId: string;
  apiKey?: string;
  title: string;
  badge: string;
  subtitle: string;
  subscriberCount?: string;
  videoCount?: string;
  viewCount?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  customUrl?: string;
  autoSync?: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface TutorialPageData {
  settings: TutorialSettings;
  categories: string[];
  tutorials: TutorialItem[];
  totalCount: number;
}

export interface YouTubeDetectResult {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  authorName?: string;
}

export interface YouTubeChannelDetectResult {
  channelId: string;
  channelName: string;
  customUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
  viewCount?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  description?: string;
}

export const TutorialItemSchema = z.object({
  id: z.string(),
  youtubeVideoId: z.string().min(1, "YouTube Video ID or URL is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  category: z.string().min(1, "Category is required"),
  thumbnailUrl: z.string().default(""),
  duration: z.string().default("00:00"),
  viewCount: z.number().default(0),
  likeCount: z.number().default(0),
  commentCount: z.number().optional().default(0),
  publishedAt: z.string().default(new Date().toISOString()),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const TutorialSettingsSchema = z.object({
  channelName: z.string().default("Nova Studio"),
  channelId: z.string().default(""),
  apiKey: z.string().optional().default(""),
  title: z.string().default("Master Modern Development"),
  badge: z.string().default("OFFICIAL VIDEO GUIDES & TUTORIALS"),
  subtitle: z.string().default("Step-by-step masterclasses, discord bot guides, cloud deployment, and system architecture walkthroughs."),
  subscriberCount: z.string().optional().default("0"),
  videoCount: z.string().optional().default("0"),
  viewCount: z.string().optional().default("0"),
  avatarUrl: z.string().optional().default(""),
  bannerUrl: z.string().optional().default(""),
  customUrl: z.string().optional().default(""),
  autoSync: z.boolean().optional().default(false),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const TutorialPageDataSchema = z.object({
  settings: TutorialSettingsSchema,
  categories: z.array(z.string()),
  tutorials: z.array(TutorialItemSchema),
  totalCount: z.number(),
});

// ==========================================
// Command Library Types
// ==========================================
export interface CommandItem {
  id: string;
  category: string;
  title: string;
  command: string;
  description: string;
  tags?: string[];
  sortOrder: number;
  favorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommandSettings {
  title: string;
  badge: string;
  subtitle: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CommandPageData {
  settings: CommandSettings;
  categories: string[];
  commands: CommandItem[];
  totalCount: number;
}

export const CommandItemSchema = z.object({
  id: z.string(),
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  command: z.string().min(1, "Command code is required"),
  description: z.string().default(""),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().default(0),
  favorite: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CommandSettingsSchema = z.object({
  title: z.string().default("Command Library"),
  badge: z.string().default("SYSTEM & DEVELOPER COMMANDS"),
  subtitle: z.string().default("Access over 190+ system, VPS, Docker, Linux, and network commands with 1-click copy."),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});

export const CommandPageDataSchema = z.object({
  settings: CommandSettingsSchema,
  categories: z.array(z.string()),
  commands: z.array(CommandItemSchema),
  totalCount: z.number(),
});

export interface HomePageContent {
  version: number;
  publishedAt?: string;
  updatedAt: string;
  announcement: AnnouncementBanner;
  navigation: NavItem[];
  hero: HeroSection;
  commandSection?: CommandSection;
  socialCards?: SocialCardsSection;
  stats: StatsSection;
  services: ServicesSection;
  projects: ProjectsSection;
  testimonials: TestimonialsSection;
  discord?: DiscordSection;
  cta: CtaSection;
  footer: FooterSection;
}

export const HomePageContentSchema = z.object({
  version: z.number().default(1),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  announcement: z.object({
    enabled: z.boolean(),
    badge: z.string(),
    text: z.string(),
    linkText: z.string(),
    linkHref: z.string(),
  }),
  navigation: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      href: z.string(),
      isExternal: z.boolean().optional(),
      order: z.number(),
    })
  ),
  hero: z.object({
    badge: z.string(),
    headline: z.string(),
    subheadline: z.string(),
    primaryCtaText: z.string(),
    primaryCtaHref: z.string(),
    secondaryCtaText: z.string(),
    secondaryCtaHref: z.string(),
    showClientCount: z.boolean(),
    clientCountText: z.string(),
    backgroundImageUrl: z.string(),
  }),
  commandSection: z
    .object({
      enabled: z.boolean().default(true),
      badge: z.string().default("AUTOMATED SCRIPT"),
      title: z.string().default("ALL IN ONE"),
      highlightText: z.string().default("CMD"),
      description: z.string().default("Execute the master script to install all dependencies instantly."),
      command: z.string().default("bash <(curl -s https://ptero.nobitahost.in)"),
    })
    .optional(),
  socialCards: z
    .object({
      enabled: z.boolean().default(true),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      items: z.array(
        z.object({
          id: z.string(),
          platform: z.enum(["youtube", "instagram", "github", "discord", "custom"]),
          title: z.string(),
          subtitle: z.string(),
          url: z.string(),
          color: z.string(),
          buttonText: z.string().optional(),
        })
      ),
    })
    .optional(),
  stats: z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(
      z.object({
        id: z.string(),
        value: z.string(),
        label: z.string(),
        description: z.string(),
      })
    ),
  }),
  services: z.object({
    title: z.string(),
    subtitle: z.string(),
    badge: z.string(),
    items: z.array(
      z.object({
        id: z.string(),
        icon: z.string(),
        title: z.string(),
        description: z.string(),
        highlight: z.string(),
      })
    ),
  }),
  projects: z.object({
    title: z.string(),
    subtitle: z.string(),
    badge: z.string(),
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.string(),
        description: z.string(),
        imageUrl: z.string(),
        tags: z.array(z.string()),
        linkUrl: z.string(),
        featured: z.boolean(),
      })
    ),
  }),
  testimonials: z.object({
    title: z.string(),
    subtitle: z.string(),
    badge: z.string(),
    items: z.array(
      z.object({
        id: z.string(),
        quote: z.string(),
        authorName: z.string(),
        authorRole: z.string(),
        authorCompany: z.string(),
        avatarUrl: z.string(),
        rating: z.number(),
      })
    ),
  }),
  discord: z
    .object({
      enabled: z.boolean().default(true),
      badge: z.string().default("LIVE COMMUNITY & CHAT"),
      title: z.string().default("Connect to Nova Studio Live"),
      subtitle: z.string().default("Join our official Discord server, chat in real-time, and collaborate with creators."),
      serverId: z.string().default("1540761150797389915"),
      channelId: z.string().default("1558058854523215985"),
      autoInviteLink: z.string().optional(),
      showWidgetBot: z.boolean().default(true),
      showLiveRoster: z.boolean().default(true),
    })
    .optional(),
  cta: z.object({
    badge: z.string(),
    headline: z.string(),
    description: z.string(),
    buttonText: z.string(),
    buttonHref: z.string(),
    secondaryButtonText: z.string().optional(),
    secondaryButtonHref: z.string().optional(),
  }),
  footer: z.object({
    copyrightText: z.string(),
    description: z.string(),
    columns: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        links: z.array(z.object({ label: z.string(), href: z.string() })),
      })
    ),
  }),
});

// ==========================================
// Database & System Health Types
// ==========================================
export interface DatabaseInfo {
  name: string;
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  tableCount: number;
  tables: string[];
  status: "healthy" | "degraded" | "error";
  lastModified: string;
  integrityOk: boolean;
  version: number;
}

export interface DatabaseStatusResponse {
  databases: DatabaseInfo[];
  totalSizeBytes: number;
  totalSizeFormatted: string;
  allHealthy: boolean;
  walEnabled: boolean;
  storagePath: string;
  timestamp: string;
}

export interface BackupItem {
  id: string;
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  includedDbs: string[];
  checksum: string;
}

// ==========================================
// Activity & Audit Types
// ==========================================
export interface ActivityLog {
  id: string;
  action: string;
  category: "auth" | "content" | "settings" | "database" | "api" | "system";
  details: string;
  ipAddress?: string;
  userId?: string;
  username?: string;
  status: "success" | "warning" | "error";
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalPageViews: number;
  todayPageViews: number;
  publishCount: number;
  lastPublishedAt?: string;
  activeSessions: number;
  dbIntegrityScore: number;
  recentViewsSeries: { date: string; views: number; uniqueVisitors: number }[];
  contentSectionDistribution: { name: string; count: number }[];
}

// ==========================================
// WebSocket Event Types
// ==========================================
export type WsEventType =
  | "connected"
  | "ping"
  | "pong"
  | "content_published"
  | "draft_saved"
  | "settings_updated"
  | "team_updated"
  | "tutorial_updated"
  | "command_updated"
  | "database_backed_up"
  | "database_restored"
  | "activity_logged"
  | "health_status"
  | "bot_message_published"
  | "bot_interaction_received"
  | "bot_settings_updated"
  | "bot_template_updated";

export interface WsMessage<T = any> {
  type: WsEventType;
  payload: T;
  timestamp: string;
}

// ==========================================
// Discord Components V2 System & Bot Types
// ==========================================

export enum DiscordComponentType {
  ACTION_ROW = 1,
  BUTTON = 2,
  STRING_SELECT = 3,
  TEXT_INPUT = 4,
  USER_SELECT = 5,
  ROLE_SELECT = 6,
  MENTIONABLE_SELECT = 7,
  CHANNEL_SELECT = 8,
  SECTION = 9,
  TEXT_DISPLAY = 10,
  THUMBNAIL = 11,
  MEDIA_GALLERY = 12,
  FILE = 13,
  SEPARATOR = 14,
  CONTAINER = 15,
}

export enum DiscordButtonStyle {
  PRIMARY = 1,    // Blurple / Indigo
  SECONDARY = 2,  // Neutral / Grey
  SUCCESS = 3,    // Green
  DANGER = 4,     // Red
  LINK = 5,       // Grey with external link icon
  PREMIUM = 6,
}

export enum DiscordSeparatorSpacing {
  SMALL = 1,
  MEDIUM = 2,
  LARGE = 3,
}

export const DISCORD_MESSAGE_FLAGS = {
  CROSSPOSTED: 1 << 0,
  IS_CROSSPOST: 1 << 1,
  SUPPRESS_EMBEDS: 1 << 2,
  SOURCE_MESSAGE_DELETED: 1 << 3,
  URGENT: 1 << 4,
  HAS_THREAD: 1 << 5,
  EPHEMERAL: 1 << 6,
  LOADING: 1 << 7,
  FAILED_TO_MENTION_SOME_ROLES_IN_THREAD: 1 << 8,
  SUPPRESS_NOTIFICATIONS: 1 << 12,
  IS_VOICE_MESSAGE: 1 << 13,
  IS_COMPONENTS_V2: 1 << 15, // 32768
} as const;

export interface DiscordMediaItem {
  url: string;
  description?: string;
  spoiler?: boolean;
}

export interface DiscordTextDisplayComponent {
  id?: string;
  type: DiscordComponentType.TEXT_DISPLAY | 10;
  content: string;
}

export interface DiscordThumbnailComponent {
  id?: string;
  type: DiscordComponentType.THUMBNAIL | 11;
  media: DiscordMediaItem;
}

export interface DiscordMediaGalleryComponent {
  id?: string;
  type: DiscordComponentType.MEDIA_GALLERY | 12;
  items: { media: DiscordMediaItem }[];
}

export interface DiscordFileComponent {
  id?: string;
  type: DiscordComponentType.FILE | 13;
  file: {
    url: string;
    filename?: string;
    size?: number;
    mime_type?: string;
  };
}

export interface DiscordSeparatorComponent {
  id?: string;
  type: DiscordComponentType.SEPARATOR | 14;
  divider?: boolean;
  spacing?: DiscordSeparatorSpacing | number;
}

export interface DiscordButtonComponent {
  id?: string;
  type: DiscordComponentType.BUTTON | 2;
  style: DiscordButtonStyle | number;
  label?: string;
  emoji?: {
    id?: string;
    name: string;
    animated?: boolean;
  };
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export interface DiscordSelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: {
    id?: string;
    name: string;
    animated?: boolean;
  };
  default?: boolean;
}

export interface DiscordSelectComponent {
  id?: string;
  type:
    | DiscordComponentType.STRING_SELECT
    | DiscordComponentType.USER_SELECT
    | DiscordComponentType.ROLE_SELECT
    | DiscordComponentType.MENTIONABLE_SELECT
    | DiscordComponentType.CHANNEL_SELECT
    | 3
    | 5
    | 6
    | 7
    | 8;
  custom_id: string;
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  disabled?: boolean;
  options?: DiscordSelectOption[];
  channel_types?: number[];
}

export interface DiscordTextInputComponent {
  id?: string;
  type: DiscordComponentType.TEXT_INPUT | 4;
  custom_id: string;
  style: 1 | 2; // 1: Short, 2: Paragraph
  label: string;
  min_length?: number;
  max_length?: number;
  required?: boolean;
  value?: string;
  placeholder?: string;
}

export interface DiscordSectionComponent {
  id?: string;
  type: DiscordComponentType.SECTION | 9;
  components: DiscordTextDisplayComponent[];
  accessory?: DiscordButtonComponent | DiscordThumbnailComponent;
}

export interface DiscordActionRowComponent {
  id?: string;
  type: DiscordComponentType.ACTION_ROW | 1;
  components: (DiscordButtonComponent | DiscordSelectComponent)[];
}

export interface DiscordContainerComponent {
  id?: string;
  type: DiscordComponentType.CONTAINER | 15;
  accent_color?: number; // Integer color e.g. 0x7c3aed (8141549)
  spoiler?: boolean;
  components: (
    | DiscordSectionComponent
    | DiscordTextDisplayComponent
    | DiscordActionRowComponent
    | DiscordSeparatorComponent
    | DiscordMediaGalleryComponent
    | DiscordFileComponent
  )[];
}

export type DiscordTopLevelComponent =
  | DiscordContainerComponent
  | DiscordSectionComponent
  | DiscordTextDisplayComponent
  | DiscordSeparatorComponent
  | DiscordMediaGalleryComponent
  | DiscordFileComponent
  | DiscordActionRowComponent;

export type AnyDiscordComponent =
  | DiscordTopLevelComponent
  | DiscordButtonComponent
  | DiscordSelectComponent
  | DiscordThumbnailComponent
  | DiscordTextInputComponent;

export interface DiscordMessagePayload {
  content?: string;
  flags?: number; // IS_COMPONENTS_V2 (32768)
  components?: DiscordTopLevelComponent[];
  allowed_mentions?: {
    parse?: ("roles" | "users" | "everyone")[];
  };
}

// ==========================================
// Bot Settings Interfaces
// ==========================================

export interface BotBrandingSettings {
  botName: string;
  avatarUrl: string;
  bannerUrl: string;
  tagline: string;
  description: string;
  defaultAccentColor: string; // Hex string e.g. "#7c3aed"
  footerText: string;
  status: "online" | "idle" | "dnd" | "invisible";
  activityType: "Playing" | "Streaming" | "Listening" | "Watching" | "Competing" | "Custom";
  activityText: string;
  showWebsiteBadge: boolean;
  syncDiscordProfile: boolean;
}

export interface BotServerSettings {
  botTokenConfigured: boolean;
  selectedGuildId: string;
  announcementChannelId: string;
  logChannelId: string;
  welcomeChannelId: string;
  welcomeEnabled: boolean;
  welcomeTemplateId?: string;
  goodbyeEnabled: boolean;
  goodbyeChannelId: string;
  allowedRoleIds: string[];
  commandPrefix: string;
}

export interface BotSeoSettings {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  themeColor: string;
  robotsIndex: string;
}

export interface BotFeatureSettings {
  enableComponentsV2Builder: boolean;
  enableMessageTemplates: boolean;
  enableEmbedMigration: boolean;
  enableInteractiveButtons: boolean;
  enableSelectMenus: boolean;
  enableModals: boolean;
  allowGuildAdminsOnly: boolean;
  enableLiveInteractionLogger: boolean;
  enableAutoWelcomeMessages: boolean;
  defaultTemplateId: string;
}

export interface BotSettings {
  branding: BotBrandingSettings;
  server: BotServerSettings;
  seo: BotSeoSettings;
  features: BotFeatureSettings;
  updatedAt: string;
  updatedBy: string;
}

// ==========================================
// Guild & Channel Interfaces
// ==========================================

export interface DiscordGuildInfo {
  id: string;
  name: string;
  icon: string | null;
  iconUrl?: string;
  owner: boolean;
  permissions: string;
  features: string[];
  approximate_member_count?: number;
  approximate_presence_count?: number;
  botPresent?: boolean;
}

export interface DiscordChannelInfo {
  id: string;
  name: string;
  type: number; // 0: GUILD_TEXT, 2: GUILD_VOICE, 4: GUILD_CATEGORY, 5: GUILD_ANNOUNCEMENT
  position: number;
  parent_id?: string | null;
  topic?: string | null;
  botCanSend?: boolean;
}

export interface GuildConfig {
  guildId: string;
  name: string;
  iconUrl?: string;
  defaultChannelId?: string;
  logChannelId?: string;
  welcomeChannelId?: string;
  welcomeMessage?: string;
  welcomeTemplateId?: string;
  allowedRoles?: string[];
  updatedAt: string;
}

// ==========================================
// Template, Publish & Interaction Interfaces
// ==========================================

export interface ComponentsV2Template {
  id: string;
  name: string;
  description: string;
  category: "announcements" | "rules" | "welcome" | "verification" | "status" | "roles" | "custom";
  isPreset: boolean;
  payload: DiscordMessagePayload;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface PublishedBotMessage {
  id: string;
  guildId: string;
  guildName?: string;
  channelId: string;
  channelName?: string;
  messageId: string;
  templateId?: string;
  templateName?: string;
  payload: DiscordMessagePayload;
  status: "sent" | "edited" | "deleted" | "failed";
  error?: string;
  publishedBy: string;
  publishedAt: string;
  updatedAt?: string;
}

export interface BotInteractionLog {
  id: string;
  interactionId: string;
  type: "button_click" | "select_option" | "modal_submit" | "slash_command";
  userId: string;
  username: string;
  avatarUrl?: string;
  guildId?: string;
  guildName?: string;
  channelId?: string;
  channelName?: string;
  customId: string;
  selectedValues?: string[];
  modalInputs?: Record<string, string>;
  commandName?: string;
  status: "success" | "warning" | "error";
  latencyMs: number;
  createdAt: string;
}

export interface BotSlashCommand {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  options?: {
    name: string;
    description: string;
    type: number;
    required?: boolean;
  }[];
  defaultMemberPermissions?: string;
  templateIdToTrigger?: string;
  updatedAt: string;
}

export interface BotDashboardSummary {
  botConnected: boolean;
  botUser: {
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string;
    tag: string;
  } | null;
  guildsCount: number;
  totalMembers: number;
  templatesCount: number;
  publishedMessagesCount: number;
  recentInteractionsCount: number;
  botStatus: "online" | "idle" | "dnd" | "invisible";
  activity: string;
  latencyMs: number;
  recentPublished: PublishedBotMessage[];
  recentInteractions: BotInteractionLog[];
}

// ==========================================
// Default Bot Settings & Presets
// ==========================================

export const DEFAULT_BOT_SETTINGS: BotSettings = {
  branding: {
    botName: "Nova Assistant",
    avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256",
    bannerUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200",
    tagline: "Elite Discord System Bot & Interactive Components V2 Agent",
    description: "Modular Discord bot system delivering ultra-rich interactive messages, automated workflows, and high-performance server tooling.",
    defaultAccentColor: "#7c3aed",
    footerText: "Powered by Nova Studio • Components V2 Engine",
    status: "online",
    activityType: "Playing",
    activityText: "with Discord Components V2",
    showWebsiteBadge: true,
    syncDiscordProfile: false,
  },
  server: {
    botTokenConfigured: false,
    selectedGuildId: "1540761150797389915",
    announcementChannelId: "1558058866883821674",
    logChannelId: "1558058854523215985",
    welcomeChannelId: "1558058866883821674",
    welcomeEnabled: true,
    welcomeTemplateId: "tpl-welcome-verify",
    goodbyeEnabled: false,
    goodbyeChannelId: "",
    allowedRoleIds: ["1540761150797389916"],
    commandPrefix: "!",
  },
  seo: {
    metaTitle: "Nova Bot — Next-Gen Discord Components V2 Studio",
    metaDescription: "Visual drag-and-drop Discord Components V2 builder. Create rich containers, sections, galleries, and interactive buttons for Discord.",
    canonicalUrl: "",
    ogTitle: "Nova Bot — Next-Gen Discord Components V2 Studio",
    ogDescription: "Visual Discord Components V2 builder with real-time live preview and 1-click publishing.",
    ogImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
    themeColor: "#7c3aed",
    robotsIndex: "index, follow",
  },
  features: {
    enableComponentsV2Builder: true,
    enableMessageTemplates: true,
    enableEmbedMigration: true,
    enableInteractiveButtons: true,
    enableSelectMenus: true,
    enableModals: true,
    allowGuildAdminsOnly: true,
    enableLiveInteractionLogger: true,
    enableAutoWelcomeMessages: true,
    defaultTemplateId: "tpl-welcome-verify",
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
};

export const COMPONENTS_V2_PRESET_TEMPLATES: ComponentsV2Template[] = [
  {
    id: "tpl-welcome-verify",
    name: "Server Welcome & Verification Gate",
    description: "Rich welcome banner with guidelines, rules agreement, and 1-click verification button.",
    category: "welcome",
    isPreset: true,
    tags: ["welcome", "verification", "onboarding"],
    createdAt: "2026-10-23T00:00:00.000Z",
    updatedAt: "2026-10-23T00:00:00.000Z",
    payload: {
      flags: DISCORD_MESSAGE_FLAGS.IS_COMPONENTS_V2,
      components: [
        {
          type: DiscordComponentType.CONTAINER,
          accent_color: 0x7c3aed,
          components: [
            {
              type: DiscordComponentType.SECTION,
              components: [
                {
                  type: DiscordComponentType.TEXT_DISPLAY,
                  content: "### 🚀 Welcome to Nova Studio Discord!\nWe build elite open-source developer tools, cloud infrastructure, and immersive digital platforms.",
                },
              ],
              accessory: {
                type: DiscordComponentType.THUMBNAIL,
                media: {
                  url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300",
                  description: "Nova Studio Logo",
                },
              },
            },
            {
              type: DiscordComponentType.SEPARATOR,
              divider: true,
              spacing: DiscordSeparatorSpacing.SMALL,
            },
            {
              type: DiscordComponentType.TEXT_DISPLAY,
              content: "**Verification Steps:**\n1. Review the community guidelines in <#rules>\n2. Respect moderators and maintain developer etiquette\n3. Click **Verify & Enter** below to unlock all channels!",
            },
            {
              type: DiscordComponentType.ACTION_ROW,
              components: [
                {
                  type: DiscordComponentType.BUTTON,
                  style: DiscordButtonStyle.SUCCESS,
                  label: "Verify & Enter",
                  custom_id: "btn_verify_member",
                  emoji: { name: "✅" },
                },
                {
                  type: DiscordComponentType.BUTTON,
                  style: DiscordButtonStyle.SECONDARY,
                  label: "Read Rules",
                  custom_id: "btn_read_rules",
                  emoji: { name: "📜" },
                },
                {
                  type: DiscordComponentType.BUTTON,
                  style: DiscordButtonStyle.LINK,
                  label: "Official Website",
                  url: "https://novastudio.dev",
                  emoji: { name: "🌐" },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "tpl-server-status",
    name: "System Status & Service Health",
    description: "Live cluster health monitor with status indicators, database checks, and refresh action.",
    category: "status",
    isPreset: true,
    tags: ["status", "system", "health", "uptime"],
    createdAt: "2026-10-23T00:00:00.000Z",
    updatedAt: "2026-10-23T00:00:00.000Z",
    payload: {
      flags: DISCORD_MESSAGE_FLAGS.IS_COMPONENTS_V2,
      components: [
        {
          type: DiscordComponentType.CONTAINER,
          accent_color: 0x10b981,
          components: [
            {
              type: DiscordComponentType.SECTION,
              components: [
                {
                  type: DiscordComponentType.TEXT_DISPLAY,
                  content: "### 🟢 All Systems Operational — Nova Infrastructure\nReal-time monitoring across API microservices, SQLite WAL databases, and Next.js frontend edge.",
                },
              ],
            },
            {
              type: DiscordComponentType.SEPARATOR,
              divider: true,
              spacing: DiscordSeparatorSpacing.SMALL,
            },
            {
              type: DiscordComponentType.TEXT_DISPLAY,
              content: "```yaml\nGateway Latency: 24ms\nDatabase Cluster: Healthy (9 / 9 Online)\nMemory Allocated: 236 MB / 1024 MB\nUptime: 99.98%\n```",
            },
            {
              type: DiscordComponentType.ACTION_ROW,
              components: [
                {
                  type: DiscordComponentType.BUTTON,
                  style: DiscordButtonStyle.PRIMARY,
                  label: "Refresh Status",
                  custom_id: "btn_refresh_status",
                  emoji: { name: "🔄" },
                },
                {
                  type: DiscordComponentType.BUTTON,
                  style: DiscordButtonStyle.LINK,
                  label: "System Metrics",
                  url: "https://status.novastudio.dev",
                  emoji: { name: "📊" },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "tpl-role-selector",
    name: "Notification & Role Assignment Menu",
    description: "Interactive role picker allowing members to select their developer roles and notification preferences.",
    category: "roles",
    isPreset: true,
    tags: ["roles", "selection", "notifications"],
    createdAt: "2026-10-23T00:00:00.000Z",
    updatedAt: "2026-10-23T00:00:00.000Z",
    payload: {
      flags: DISCORD_MESSAGE_FLAGS.IS_COMPONENTS_V2,
      components: [
        {
          type: DiscordComponentType.CONTAINER,
          accent_color: 0x06b6d4,
          components: [
            {
              type: DiscordComponentType.TEXT_DISPLAY,
              content: "### 🎭 Choose Your Developer Roles & Alerts\nSelect the stacks you develop in to get pinged for releases, beta access, and technical discussions.",
            },
            {
              type: DiscordComponentType.SEPARATOR,
              divider: false,
              spacing: DiscordSeparatorSpacing.SMALL,
            },
            {
              type: DiscordComponentType.ACTION_ROW,
              components: [
                {
                  type: DiscordComponentType.STRING_SELECT,
                  custom_id: "select_dev_roles",
                  placeholder: "Choose your primary tech stack roles...",
                  min_values: 1,
                  max_values: 4,
                  options: [
                    {
                      label: "Full Stack Engineer",
                      value: "role_fullstack",
                      description: "React, Next.js, Node.js & SQLite systems",
                      emoji: { name: "⚡" },
                    },
                    {
                      label: "Discord Bot Architect",
                      value: "role_bot_dev",
                      description: "Discord API, Components V2 & Gateway WebSockets",
                      emoji: { name: "🤖" },
                    },
                    {
                      label: "DevOps & Cloud",
                      value: "role_devops",
                      description: "Docker, Linux VPS, Pterodactyl & CI/CD",
                      emoji: { name: "☁️" },
                    },
                    {
                      label: "UI/UX Designer",
                      value: "role_designer",
                      description: "Design systems, Glassmorphism & KaTeX typography",
                      emoji: { name: "🎨" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "tpl-product-showcase",
    name: "Media Showcase & Feature Release",
    description: "Media gallery component with rich changelog sections and feedback buttons.",
    category: "announcements",
    isPreset: true,
    tags: ["showcase", "gallery", "media", "release"],
    createdAt: "2026-10-23T00:00:00.000Z",
    updatedAt: "2026-10-23T00:00:00.000Z",
    payload: {
      flags: DISCORD_MESSAGE_FLAGS.IS_COMPONENTS_V2,
      components: [
        {
          type: DiscordComponentType.CONTAINER,
          accent_color: 0xf43f5e,
          components: [
            {
              type: DiscordComponentType.TEXT_DISPLAY,
              content: "### 💎 Major Update: Nova Studio 2.0 Released!\nWe're thrilled to introduce Discord Components V2 visual building, live 4K wallpapers, and instant message deployment.",
            },
            {
              type: DiscordComponentType.MEDIA_GALLERY,
              items: [
                {
                  media: {
                    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800",
                    description: "Nova Studio Glassmorphism Dashboard",
                  },
                },
                {
                  media: {
                    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800",
                    description: "Discord Components V2 Live Preview",
                  },
                },
              ],
            },
            {
              type: DiscordComponentType.SEPARATOR,
              divider: true,
              spacing: DiscordSeparatorSpacing.SMALL,
            },
            {
              type: DiscordComponentType.ACTION_ROW,
              components: [
                {
                  type: DiscordComponentType.BUTTON,
                  style: DiscordButtonStyle.PRIMARY,
                  label: "Read Changelog",
                  custom_id: "btn_view_changelog",
                  emoji: { name: "📖" },
                },
                {
                  type: DiscordComponentType.BUTTON,
                  style: DiscordButtonStyle.SUCCESS,
                  label: "Claim Contributor Badge",
                  custom_id: "btn_claim_badge",
                  emoji: { name: "🏆" },
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
