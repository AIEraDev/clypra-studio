import { describe, it, expect } from "vitest";
import { LayoutEngine } from "../layoutEngine.js";
import type {
  OverlayDocument,
  RepeaterNode,
  FrameNode,
  PrimitiveShapeNode,
  PrimitiveTextNode,
  MediaNode,
} from "../overlayDocumentSchema.js";

/**
 * Hero Benchmark: Live Stream Crucible Leaderboard
 *
 * Validates all 6 foundational primitives acting simultaneously:
 * 1. Rectangle (Card Surface, Border, Shadow, Badges)
 * 2. Layout Frame (Header Row + Outer Column + Row Template with Flex-Fill)
 * 3. Circle (Avatar Radial Geometry)
 * 4. Media Image (Avatar Source Bitmaps)
 * 5. Text (Ranks, Usernames, Dynamic Multi-line Subtitles, Point Scores)
 * 6. Data Repeater (The Multiplication Primitive: Key Tracking, Windowing, Scoped Context)
 */
describe("Hero Benchmark: Live Stream Crucible Leaderboard", () => {
  const layoutEngine = new LayoutEngine();

  const createLiveLeaderboardDoc = (initialData: any[]): OverlayDocument => ({
    id: "doc-live-leaderboard-hero",
    version: "1.0",
    title: "Live Stream Crucible Leaderboard",
    canvas: { width: 1920, height: 1080 },
    variables: [{ key: "leaders", defaultValue: initialData }],
    nodes: [
      // 1. Leaderboard Card (Rectangle + LayoutFrame Column [Hug, Hug])
      {
        id: "leaderboard-card",
        name: "Leaderboard Card Surface",
        type: "frame",
        x: 100,
        y: 150,
        width: 420,
        height: 0,
        style: {
          fillColor: "#18181B",
          borderRadius: 16,
          strokeColor: "#27272A",
          strokeWidth: 1,
          shadow: { color: "rgba(0,0,0,0.5)", blur: 24, x: 0, y: 12 },
        },
        layout: {
          mode: "flex-column",
          constraints: { widthMode: "fixed", heightMode: "hug" },
          gap: 12,
          padding: 16,
        },
        children: [
          // 2. Header Frame (Row)
          {
            id: "header-frame",
            name: "Header Frame",
            type: "frame",
            x: 0,
            y: 0,
            width: 388,
            height: 32,
            layout: {
              mode: "flex-row",
              justifyContent: "space-between",
              alignItems: "center",
            },
            children: [
              {
                id: "header-title",
                name: "Header Title",
                type: "text",
                x: 0,
                y: 0,
                width: 200,
                height: 24,
                text: "LIVE LEADERBOARD",
                style: { fontSize: 16, fontWeight: 700, textColor: "#FFFFFF" },
              } as PrimitiveTextNode,
              {
                id: "live-indicator",
                name: "Live Indicator",
                type: "shape",
                shapeType: "circle",
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                style: { fillColor: "#EF4444" },
              } as PrimitiveShapeNode,
            ],
          } as FrameNode,

          // 3. Data Repeater: The Multiplication Primitive
          {
            id: "leaderboard-repeater",
            name: "Leaderboard Repeater",
            type: "repeater",
            x: 0,
            y: 0,
            width: 388,
            height: 0,
            datasetBinding: "{{ leaders }}",
            keyField: "id", // Track identity by unique player ID
            maxItems: 5,   // Windowing limit
            layout: { gap: 8, constraints: { heightMode: "hug" } },
            itemTemplate: {
              // 4. Repeated Row Item (Rectangle Surface + LayoutFrame Row [Fill, Hug])
              id: "row-item",
              name: "Leaderboard Row",
              type: "frame",
              x: 0,
              y: 0,
              width: 388,
              height: 0,
              style: {
                fillColor: "#27272A",
                borderRadius: 10,
              },
              layout: {
                mode: "flex-row",
                constraints: { widthMode: "fill", heightMode: "hug" },
                alignItems: "center",
                gap: 10,
                padding: { top: 8, right: 12, bottom: 8, left: 10 },
              },
              children: [
                // Rank Badge (Rectangle + Text)
                {
                  id: "rank-badge",
                  name: "Rank Badge",
                  type: "frame",
                  x: 0,
                  y: 0,
                  width: 28,
                  height: 28,
                  style: { fillColor: "#3F3F46", borderRadius: 6 },
                  layout: { mode: "flex-row", justifyContent: "center", alignItems: "center" },
                  children: [
                    {
                      id: "rank-text",
                      name: "Rank Text",
                      type: "text",
                      x: 0,
                      y: 0,
                      width: 20,
                      height: 16,
                      text: "#{{ index + 1 }}",
                      style: { fontSize: 12, fontWeight: 700, textColor: "#E4E4E7" },
                    } as PrimitiveTextNode,
                  ],
                } as FrameNode,

                // Avatar (Circle + Media Image)
                {
                  id: "avatar-circle",
                  name: "Avatar Circle",
                  type: "shape",
                  shapeType: "circle",
                  x: 0,
                  y: 0,
                  width: 36,
                  height: 36,
                  children: [
                    {
                      id: "avatar-img",
                      name: "Avatar Image",
                      type: "media",
                      mediaType: "image",
                      src: "{{ item.avatarUrl }}",
                      x: 0,
                      y: 0,
                      width: 36,
                      height: 36,
                      objectFit: "cover",
                    } as MediaNode,
                  ],
                } as PrimitiveShapeNode,

                // User Info Column (LayoutFrame Column)
                {
                  id: "info-col",
                  name: "Info Column",
                  type: "frame",
                  x: 0,
                  y: 0,
                  width: 170,
                  height: 0,
                  layout: {
                    mode: "flex-column",
                    constraints: { widthMode: "fixed", heightMode: "hug" },
                    gap: 2,
                    padding: 0,
                  },
                  children: [
                    {
                      id: "user-name",
                      name: "Username",
                      type: "text",
                      x: 0,
                      y: 0,
                      width: 170,
                      height: 18,
                      text: "{{ item.username }}",
                      style: { fontSize: 14, fontWeight: 600, textColor: "#FFFFFF" },
                    } as PrimitiveTextNode,
                    {
                      id: "user-subtitle",
                      name: "Subtitle",
                      type: "text",
                      x: 0,
                      y: 0,
                      width: 170,
                      height: 0,
                      text: "{{ item.subtitle }}",
                      style: { fontSize: 11, textColor: "#A1A1AA", overflow: "wrap" },
                      layout: { constraints: { widthMode: "fixed", heightMode: "hug" } },
                    } as PrimitiveTextNode,
                  ],
                } as FrameNode,

                // Score Text
                {
                  id: "score-text",
                  name: "Score Text",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 70,
                  height: 16,
                  text: "{{ item.score }} pts",
                  style: { fontSize: 13, fontWeight: 700, textColor: "#F59E0B", textAlign: "right" },
                } as PrimitiveTextNode,

                // Trend Badge (Rectangle + Text)
                {
                  id: "trend-badge",
                  name: "Trend Badge",
                  type: "frame",
                  x: 0,
                  y: 0,
                  width: 30,
                  height: 20,
                  style: { fillColor: "rgba(16,185,129,0.2)", borderRadius: 4 },
                  layout: { mode: "flex-row", justifyContent: "center", alignItems: "center" },
                  children: [
                    {
                      id: "trend-text",
                      name: "Trend Text",
                      type: "text",
                      x: 0,
                      y: 0,
                      width: 24,
                      height: 14,
                      text: "{{ item.trend }}",
                      style: { fontSize: 11, fontWeight: 600, textColor: "#10B981" },
                    } as PrimitiveTextNode,
                  ],
                } as FrameNode,
              ],
            } as FrameNode,
          } as RepeaterNode,
        ],
      } as FrameNode,
    ],
    duration: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const samplePlayers = [
    { id: "p1", username: "Ada Lovelace", subtitle: "Grandmaster", score: 9850, trend: "+12", avatarUrl: "https://assets.clypra.io/p1.png" },
    { id: "p2", username: "Alan Turing", subtitle: "Cryptography Lead", score: 9420, trend: "+8", avatarUrl: "https://assets.clypra.io/p2.png" },
    { id: "p3", username: "Claude Shannon", subtitle: "Information Theorist", score: 8900, trend: "+24", avatarUrl: "https://assets.clypra.io/p3.png" },
    { id: "p4", username: "Grace Hopper", subtitle: "Compiler Pioneer", score: 8750, trend: "+4", avatarUrl: "https://assets.clypra.io/p4.png" },
    { id: "p5", username: "John von Neumann", subtitle: "Architecture Guru", score: 8600, trend: "+16", avatarUrl: "https://assets.clypra.io/p5.png" },
  ];

  it("Benchmark 1: Resolves full composite hierarchy for top 5 players with stable IDs", () => {
    const doc = createLiveLeaderboardDoc(samplePlayers);
    const bounds = layoutEngine.computeLayout(doc, { leaders: samplePlayers }).nodes;

    expect(bounds["leaderboard-card"]).toBeDefined();
    expect(bounds["header-frame"]).toBeDefined();
    expect(bounds["leaderboard-repeater"]).toBeDefined();

    // Verify all 5 player rows exist with stable key IDs
    samplePlayers.forEach((p) => {
      const rowId = `leaderboard-repeater-item-${p.id}`;
      const rankTextId = `${rowId}-rank-text`;
      const nameId = `${rowId}-user-name`;
      const scoreId = `${rowId}-score-text`;

      expect(bounds[rowId]).toBeDefined();
      expect(bounds[rankTextId]).toBeDefined();
      expect(bounds[nameId]).toBeDefined();
      expect(bounds[scoreId]).toBeDefined();
    });

    // Top player is strictly above 2nd player
    expect(bounds["leaderboard-repeater-item-p2"].y).toBeGreaterThan(bounds["leaderboard-repeater-item-p1"].y);
  });

  it("Benchmark 2: Real-time Re-ranking preserves key identity across sort operations", () => {
    const doc = createLiveLeaderboardDoc(samplePlayers);

    // Initial state: p1 is at top (rank 1), p3 is at rank 3
    const initialBounds = layoutEngine.computeLayout(doc, { leaders: samplePlayers }).nodes;
    const initialP1Y = initialBounds["leaderboard-repeater-item-p1"].y;
    const initialP3Y = initialBounds["leaderboard-repeater-item-p3"].y;

    expect(initialP3Y).toBeGreaterThan(initialP1Y);

    // Claude Shannon (p3) scores a massive win (+2000 pts) and jumps to rank 1
    const rerankedPlayers = [
      { ...samplePlayers[2], score: 10900 }, // p3 now #1
      samplePlayers[0],                       // p1 now #2
      samplePlayers[1],                       // p2 now #3
      samplePlayers[3],                       // p4 now #4
      samplePlayers[4],                       // p5 now #5
    ];

    const rerankedBounds = layoutEngine.computeLayout(doc, { leaders: rerankedPlayers }).nodes;

    // Stable Key Identity Assertion:
    // p3 is now at top position (where p1 was), p1 shifted down to position 2
    expect(rerankedBounds["leaderboard-repeater-item-p3"].y).toBe(initialP1Y);
    expect(rerankedBounds["leaderboard-repeater-item-p1"].y).toBeGreaterThan(initialP1Y);
  });

  it("Benchmark 3: Variable Height Subtitle automatically expands row and shifts subsequent items", () => {
    const doc = createLiveLeaderboardDoc(samplePlayers);

    // Player 2 gets a long multi-line description
    const playersWithLongBio = [
      samplePlayers[0],
      {
        ...samplePlayers[1],
        subtitle: "Director of the Computing Machine Laboratory & Theoretical Research Institute", // multi-line wrap
      },
      samplePlayers[2],
      samplePlayers[3],
      samplePlayers[4],
    ];

    const bounds = layoutEngine.computeLayout(doc, { leaders: playersWithLongBio }).nodes;

    const row1 = bounds["leaderboard-repeater-item-p1"];
    const row2 = bounds["leaderboard-repeater-item-p2"];
    const row3 = bounds["leaderboard-repeater-item-p3"];

    // Row 2 is taller than standard Row 1
    expect(row2.height).toBeGreaterThan(row1.height);

    // Row 3 starts exactly at row2.y + row2.height + gap(8) with zero overlap
    expect(row3.y).toBe(row2.y + row2.height + 8);
  });

  it("Benchmark 4: Stream Add/Drop lifecycle clamps strictly to maxItems: 5", () => {
    // 10 players in telemetry feed
    const tenPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: `player-${i}`,
      username: `Contender ${i + 1}`,
      subtitle: `Division ${i % 3 + 1}`,
      score: 5000 - i * 200,
      trend: "+5",
      avatarUrl: `https://assets.clypra.io/p${i}.png`,
    }));

    const doc = createLiveLeaderboardDoc(tenPlayers);
    const bounds = layoutEngine.computeLayout(doc, { leaders: tenPlayers }).nodes;

    // Only top 5 instantiated
    expect(bounds["leaderboard-repeater-item-player-0"]).toBeDefined();
    expect(bounds["leaderboard-repeater-item-player-4"]).toBeDefined();
    expect(bounds["leaderboard-repeater-item-player-5"]).toBeUndefined();
    expect(bounds["leaderboard-repeater-item-player-9"]).toBeUndefined();
  });
});
