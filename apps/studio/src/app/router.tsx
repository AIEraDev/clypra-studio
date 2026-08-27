import { lazy, Suspense, type ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
  useNavigate,
} from "react-router-dom";
import { WebShowcase } from "../components/screens/WebShowcase";
import { EffectGraphSandbox } from "../components/EffectGraphSandbox";
import { StudioHub } from "../components/StudioHub";
import {
  AdminRoute,
  AuthRoute,
  RouteLoading,
  RouteShell,
  type RouteMetadata,
} from "./routeShell";
import { STUDIO_LAB_ROUTES, STUDIO_RAIL_ROUTES } from "./studioRoutes";

const TextEffectsLabPage = lazy(() =>
  import("../features/text-effects/TextEffectsLabPage"),
);
const TemplateWorkspace = lazy(() =>
  import("../components/TemplateWorkspace").then((module) => ({
    default: module.TemplateWorkspace,
  })),
);
const VideoLabView = lazy(() =>
  import("../labs/video").then((module) => ({ default: module.VideoLabView })),
);
const TransitionLabView = lazy(() =>
  import("../labs/transition").then((module) => ({
    default: module.TransitionLabView,
  })),
);
const BodyLabView = lazy(() =>
  import("../labs/body").then((module) => ({ default: module.BodyLabView })),
);
const FilterLabView = lazy(() =>
  import("../labs/filter/NativeFilterLabView").then((module) => ({
    default: module.NativeFilterLabView,
  })),
);
const AudioLabView = lazy(() =>
  import("../labs/audio").then((module) => ({ default: module.AudioLabView })),
);
const StickerLabView = lazy(() =>
  import("../labs/stickers").then((module) => ({ default: module.StickerLabView })),
);
const OverlayLabView = lazy(() =>
  import("../labs/overlays").then((module) => ({ default: module.OverlayLabView })),
);
const PerformanceAdminDashboard = lazy(() =>
  import("../features/performance/PerformanceAdminDashboard").then((module) => ({
    default: module.PerformanceAdminDashboard,
  })),
);

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
  lottie: {
    canonical: "https://clypra.abdulkabirmusa.com/lottie",
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

function TemplateRoute() {
  const navigate = useNavigate();
  return (
    <DocumentRoute metadata={METADATA.lottie}>
      {withSuspense(
        <TemplateWorkspace onBackToDesign={() => navigate("/studio")} />,
      )}
    </DocumentRoute>
  );
}

const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <DocumentRoute metadata={METADATA.showcase} lockScroll={false}>
        <WebShowcase />
      </DocumentRoute>
    ),
  },
  {
    path: "/lottie",
    element: <AuthRoute label="Text Templates"><TemplateRoute /></AuthRoute>,
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
    element: <AuthLabRoute metadata={METADATA.audioLab} label="the Audio Lab"><AudioLabView /></AuthLabRoute>,
  },
  {
    path: `${STUDIO_RAIL_ROUTES.stickers}/*`,
    element: <AuthLabRoute metadata={METADATA.stickerLab} label="the Sticker Lab"><StickerLabView /></AuthLabRoute>,
  },
  {
    path: `${STUDIO_RAIL_ROUTES.overlays}/*`,
    element: <AuthLabRoute metadata={METADATA.overlayLab} label="the Overlay Lab"><OverlayLabView /></AuthLabRoute>,
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
        <EffectGraphSandbox />
      </AuthLabRoute>
    ),
  },
  {
    path: `${STUDIO_LAB_ROUTES.video}/*`,
    element: (
      <AuthLabRoute metadata={METADATA.videoLab} label="the Video Lab">
        <VideoLabView />
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
        <TransitionLabView />
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
        <BodyLabView />
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
        <FilterLabView />
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
        <FilterLabView />
      </AuthLabRoute>
    ),
  },
  {
    path: `${STUDIO_RAIL_ROUTES.admin}/*`,
    element: (
      <DocumentRoute metadata={METADATA.adminPerformance}>
        <AdminRoute label="Studio administration">{withSuspense(<PerformanceAdminDashboard />)}</AdminRoute>
      </DocumentRoute>
    ),
  },
  {
    path: "/studio/performance/*",
    element: (
      <DocumentRoute metadata={METADATA.adminPerformance}>
        <AdminRoute label="Performance Intelligence">{withSuspense(<PerformanceAdminDashboard />)}</AdminRoute>
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
        <AuthRoute label="Clypra Studio"><StudioHub /></AuthRoute>
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
