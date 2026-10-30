import { z } from "zod";

// ==========================================
// User & Auth Types
// ==========================================
export interface User {
  id: string;
  username: string;
  email?: string;
  nameFirst?: string;
  nameLast?: string;
  avatarUrl?: string;
  role: "admin" | "editor" | "viewer";
  useTotp?: boolean;
  isBanned?: boolean;
  isSuspended?: boolean;
  suspendedUntil?: string;
  country?: string;
  language?: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export const LoginRequestSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Alphanumeric characters only"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  nameFirst: z.string().optional(),
  nameLast: z.string().optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const ForgotPasswordSchema = z.object({
  emailOrUsername: z.string().min(1, "Email or username is required"),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  requireTwoFactor?: boolean;
  userId?: string;
  resetUrl?: string;
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
  backgroundType?: "color" | "image" | "video";
  backgroundUrl?: string;
  backgroundOpacity?: number;
  panelTransparency?: number;
  panelBlur?: number;
  favoriteWallpapers?: string[];
  panelName?: string;
  panelLogoUrl?: string;
  panelFaviconName?: string;
  panelFaviconUrl?: string;
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImageUrl: string;
  twitterHandle: string;
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
  socials: SocialLink[];
  updatedAt: string;
  updatedBy: string;
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
  backgroundType: z.enum(["color", "image", "video"]).default("image").optional(),
  backgroundUrl: z.string().default("").optional(),
  backgroundOpacity: z.number().min(0).max(100).default(100).optional(),
  panelTransparency: z.number().min(0).max(100).default(35).optional(),
  panelBlur: z.number().min(0).max(40).default(16).optional(),
  favoriteWallpapers: z.array(z.string()).default([]).optional(),
  panelName: z.string().default("NOVA STUDIO").optional(),
  panelLogoUrl: z.string().default("").optional(),
  panelFaviconName: z.string().default("Nova Panel").optional(),
  panelFaviconUrl: z.string().default("").optional(),
});

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

export const SeoSettingsSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  keywords: z.array(z.string()),
  ogImageUrl: z.string(),
  twitterHandle: z.string(),
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
  socials: z.array(SocialLinkSchema),
});

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
  | "legal_page_updated"
  | "env_updated"
  | "github_synced";

export interface WsMessage<T = any> {
  type: WsEventType;
  payload: T;
  timestamp: string;
}

// ==========================================
// Legal Pages & Compliance Types
// ==========================================
export type LegalPageStatus = "published" | "draft";

export interface LegalPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: LegalPageStatus;
  seo_title?: string;
  seo_description?: string;
  created_at: string;
  updated_at: string;
}

export const LegalPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and dashes"),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["published", "draft"]).default("published"),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});
export type CreateLegalPageRequest = z.infer<typeof LegalPageSchema>;

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  created_at: string;
}

export const ContactMessageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Valid email is required"),
  subject: z.string().optional(),
  message: z.string().min(5, "Message must be at least 5 characters"),
});
export type CreateContactMessageRequest = z.infer<typeof ContactMessageSchema>;

// ==========================================
// GitHub Auto Detect & Repository Management Types
// ==========================================
export interface GitHubConfig {
  username: string;
  connected: boolean;
  tokenPreview?: string;
  scopes?: string[];
  avatarUrl?: string;
  autoSync: boolean;
  syncIntervalMins: number;
  lastSyncedAt?: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl?: string;
  };
  description?: string;
  htmlUrl: string;
  isPrivate: boolean;
  defaultBranch: string;
  language?: string;
  languages?: Record<string, number>;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  topics: string[];
  license?: string;
  createdAt: string;
  updatedAt: string;
  pushedAt?: string;
  readme?: string;
  branches?: string[];
  tags?: string[];
  recentCommits?: Array<{
    sha: string;
    message: string;
    author: string;
    date: string;
  }>;
  releases?: Array<{
    id: string;
    name: string;
    tagName: string;
    publishedAt: string;
    body: string;
  }>;
  syncedAt: string;
}

export interface GitHubDashboardStats {
  totalRepos: number;
  publicRepos: number;
  privateRepos: number;
  totalStars: number;
  totalForks: number;
  recentlyUpdated?: {
    name: string;
    updatedAt: string;
  };
}


