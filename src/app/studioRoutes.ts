export const STUDIO_RAIL_ROUTES = {
  "text-effects": "/studio/text-effects",
  "text-template": "/studio/text-template",
  audio: "/studio/audio",
  stickers: "/studio/stickers",
  overlays: "/studio/overlays",
  "video-effects": "/studio/video-effects",
  "body-effects": "/studio/body-effects",
  filters: "/studio/filters",
  transitions: "/studio/transitions",
  admin: "/studio/admin",
  labs: "/studio/labs",
} as const;

export const STUDIO_LAB_ROUTES = {
  effects: "/studio/effects",
  video: "/studio/video-lab",
  transition: "/studio/transition-lab",
  body: "/studio/body-lab",
  filter: "/studio/filter-lab",
  colorGrading: "/studio/color-grading",
} as const;

export type RailItem = keyof typeof STUDIO_RAIL_ROUTES;

export function isRailItem(value: string | null): value is RailItem {
  return value !== null && Object.prototype.hasOwnProperty.call(STUDIO_RAIL_ROUTES, value);
}

export function railItemFromPathname(pathname: string): RailItem {
  if (pathname === STUDIO_RAIL_ROUTES["text-effects"]) return "text-effects";
  if (pathname === STUDIO_RAIL_ROUTES["text-template"]) return "text-template";

  const studioSubpath = pathname.match(/^\/studio\/([^/]+)/)?.[1];
  if (!studioSubpath) return "text-effects";

  return (Object.entries(STUDIO_RAIL_ROUTES).find(([, route]) => route === `/studio/${studioSubpath}`)?.[0] as RailItem | undefined) ?? "text-effects";
}

export function railItemPath(item: RailItem): string {
  return STUDIO_RAIL_ROUTES[item];
}
