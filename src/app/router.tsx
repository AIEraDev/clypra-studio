import { lazy, Suspense, type ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import {
  AdminRoute,
  AuthRoute,
  RouteLoading,
  RouteShell,
  type RouteMetadata,
} from "./routeShell";
import { STUDIO_LAB_ROUTES, STUDIO_RAIL_ROUTES } from "./studioRoutes";

// ── Lazy-loaded Page Routes from `src/pages/` ──────────────────────────
const ShowcasePage = lazy(() => import("../pages/ShowcasePage"));
const StudioHubPage = lazy(() => import("../pages/StudioHubPage"));
const TextEffectsLabPage = lazy(() => import("../pages/TextEffectsLabPage"));
const TemplateWorkspacePage = lazy(() => import("../pages/TemplateWorkspacePage"));
const EffectGraphSandboxPage = lazy(() => import("../pages/EffectGraphSandboxPage"));
const PerformanceAdminPage = lazy(() => import("../pages/PerformanceAdminPage"));
const PreviewPerformanceAdminPage = lazy(() => import("../pages/PreviewPerformanceAdminPage"));
const AudioPerformanceAdminPage = lazy(() => import("../pages/AudioPerformanceAdminPage"));
const TextPerformanceAdminPage = lazy(() => import("../pages/TextPerformanceAdminPage"));
const VideoLabPage = lazy(() => import("../pages/labs/VideoLabPage"));
const TransitionLabPage = lazy(() => import("../pages/labs/TransitionLabPage"));
const BodyLabPage = lazy(() => import("../pages/labs/BodyLabPage"));
const FilterLabPage = lazy(() => import("../pages/labs/FilterLabPage"));
const AudioLabPage = lazy(() => import("../pages/labs/AudioLabPage"));
const StickerLabPage = lazy(() => import("../pages/labs/StickerLabPage"));
const OverlayLabPage = lazy(() => import("../pages/labs/OverlayLabPage"));

const METADATA = {
  showcase: {
    canonical: "https://clypra.abdulkabirmusa.com/",
    description:
      "Clypra is a native desktop video editor for macOS, Windows, and Linux with fast playback, professional timelines, and editor-ready creative assets.",
    title: "Clypra — Native Video Editor for Desktop",
  },
  studio: {
    canonical: "https://clypra.abdulkabirmusa.com/studio",
    description:
      "Clypra Studio navigation hub for native creative labs, authoring tools, and editor-compatible asset development.",
    title: "Clypra Studio - Native Creative Labs",
  },
  textEffectsLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/text-effects",
    description:
      "Design, preview, animate, and export native Clypra text effects with editor-compatible style and layer contracts.",
    title: "Clypra Studio - Text Effects Lab",
  },
  audioLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/audio",
    description: "Prepare, validate, and publish editor-ready audio assets through Clypra Studio.",
    title: "Clypra Studio - Audio Lab",
  },
  stickerLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/stickers",
    description: "Preview, validate, and publish animated sticker assets through Clypra Studio.",
    title: "Clypra Studio - Sticker Lab",
  },
  overlayLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/overlays",
    description: "Compose native overlays, layers, data bindings, and reusable visual components.",
    title: "Clypra Studio - Overlay Lab",
  },
  textTemplate: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/text-template",
    description:
      "Professional text animation editor and template creator. Design, customize, and publish templates with advanced layer controls, keyframe animation, and GitHub integration.",
    title: "Clypra Text Templates - Animation Template Editor",
  },
  effects: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/effects",
    description:
      "Sandbox for testing effect graphs and native engine execution.",
    title: "Clypra Studio - Effect Graph Sandbox",
  },
  videoLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/video-lab",
    description:
      "Video Effects Lab - Design, test, and publish single-input video effects with the unified runtime.",
    title: "Clypra Studio - Video Lab",
  },
  transitionLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/transition-lab",
    description:
      "Transition Lab - Design, test, and publish dual-input transition effects with the unified runtime.",
    title: "Clypra Studio - Transition Lab",
  },
  bodyLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/body-lab",
    description:
      "Body Lab - Design, test, and publish mask-based body effects with extensible feature providers.",
    title: "Clypra Studio - Body Lab",
  },
  filterLab: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/filter-lab",
    description:
      "Filter Lab - Design, test, and publish color grading presets and looks with the native rendering pipeline.",
    title: "Clypra Studio - Filter Lab",
  },
  colorGrading: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/color-grading",
    description:
      "Color Grading Lab - Design, test, and publish native color grading adjustments.",
    title: "Clypra Studio - Color Grading Lab",
  },
  adminPerformance: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/admin/performance",
    description:
      "Clypra Studio Production Performance & Telemetry Intelligence Console. Analyze cross-OS latency matrices, GPU bottlenecks, and isolated edge cases.",
    title: "Clypra Studio - Performance Intelligence",
  },
  adminPreviewPerformance: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/admin/performance/preview",
    description:
      "Clypra Studio live comparison of WebView DOM readback and native program preview surface performance.",
    title: "Clypra Studio - Program Preview Performance",
  },
  adminAudioPerformance: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/admin/performance/audio",
    description:
      "Clypra Studio live analysis of Native CPAL and Web Audio playback health, callback cost, buffering, underruns, and clock drift.",
    title: "Clypra Studio - Audio Performance",
  },
  adminTextPerformance: {
    canonical: "https://clypra.abdulkabirmusa.com/studio/admin/performance/text",
    description:
      "Clypra Studio live analysis of normal text, text effects, and text template rendering stages.",
    title: "Clypra Studio - Text Performance",
  },
} satisfies Record<string, RouteMetadata>;

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>;
}

function DocumentRoute({
  children,
  metadata,
  lockScroll = true,
}: {
  children: ReactNode;
  metadata: RouteMetadata;
  lockScroll?: boolean;
}) {
  return (
    <RouteShell metadata={metadata} lockScroll={lockScroll}>
      {children}
    </RouteShell>
  );
}

function AuthLabRoute({
  children,
  metadata,
  label,
}: {
  children: ReactNode;
  metadata: RouteMetadata;
  label: string;
}) {
  return (
    <DocumentRoute metadata={metadata}>
      <AuthRoute label={label}>{withSuspense(children)}</AuthRoute>
    </DocumentRoute>
  );
}

const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <DocumentRoute metadata={METADATA.showcase} lockScroll={false}>
        {withSuspense(<ShowcasePage />)}
      </DocumentRoute>
    ),
  },
  {
    path: "/studio/text-template",
    element: (
      <DocumentRoute metadata={METADATA.textTemplate}>
        <AuthRoute label="Text Templates">{withSuspense(<TemplateWorkspacePage />)}</AuthRoute>
      </DocumentRoute>
    ),
  },
  {
    path: "/lottie",
    element: (
      <DocumentRoute metadata={METADATA.textTemplate}>
        <AuthRoute label="Text Templates">
          <Navigate to="/studio/text-template" replace />
        </AuthRoute>
      </DocumentRoute>
    ),
  },
  {
    path: "/studio/mpg/*",
    element: <Navigate to="/studio" replace />,
  },
  {
    path: `${STUDIO_RAIL_ROUTES["text-effects"]}/*`,
    element: (
      <DocumentRoute metadata={METADATA.textEffectsLab}>
        <AuthRoute label="the Text Effects Lab">{withSuspense(<TextEffectsLabPage />)}</AuthRoute>
      </DocumentRoute>
    ),
  },
  {
    path: `${STUDIO_RAIL_ROUTES.audio}/*`,
    element: <AuthLabRoute metadata={METADATA.audioLab} label="the Audio Lab"><AudioLabPage /></AuthLabRoute>,
  },
  {
    path: `${STUDIO_RAIL_ROUTES.stickers}/*`,
    element: <AuthLabRoute metadata={METADATA.stickerLab} label="the Sticker Lab"><StickerLabPage /></AuthLabRoute>,
  },
  {
    path: `${STUDIO_RAIL_ROUTES.overlays}/*`,
    element: <AuthLabRoute metadata={METADATA.overlayLab} label="the Overlay Lab"><OverlayLabPage /></AuthLabRoute>,
  },
  // Retire the former Master Lab without allowing the catch-all Studio
  // workspace route to render it as a text-effects surface.
  {
    path: "/studio/master/*",
    element: <Navigate to="/studio" replace />,
  },
  {
    path: "/studio-master",
    element: <Navigate to="/studio" replace />,
  },
  // Keep the legacy moderator URL safe while converging on the canonical
  // Studio admin route. The destination owns the admin guard.
  {
    path: "/admin/*",
    element: <Navigate to={STUDIO_RAIL_ROUTES.admin} replace />,
  },
  {
    path: `${STUDIO_LAB_ROUTES.effects}/*`,
    element: (
      <AuthLabRoute
        metadata={METADATA.effects}
        label="the Effect Graph Sandbox"
      >
        <EffectGraphSandboxPage />
      </AuthLabRoute>
    ),
  },
  {
    path: `${STUDIO_LAB_ROUTES.video}/*`,
    element: (
      <AuthLabRoute metadata={METADATA.videoLab} label="the Video Lab">
        <VideoLabPage />
      </AuthLabRoute>
    ),
  },
  {
    path: "/video-lab",
    element: <Navigate to={STUDIO_LAB_ROUTES.video} replace />,
  },
  {
    path: `${STUDIO_LAB_ROUTES.transition}/*`,
    element: (
      <AuthLabRoute
        metadata={METADATA.transitionLab}
        label="the Transition Lab"
      >
        <TransitionLabPage />
      </AuthLabRoute>
    ),
  },
  {
    path: "/transition-lab",
    element: <Navigate to={STUDIO_LAB_ROUTES.transition} replace />,
  },
  {
    path: `${STUDIO_LAB_ROUTES.body}/*`,
    element: (
      <AuthLabRoute metadata={METADATA.bodyLab} label="the Body Lab">
        <BodyLabPage />
      </AuthLabRoute>
    ),
  },
  {
    path: "/body-lab",
    element: <Navigate to={STUDIO_LAB_ROUTES.body} replace />,
  },
  {
    path: `${STUDIO_LAB_ROUTES.filter}/*`,
    element: (
      <AuthLabRoute metadata={METADATA.filterLab} label="the Filter Lab">
        <FilterLabPage />
      </AuthLabRoute>
    ),
  },
  {
    path: "/filter-lab",
    element: <Navigate to={STUDIO_LAB_ROUTES.filter} replace />,
  },
  {
    path: `${STUDIO_LAB_ROUTES.colorGrading}/*`,
    element: (
      <AuthLabRoute
        metadata={METADATA.colorGrading}
        label="the Color Grading Lab"
      >
        <FilterLabPage />
      </AuthLabRoute>
    ),
  },
  {
    path: `${STUDIO_RAIL_ROUTES.admin}/performance/audio`,
    element: (
      <DocumentRoute metadata={METADATA.adminAudioPerformance}>
        <AdminRoute label="Audio Performance">{withSuspense(<AudioPerformanceAdminPage />)}</AdminRoute>
      </DocumentRoute>
    ),
  },
  {
    path: `${STUDIO_RAIL_ROUTES.admin}/performance/text`,
    element: (
      <DocumentRoute metadata={METADATA.adminTextPerformance}>
        <AdminRoute label="Text Performance">{withSuspense(<TextPerformanceAdminPage />)}</AdminRoute>
      </DocumentRoute>
    ),
  },
  {
    path: `${STUDIO_RAIL_ROUTES.admin}/performance/preview`,
    element: (
      <DocumentRoute metadata={METADATA.adminPreviewPerformance}>
        <AdminRoute label="Program Preview Performance">{withSuspense(<PreviewPerformanceAdminPage />)}</AdminRoute>
      </DocumentRoute>
    ),
  },
  {
    path: `${STUDIO_RAIL_ROUTES.admin}/performance/*`,
    element: (
      <DocumentRoute metadata={METADATA.adminPerformance}>
        <AdminRoute label="Performance Intelligence">{withSuspense(<PerformanceAdminPage />)}</AdminRoute>
      </DocumentRoute>
    ),
  },
  {
    path: `${STUDIO_RAIL_ROUTES.admin}/*`,
    element: (
      <DocumentRoute metadata={METADATA.studio}>
        <AdminRoute label="Studio administration">{withSuspense(<TextEffectsLabPage />)}</AdminRoute>
      </DocumentRoute>
    ),
  },
  {
    path: "/studio/performance/*",
    element: (
      <DocumentRoute metadata={METADATA.adminPerformance}>
        <AdminRoute label="Performance Intelligence">{withSuspense(<PerformanceAdminPage />)}</AdminRoute>
      </DocumentRoute>
    ),
  },
  {
    path: `${STUDIO_RAIL_ROUTES.labs}/*`,
    element: (
      <DocumentRoute metadata={METADATA.studio}>
        <AdminRoute label="Studio labs">{withSuspense(<TextEffectsLabPage />)}</AdminRoute>
      </DocumentRoute>
    ),
  },
  {
    path: "/studio",
    element: (
      <DocumentRoute metadata={METADATA.studio}>
        <AuthRoute label="Clypra Studio">{withSuspense(<StudioHubPage />)}</AuthRoute>
      </DocumentRoute>
    ),
  },
  {
    path: "/studio/*",
    element: (
      <DocumentRoute metadata={METADATA.studio}>
        <AuthRoute label="Clypra Studio">{withSuspense(<TextEffectsLabPage />)}</AuthRoute>
      </DocumentRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];

export const router = createBrowserRouter(routes);
