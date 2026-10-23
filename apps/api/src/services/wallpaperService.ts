import { WallpaperItem, WallpaperCategory, WallpaperResponse } from "@nova/shared";

export class WallpaperService {
  private static instance: WallpaperService;

  // Curated 4K wallpapers dataset covering all categories from 4kwallpapers.com & UHD CDNs
  private wallpapers: WallpaperItem[] = [
    // --- AMOLED & BLACK ---
    {
      id: "4k-amoled-01",
      title: "Neon Ring Black AMOLED 4K",
      category: "amoled",
      tags: ["amoled", "neon", "circle", "dark", "glow", "oled", "minimal"],
      thumbnailUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/black-dark/",
    },
    {
      id: "4k-amoled-02",
      title: "Eclipse Cyber Moon OLED 4K",
      category: "amoled",
      tags: ["amoled", "moon", "space", "pure black", "minimal"],
      thumbnailUrl: "https://images.unsplash.com/photo-1532767153582-b1a0e5145009?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1532767153582-b1a0e5145009?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/black-dark/",
    },
    {
      id: "4k-amoled-03",
      title: "Obsidian Liquid Waves 4K",
      category: "amoled",
      tags: ["amoled", "dark", "waves", "liquid", "glossy", "black"],
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/black-dark/",
    },
    {
      id: "4k-amoled-04",
      title: "Carbon Fiber Geometric Grid",
      category: "amoled",
      tags: ["amoled", "carbon", "dark", "geometry", "texture", "clean"],
      thumbnailUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/black-dark/",
    },

    // --- DARK AESTHETIC ---
    {
      id: "4k-dark-01",
      title: "Midnight Cyber Metropolis",
      category: "dark",
      tags: ["dark", "city", "night", "cyberpunk", "rain", "lights"],
      thumbnailUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/black-dark/",
    },
    {
      id: "4k-dark-02",
      title: "Dark Minimal Mountain Fog",
      category: "dark",
      tags: ["dark", "mountains", "fog", "mist", "moody", "minimal"],
      thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/black-dark/",
    },
    {
      id: "4k-dark-03",
      title: "Dark Neon Glass Refraction",
      category: "dark",
      tags: ["dark", "glass", "glassmorphism", "neon", "prism", "purple"],
      thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/black-dark/",
    },
    {
      id: "4k-dark-04",
      title: "Nocturnal Forest Twilight",
      category: "dark",
      tags: ["dark", "forest", "nature", "stars", "night", "pine"],
      thumbnailUrl: "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/black-dark/",
    },

    // --- ANIME ---
    {
      id: "4k-anime-01",
      title: "Tokyo Cyberpunk Sunset Street",
      category: "anime",
      tags: ["anime", "tokyo", "cyberpunk", "aesthetic", "lofi", "city"],
      thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/anime/",
    },
    {
      id: "4k-anime-02",
      title: "Sakura Blossom Shinto Shrine",
      category: "anime",
      tags: ["anime", "sakura", "shrine", "japan", "pink", "cherry blossom"],
      thumbnailUrl: "https://images.unsplash.com/photo-1528164344705-475426879c0d?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1528164344705-475426879c0d?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/anime/",
    },
    {
      id: "4k-anime-03",
      title: "Lo-Fi Midnight Bedroom Horizon",
      category: "anime",
      tags: ["anime", "lofi", "aesthetic", "vibes", "purple", "neon"],
      thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/anime/",
    },
    {
      id: "4k-anime-04",
      title: "Futuristic Mecha Pilot Dawn",
      category: "anime",
      tags: ["anime", "mecha", "scifi", "sunrise", "robot", "epic"],
      thumbnailUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/anime/",
    },

    // --- SPACE & COSMOS ---
    {
      id: "4k-space-01",
      title: "James Webb Deep Cosmic Nebula 4K",
      category: "space",
      tags: ["space", "nebula", "stars", "galaxy", "deep space", "hubble", "jwst"],
      thumbnailUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/space/",
    },
    {
      id: "4k-space-02",
      title: "Milky Way Galaxy Arc Over Alps",
      category: "space",
      tags: ["space", "milky way", "astrophotography", "stars", "night sky"],
      thumbnailUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/space/",
    },
    {
      id: "4k-space-03",
      title: "Saturn Rings Planetary Orbit",
      category: "space",
      tags: ["space", "saturn", "planets", "orbit", "solar system", "cosmos"],
      thumbnailUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/space/",
    },
    {
      id: "4k-space-04",
      title: "Supernova Stellar Explosion Core",
      category: "space",
      tags: ["space", "supernova", "burst", "glow", "astronomy", "vibrant"],
      thumbnailUrl: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/space/",
    },

    // --- MINIMAL ---
    {
      id: "4k-minimal-01",
      title: "Minimalist Dune Golden Shadows",
      category: "minimal",
      tags: ["minimal", "sand", "dune", "desert", "clean", "calm"],
      thumbnailUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/minimal/",
    },
    {
      id: "4k-minimal-02",
      title: "Solitary Tree Monochrome Fog",
      category: "minimal",
      tags: ["minimal", "tree", "mist", "fog", "black and white", "zen"],
      thumbnailUrl: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/minimal/",
    },
    {
      id: "4k-minimal-03",
      title: "Pastel Sunset Ocean Horizon",
      category: "minimal",
      tags: ["minimal", "ocean", "sunset", "gradient", "pastel", "peaceful"],
      thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/minimal/",
    },
    {
      id: "4k-minimal-04",
      title: "Smooth Geometric Arc Gradient",
      category: "minimal",
      tags: ["minimal", "abstract", "geometric", "clean", "modern"],
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/minimal/",
    },

    // --- GAMES ---
    {
      id: "4k-games-01",
      title: "Cyberpunk 2077 Night City Skyline",
      category: "games",
      tags: ["games", "cyberpunk", "night city", "neon", "gaming"],
      thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/games/",
    },
    {
      id: "4k-games-02",
      title: "Futuristic Battle Arena Glow",
      category: "games",
      tags: ["games", "esports", "arena", "rgb", "pc setup", "gaming"],
      thumbnailUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/games/",
    },
    {
      id: "4k-games-03",
      title: "Epic Fantasy Castle RPG World",
      category: "games",
      tags: ["games", "fantasy", "castle", "rpg", "landscape", "adventure"],
      thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/games/",
    },
    {
      id: "4k-games-04",
      title: "Retro Arcade Vaporwave Neon",
      category: "games",
      tags: ["games", "arcade", "retro", "80s", "vaporwave", "synthwave"],
      thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/games/",
    },

    // --- NATURE & LANDSCAPES ---
    {
      id: "4k-nature-01",
      title: "Emerald Alpine Lake Reflection",
      category: "nature",
      tags: ["nature", "mountains", "lake", "alps", "water", "landscape"],
      thumbnailUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/nature/",
    },
    {
      id: "4k-nature-02",
      title: "Aurora Borealis Northern Lights",
      category: "nature",
      tags: ["nature", "aurora", "green", "norway", "night", "stars"],
      thumbnailUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/nature/",
    },
    {
      id: "4k-nature-03",
      title: "Cascading Majestic Forest Waterfall",
      category: "nature",
      tags: ["nature", "waterfall", "forest", "green", "river", "peaceful"],
      thumbnailUrl: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/nature/",
    },
    {
      id: "4k-nature-04",
      title: "Golden Hour Mountain Crests",
      category: "nature",
      tags: ["nature", "sunset", "golden hour", "peaks", "sky"],
      thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/nature/",
    },

    // --- CARS & SUPERCARS ---
    {
      id: "4k-cars-01",
      title: "Matte Black Hypercar Night Wet Asphalt",
      category: "cars",
      tags: ["cars", "supercar", "hypercar", "black", "matte", "neon"],
      thumbnailUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/cars/",
    },
    {
      id: "4k-cars-02",
      title: "Porsche GT3 RS Mountain Pass",
      category: "cars",
      tags: ["cars", "porsche", "racing", "track", "speed", "drift"],
      thumbnailUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/cars/",
    },
    {
      id: "4k-cars-03",
      title: "Cyberpunk Delorean Neon Flight",
      category: "cars",
      tags: ["cars", "delorean", "scifi", "retro", "synthwave"],
      thumbnailUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/cars/",
    },
    {
      id: "4k-cars-04",
      title: "Ferrari Rosso Corsa Sunset Highway",
      category: "cars",
      tags: ["cars", "ferrari", "red", "exotic", "highway", "luxury"],
      thumbnailUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/cars/",
    },

    // --- ABSTRACT & 3D ---
    {
      id: "4k-abstract-01",
      title: "Iridescent Silk Glass Ribbon 4K",
      category: "abstract",
      tags: ["abstract", "glass", "silk", "iridescent", "3d", "render", "fluid"],
      thumbnailUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/abstract/",
    },
    {
      id: "4k-abstract-02",
      title: "Chromatic Spheres Floating Dimension",
      category: "abstract",
      tags: ["abstract", "spheres", "chromatic", "geometry", "3d art"],
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/abstract/",
    },
    {
      id: "4k-abstract-03",
      title: "Liquid Gold & Deep Violet Waves",
      category: "abstract",
      tags: ["abstract", "gold", "violet", "waves", "luxury", "fluid"],
      thumbnailUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/abstract/",
    },
    {
      id: "4k-abstract-04",
      title: "Geometric Prisms Spectrum Refraction",
      category: "abstract",
      tags: ["abstract", "prism", "spectrum", "light", "crystal", "glassmorphism"],
      thumbnailUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/abstract/",
    },

    // --- TECHNOLOGY & AI ---
    {
      id: "4k-tech-01",
      title: "Quantum Neural Network Synapse 4K",
      category: "technology",
      tags: ["technology", "ai", "neural network", "quantum", "data", "cyber"],
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/technology/",
    },
    {
      id: "4k-tech-02",
      title: "Illuminated Motherboard Microchips",
      category: "technology",
      tags: ["technology", "hardware", "cpu", "chips", "circuit", "gold"],
      thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/technology/",
    },
    {
      id: "4k-tech-03",
      title: "Holographic Cyber Matrix Streams",
      category: "technology",
      tags: ["technology", "matrix", "code", "cyan", "hologram", "data"],
      thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/technology/",
    },

    // --- SCI-FI & CYBERPUNK ---
    {
      id: "4k-scifi-01",
      title: "Neo-Tokyo Cyberpunk Rain Alleyway",
      category: "scifi",
      tags: ["scifi", "cyberpunk", "neon", "rain", "future", "tokyo"],
      thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/sci-fi/",
    },
    {
      id: "4k-scifi-02",
      title: "Orbital Space Station Sunset Horizon",
      category: "scifi",
      tags: ["scifi", "space station", "orbit", "future", "spaceships"],
      thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/sci-fi/",
    },

    // --- ARCHITECTURE ---
    {
      id: "4k-arch-01",
      title: "Futuristic Glass Skyscraper Geometric Atrium",
      category: "architecture",
      tags: ["architecture", "skyscraper", "glass", "modern", "geometric", "lines"],
      thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/architecture/",
    },
    {
      id: "4k-arch-02",
      title: "Nighttime High-Rise Metropolis Panorama",
      category: "architecture",
      tags: ["architecture", "cityscape", "night", "skyline", "urban", "lights"],
      thumbnailUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/architecture/",
    },

    // --- GRADIENTS & CLEAN ---
    {
      id: "4k-gradients-01",
      title: "Deep Violet & Indigo Cosmic Mesh Gradient",
      category: "gradients",
      tags: ["gradients", "mesh", "purple", "violet", "smooth", "clean"],
      thumbnailUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/gradients/",
    },
    {
      id: "4k-gradients-02",
      title: "Cyan Teal & Midnight Blue Fluid Glow",
      category: "gradients",
      tags: ["gradients", "cyan", "blue", "fluid", "minimalist", "clean"],
      thumbnailUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/gradients/",
    },

    // --- FANTASY & MYTHICAL ---
    {
      id: "4k-fantasy-01",
      title: "Floating Sky Islands & Ancient Ruins",
      category: "fantasy",
      tags: ["fantasy", "floating island", "sky", "ruins", "mythical", "epic"],
      thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/fantasy/",
    },
    {
      id: "4k-fantasy-02",
      title: "Enchanted Bioluminescent Forest Pathway",
      category: "fantasy",
      tags: ["fantasy", "magic", "glowing", "forest", "mystical", "blue"],
      thumbnailUrl: "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/fantasy/",
    },

    // --- ANIMALS & WILDLIFE ---
    {
      id: "4k-animals-01",
      title: "Bengal Tiger Piercing Gaze in Shadows",
      category: "animals",
      tags: ["animals", "tiger", "wildlife", "eyes", "dark", "predator"],
      thumbnailUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/animals/",
    },
    {
      id: "4k-animals-02",
      title: "Arctic Wolf in White Blizzard",
      category: "animals",
      tags: ["animals", "wolf", "snow", "arctic", "wild", "white"],
      thumbnailUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/animals/",
    },

    // --- MOVIES & CINEMA ---
    {
      id: "4k-movies-01",
      title: "Interstellar Gargantua Black Hole Glow",
      category: "movies",
      tags: ["movies", "interstellar", "black hole", "sci-fi", "space", "cinema"],
      thumbnailUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/movies/",
    },
    {
      id: "4k-movies-02",
      title: "Blade Runner 2049 Amber Dust Metropolis",
      category: "movies",
      tags: ["movies", "blade runner", "amber", "dust", "future", "las vegas"],
      thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop",
      fullUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=3840&auto=format&fit=crop",
      resolution: "3840x2160 (4K)",
      sourceUrl: "https://4kwallpapers.com/movies/",
    },
  ];

  public static getInstance(): WallpaperService {
    if (!WallpaperService.instance) {
      WallpaperService.instance = new WallpaperService();
    }
    return WallpaperService.instance;
  }

  public getCategories(): WallpaperCategory[] {
    const counts: Record<string, number> = {};
    for (const item of this.wallpapers) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }

    const categoryNames: Record<string, string> = {
      all: "All Wallpapers",
      amoled: "Black & AMOLED",
      dark: "Dark Aesthetic",
      anime: "Anime",
      minimal: "Minimalist",
      space: "Space & Galaxy",
      scifi: "Sci-Fi & Cyberpunk",
      games: "Gaming & Esports",
      nature: "Nature & Landscapes",
      cars: "Supercars & Vehicles",
      abstract: "Abstract & 3D",
      technology: "Technology & AI",
      architecture: "Architecture & Cities",
      gradients: "Gradients & Clean",
      fantasy: "Fantasy & Mythical",
      animals: "Animals & Wildlife",
      movies: "Movies & Cinema",
    };

    const categories: WallpaperCategory[] = [
      { id: "all", name: "All Wallpapers", count: this.wallpapers.length },
    ];

    for (const [id, name] of Object.entries(categoryNames)) {
      if (id !== "all") {
        categories.push({
          id,
          name,
          count: counts[id] || 0,
        });
      }
    }

    return categories;
  }

  public getWallpapers(options: {
    category?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): WallpaperResponse {
    const { category = "all", q = "", page = 1, limit = 12 } = options;

    let filtered = this.wallpapers;

    // Filter by Category
    if (category && category !== "all") {
      filtered = filtered.filter(
        (w) => w.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by Search Query (title, tags, category)
    if (q && q.trim().length > 0) {
      const query = q.trim().toLowerCase();
      filtered = filtered.filter((w) => {
        return (
          w.title.toLowerCase().includes(query) ||
          w.category.toLowerCase().includes(query) ||
          w.tags.some((t) => t.toLowerCase().includes(query))
        );
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      success: true,
      wallpapers: paginated,
      page: safePage,
      limit,
      total,
      totalPages,
      categories: this.getCategories(),
    };
  }
}
