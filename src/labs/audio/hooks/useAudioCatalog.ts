import { useCallback, useEffect, useMemo, useState } from "react";
import { getStudioApiBaseUrl } from "../../../services/apiConfig";
import type { AudioAsset } from "../types";

export const FALLBACK_CATALOG_TRACKS: AudioAsset[] = [
  {
    id: "cinematic-deep-impact-riser",
    name: "Cinematic Deep Impact Riser",
    category: "cinematic",
    author: "Clypra Audio Labs",
    duration: 6.4,
    bpm: 110,
    loopable: false,
    tags: ["cinematic", "trailer", "impact", "riser", "dramatic", "sub-bass"],
    description: "Sub-bass rumble crescendo peaking in a clean cinematic trailer impact.",
    license: {
      type: "cc0",
      attributionRequired: false,
    },
    source: {
      provider: "Clypra Studio Archive",
      url: "https://clypra.abdulkabirmusa.com/assets/audio/cinematic-impact.mp3",
    },
    audioUrl: "https://raw.githubusercontent.com/AIEraDev/clypra-api/main/data/audio/transition/woosh-long-cinematic.wav",
    published: true,
  },
  {
    id: "neon-cyber-city-groove",
    name: "Neon Cyber City Groove",
    category: "hip-hop",
    author: "Clypra Beatmakers",
    duration: 28.5,
    bpm: 92,
    loopable: true,
    tags: ["hip-hop", "synthwave", "beats", "lo-fi", "chill", "modern"],
    description: "Smooth 92 BPM urban beat with warm vintage keys and sidechained analog bass.",
    license: {
      type: "royalty-free",
      attributionRequired: true,
    },
    source: {
      provider: "Clypra Creative Commons",
      url: "https://clypra.abdulkabirmusa.com/assets/audio/cyber-groove.mp3",
    },
    audioUrl: "https://raw.githubusercontent.com/AIEraDev/clypra-api/main/data/audio/music/wii-u-song-pou-song-loop.wav",
    published: true,
  },
  {
    id: "ambient-aurora-meditation",
    name: "Ambient Aurora Meditation",
    category: "ambient",
    author: "Soundscape Studio",
    duration: 33.3,
    bpm: 65,
    loopable: true,
    tags: ["ambient", "drone", "meditation", "atmospheric", "peaceful"],
    description: "Serene atmospheric drone textured with organic tape noise and crystalline pads.",
    license: {
      type: "public-domain",
      attributionRequired: false,
    },
    source: {
      provider: "Freesound Public Commons",
      url: "https://freesound.org/people/crokomoko/sounds/833509/",
    },
    audioUrl: "https://raw.githubusercontent.com/AIEraDev/clypra-api/main/data/audio/chill/stay-with-me-please-i-need-you-here.wav",
    published: true,
  },
  {
    id: "swoosh-transition-fast",
    name: "Swoosh Velocity Cut",
    category: "transition",
    author: "Motion FX Pro",
    duration: 0.45,
    loopable: false,
    tags: ["transition", "swoosh", "fast", "motion", "clean"],
    description: "Quick airy cut transition sound effect engineered for video cuts and pans.",
    license: {
      type: "cc-by",
      attributionRequired: true,
    },
    source: {
      provider: "Freesound",
      url: "https://freesound.org/people/lesaucisson/sounds/585257/",
    },
    audioUrl: "https://raw.githubusercontent.com/AIEraDev/clypra-api/main/data/audio/transition/swoosh-1.mp3",
    published: true,
  },
  {
    id: "tactile-ui-click",
    name: "Tactile Glass UI Tap",
    category: "ui",
    author: "Interface Sounds",
    duration: 0.52,
    loopable: false,
    tags: ["ui", "click", "tap", "minimal", "interaction"],
    description: "Polished click sound effect for buttons, modal closures, and app micro-interactions.",
    license: {
      type: "cc0",
      attributionRequired: false,
    },
    source: {
      provider: "Freesound",
      url: "https://freesound.org/people/AleXZavesa/sounds/853900/",
    },
    audioUrl: "https://raw.githubusercontent.com/AIEraDev/clypra-api/main/data/audio/sfx/water-drop-tap-4.wav",
    published: true,
  },
];

export function useAudioCatalog() {
  const [tracks, setTracks] = useState<AudioAsset[]>(FALLBACK_CATALOG_TRACKS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<"all" | "short" | "medium" | "long">("all");
  const [activeTrack, setActiveTrack] = useState<AudioAsset | null>(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = getStudioApiBaseUrl();
      const res = await fetch(`${baseUrl}/audio`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load audio catalog`);
      }

      const data = (await res.json()) as AudioAsset[];
      if (Array.isArray(data) && data.length > 0) {
        setTracks(data);
      } else {
        setTracks(FALLBACK_CATALOG_TRACKS);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audio catalog");
      // Keep fallback tracks so UI remains usable
      setTracks(FALLBACK_CATALOG_TRACKS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      // Category filter
      if (selectedCategory !== "all" && track.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Duration filter
      if (durationFilter === "short" && track.duration >= 5) return false;
      if (durationFilter === "medium" && (track.duration < 5 || track.duration > 30)) return false;
      if (durationFilter === "long" && track.duration <= 30) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = track.name?.toLowerCase().includes(query);
        const matchesAuthor = track.author?.toLowerCase().includes(query);
        const matchesTags = track.tags?.some((t) => t.toLowerCase().includes(query));
        const matchesDesc = track.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesAuthor && !matchesTags && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [tracks, selectedCategory, durationFilter, searchQuery]);

  return {
    tracks,
    filteredTracks,
    totalCount: tracks.length,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    durationFilter,
    setDurationFilter,
    activeTrack,
    setActiveTrack,
    refetch: fetchCatalog,
  };
}
