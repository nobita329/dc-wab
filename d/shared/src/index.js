"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomePageContentSchema = exports.SiteSettingsSchema = exports.SocialLinkSchema = exports.SeoSettingsSchema = exports.BrandingSettingsSchema = exports.LoginRequestSchema = void 0;
const zod_1 = require("zod");
exports.LoginRequestSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username is required"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.BrandingSettingsSchema = zod_1.z.object({
    siteTitle: zod_1.z.string().min(1),
    siteTagline: zod_1.z.string(),
    logoText: zod_1.z.string().min(1),
    logoImageUrl: zod_1.z.string(),
    faviconUrl: zod_1.z.string(),
    primaryColor: zod_1.z.string(),
    accentColor: zod_1.z.string(),
    fontFamily: zod_1.z.string(),
    borderRadius: zod_1.z.string(),
    defaultTheme: zod_1.z.enum(["dark", "light", "system"]),
});
exports.SeoSettingsSchema = zod_1.z.object({
    metaTitle: zod_1.z.string(),
    metaDescription: zod_1.z.string(),
    keywords: zod_1.z.array(zod_1.z.string()),
    ogImageUrl: zod_1.z.string(),
    twitterHandle: zod_1.z.string(),
});
exports.SocialLinkSchema = zod_1.z.object({
    id: zod_1.z.string(),
    platform: zod_1.z.enum(["github", "twitter", "linkedin", "instagram", "youtube", "dribbble", "other"]),
    label: zod_1.z.string(),
    url: zod_1.z.string(),
    enabled: zod_1.z.boolean(),
});
exports.SiteSettingsSchema = zod_1.z.object({
    branding: exports.BrandingSettingsSchema,
    seo: exports.SeoSettingsSchema,
    socials: zod_1.z.array(exports.SocialLinkSchema),
});
exports.HomePageContentSchema = zod_1.z.object({
    version: zod_1.z.number().default(1),
    announcement: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        badge: zod_1.z.string(),
        text: zod_1.z.string(),
        linkText: zod_1.z.string(),
        linkHref: zod_1.z.string(),
    }),
    navigation: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        label: zod_1.z.string(),
        href: zod_1.z.string(),
        isExternal: zod_1.z.boolean().optional(),
        order: zod_1.z.number(),
    })),
    hero: zod_1.z.object({
        badge: zod_1.z.string(),
        headline: zod_1.z.string(),
        subheadline: zod_1.z.string(),
        primaryCtaText: zod_1.z.string(),
        primaryCtaHref: zod_1.z.string(),
        secondaryCtaText: zod_1.z.string(),
        secondaryCtaHref: zod_1.z.string(),
        showClientCount: zod_1.z.boolean(),
        clientCountText: zod_1.z.string(),
        backgroundImageUrl: zod_1.z.string(),
    }),
    stats: zod_1.z.object({
        title: zod_1.z.string(),
        subtitle: zod_1.z.string(),
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            value: zod_1.z.string(),
            label: zod_1.z.string(),
            description: zod_1.z.string(),
        })),
    }),
    services: zod_1.z.object({
        title: zod_1.z.string(),
        subtitle: zod_1.z.string(),
        badge: zod_1.z.string(),
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            icon: zod_1.z.string(),
            title: zod_1.z.string(),
            description: zod_1.z.string(),
            highlight: zod_1.z.string(),
        })),
    }),
    projects: zod_1.z.object({
        title: zod_1.z.string(),
        subtitle: zod_1.z.string(),
        badge: zod_1.z.string(),
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            title: zod_1.z.string(),
            category: zod_1.z.string(),
            description: zod_1.z.string(),
            imageUrl: zod_1.z.string(),
            tags: zod_1.z.array(zod_1.z.string()),
            linkUrl: zod_1.z.string(),
            featured: zod_1.z.boolean(),
        })),
    }),
    testimonials: zod_1.z.object({
        title: zod_1.z.string(),
        subtitle: zod_1.z.string(),
        badge: zod_1.z.string(),
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            quote: zod_1.z.string(),
            authorName: zod_1.z.string(),
            authorRole: zod_1.z.string(),
            authorCompany: zod_1.z.string(),
            avatarUrl: zod_1.z.string(),
            rating: zod_1.z.number(),
        })),
    }),
    cta: zod_1.z.object({
        badge: zod_1.z.string(),
        headline: zod_1.z.string(),
        description: zod_1.z.string(),
        buttonText: zod_1.z.string(),
        buttonHref: zod_1.z.string(),
        secondaryButtonText: zod_1.z.string().optional(),
        secondaryButtonHref: zod_1.z.string().optional(),
    }),
    footer: zod_1.z.object({
        copyrightText: zod_1.z.string(),
        description: zod_1.z.string(),
        columns: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            title: zod_1.z.string(),
            links: zod_1.z.array(zod_1.z.object({ label: zod_1.z.string(), href: zod_1.z.string() })),
        })),
    }),
});
