"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Check,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Filter,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { WallpaperItem, WallpaperResponse } from "@nova/shared";

interface WallpaperBrowserProps {
  currentUrl?: string;
  favoriteWallpapers: string[];
  onSelectWallpaper: (url: string, type: "image" | "video") => void;
  onToggleFavorite: (url: string) => void;
  onPreviewWallpaper?: (url: string) => void;
}

export function WallpaperBrowser({
  currentUrl,
  favoriteWallpapers,
  onSelectWallpaper,
  onToggleFavorite,
  onPreviewWallpaper,
}: WallpaperBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Fetch wallpapers from API with pagination, category, and search query
  const { data, isLoading, isPlaceholderData } = useQuery<WallpaperResponse>({
    queryKey: ["wallpapers", selectedCategory, searchQuery, page],
    queryFn: async () => {
      const res = await api.get("/api/wallpapers", {
        params: {
          category: selectedCategory,
          q: searchQuery,
          page,
          limit: 12,
        },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const wallpapers = data?.wallpapers || [];
  const totalPages = data?.totalPages || 1;
  const categories = data?.categories || [];

  // Filter for favorites tab
  const displayedWallpapers = showFavoritesOnly
    ? wallpapers.filter((w) => favoriteWallpapers.includes(w.fullUrl) || favoriteWallpapers.includes(w.id))
    : wallpapers;

  const handleApply = (wallpaper: WallpaperItem) => {
    onSelectWallpaper(wallpaper.fullUrl, "image");
    toast.success(`Applied "${wallpaper.title}" as background!`);
  };

  const handleDownload = (wallpaper: WallpaperItem) => {
    window.open(wallpaper.fullUrl, "_blank");
    toast.info(`Opening 4K resolution image for "${wallpaper.title}"`);
  };

  return (
    <div className="space-y-6">
      {/* Category Pills & Search Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search 4K wallpapers by title, tags (e.g. AMOLED, anime, space)..."
              className="pl-9 bg-zinc-900/80 border-white/10 text-xs text-white placeholder:text-zinc-500 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter: Favorites Toggle */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={showFavoritesOnly ? "studio" : "outline"}
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                setPage(1);
              }}
              className="h-9 text-xs gap-1.5 border-white/10 rounded-xl"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  showFavoritesOnly ? "fill-amber-400 text-amber-400" : "text-zinc-400"
                }`}
              />
              <span>Favorites ({favoriteWallpapers.length})</span>
            </Button>

            <a
              href="https://4kwallpapers.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl border border-white/5 bg-zinc-900/50"
            >
              <span>4kwallpapers.com</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id && !showFavoritesOnly;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowFavoritesOnly(false);
                  setPage(1);
                }}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-xl transition-all border ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500/50 shadow-md shadow-violet-600/20"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/10"
                }`}
              >
                {cat.name}
                <span className="ml-1.5 text-[10px] opacity-70">({cat.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wallpapers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-white/5 bg-zinc-900/40 p-3 space-y-3">
              <Skeleton className="h-44 w-full rounded-xl bg-zinc-800" />
              <Skeleton className="h-4 w-3/4 bg-zinc-800" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16 bg-zinc-800" />
                <Skeleton className="h-7 w-20 bg-zinc-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedWallpapers.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-zinc-950/40">
          <ImageIcon className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No wallpapers found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {showFavoritesOnly
              ? "You haven't marked any wallpapers as favorites yet. Click the star icon on any wallpaper to add it to your favorites."
              : "Try adjusting your search query or selecting a different category from above."}
          </p>
          {(searchQuery || showFavoritesOnly) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setShowFavoritesOnly(false);
                setSelectedCategory("all");
                setPage(1);
              }}
              className="mt-4 text-xs border-white/10"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedWallpapers.map((wallpaper) => {
            const isSelected = currentUrl === wallpaper.fullUrl;
            const isFav =
              favoriteWallpapers.includes(wallpaper.fullUrl) ||
              favoriteWallpapers.includes(wallpaper.id);

            return (
              <div
                key={wallpaper.id}
                className={`group relative rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden bg-zinc-950/60 hover:shadow-xl hover:shadow-violet-600/10 ${
                  isSelected
                    ? "border-violet-500 shadow-md shadow-violet-500/20 ring-1 ring-violet-500"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
                  <img
                    src={wallpaper.thumbnailUrl}
                    alt={wallpaper.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <Badge className="bg-black/60 backdrop-blur-md text-[10px] text-zinc-300 border border-white/10 py-0.5 px-2">
                      {wallpaper.resolution}
                    </Badge>

                    {/* Favorite Star Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(wallpaper.fullUrl);
                      }}
                      className="pointer-events-auto h-7 w-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 hover:text-amber-400 transition-colors"
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          isFav ? "fill-amber-400 text-amber-400" : "text-zinc-300"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    {onPreviewWallpaper && (
                      <button
                        type="button"
                        onClick={() => onPreviewWallpaper(wallpaper.fullUrl)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium backdrop-blur-md flex items-center gap-1.5 transition-colors shadow-lg"
                        title="Live Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Preview</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownload(wallpaper)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium backdrop-blur-md flex items-center gap-1.5 transition-colors shadow-lg"
                      title="Download / View in 4K"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>4K File</span>
                    </button>
                  </div>
                </div>

                {/* Card Info & Apply Button */}
                <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <h4
                      className="text-xs font-semibold text-white truncate"
                      title={wallpaper.title}
                    >
                      {wallpaper.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 capitalize mt-0.5">
                      Category: {wallpaper.category}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">4K UHD</span>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "outline" : "studio"}
                      onClick={() => handleApply(wallpaper)}
                      className={`h-7 px-3 text-[11px] gap-1 rounded-lg ${
                        isSelected
                          ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                          : "shadow-sm shadow-violet-600/30"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          <span>Apply</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <p className="text-xs text-zinc-400">
            Page <span className="font-semibold text-white">{page}</span> of{" "}
            <span className="font-semibold text-white">{totalPages}</span>
            {data?.total ? ` (${data.total} wallpapers)` : ""}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1 || isPlaceholderData}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="h-8 text-xs gap-1 border-white/10"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            {/* Page number buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, current, and neighbours
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                        page === pageNum
                          ? "bg-violet-600 text-white font-bold"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === page - 2 || pageNum === page + 2) {
                  return (
                    <span key={pageNum} className="text-zinc-600 text-xs px-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= totalPages || isPlaceholderData}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="h-8 text-xs gap-1 border-white/10"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

