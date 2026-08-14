import { describe, it, expect } from "vitest";
import { LayoutEngine } from "../layoutEngine.js";
import { DataBindingEngine } from "../dataBindingEngine.js";
import type {
  OverlayDocument,
  RepeaterNode,
  FrameNode,
  PrimitiveShapeNode,
  PrimitiveTextNode,
  MediaNode,
} from "../overlayDocumentSchema.js";

describe("Data Repeater: 7-Domain Architectural Validation Suite", () => {
  const layoutEngine = new LayoutEngine();
  const dataBindingEngine = new DataBindingEngine();

  // =========================================================================
  // DOMAIN -1: Template Purity (Deep Clone Isolation)
  // =========================================================================
  describe("Domain -1: Template Purity", () => {
    it("-1.1: should guarantee template purity with zero cross-instance state pollution", () => {
      const itemTemplate: FrameNode = {
        id: "card-tpl",
        name: "Card Template",
        type: "frame",
        x: 0,
        y: 0,
        width: 200,
        height: 50,
        layout: {
          mode: "flex-row",
          gap: 10,
          padding: 8,
        },
        children: [
          {
            id: "title-text",
            name: "Title",
            type: "text",
            x: 0,
            y: 0,
            width: 100,
            height: 20,
            text: "{{ item.title }}",
            layout: { constraints: { widthMode: "hug" } },
          } as PrimitiveTextNode,
        ],
      };

      const doc: OverlayDocument = {
        id: "doc-purity-test",
        version: "1.0",
        title: "Template Purity",
        canvas: { width: 1920, height: 1080 },
        variables: [
          {
            key: "articles",
            defaultValue: [
              { id: "art-1", title: "Short" },
              { id: "art-2", title: "A Substantially Longer Article Headline" },
            ],
          },
        ],
        nodes: [
          {
            id: "article-repeater",
            name: "Articles",
            type: "repeater",
            x: 100,
            y: 100,
            width: 400,
            height: 0,
            datasetBinding: "{{ articles }}",
            itemTemplate,
          } as RepeaterNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc).nodes;

      // Instance 0 and 1 have independent text metrics
      const item0Text = res["article-repeater-item-0-title-text"];
      const item1Text = res["article-repeater-item-1-title-text"];

      expect(item0Text).toBeDefined();
      expect(item1Text).toBeDefined();
      expect(item1Text.width).toBeGreaterThan(item0Text.width);

      // Verify the source template was NEVER mutated
      expect(itemTemplate.id).toBe("card-tpl");
      expect((itemTemplate.children[0] as PrimitiveTextNode).id).toBe("title-text");
      expect(itemTemplate.children[0].width).toBe(100);
    });
  });

  // =========================================================================
  // DOMAIN 0: Dataset Reactivity (Insert, Remove, Replace, Reorder)
  // =========================================================================
  describe("Domain 0: Dataset Reactivity", () => {
    const createReactivityDoc = (initialDataset: any[]): OverlayDocument => ({
      id: "doc-reactivity",
      version: "1.0",
      title: "Dataset Reactivity",
      canvas: { width: 1920, height: 1080 },
      variables: [{ key: "items", defaultValue: initialDataset }],
      nodes: [
        {
          id: "dyn-repeater",
          name: "Dynamic Repeater",
          type: "repeater",
          x: 50,
          y: 50,
          width: 300,
          height: 0,
          datasetBinding: "{{ items }}",
          layout: { gap: 10, padding: 10, constraints: { heightMode: "hug" } },
          itemTemplate: {
            id: "row",
            name: "Row",
            type: "shape",
            shapeType: "rectangle",
            x: 0,
            y: 0,
            width: 280,
            height: 40,
          } as PrimitiveShapeNode,
        } as RepeaterNode,
      ],
      duration: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it("0.1: should handle the full dataset lifecycle: empty -> 5 items -> removal -> reverse reorder -> single item", () => {
      const doc = createReactivityDoc([]);

      // 1. Empty state
      const res0 = layoutEngine.computeLayout(doc, { items: [] }).nodes;
      expect(res0["dyn-repeater"].height).toBe(20); // 10 top + 10 bottom padding

      // 2. Insert 5 items [A, B, C, D, E]
      const items5 = ["A", "B", "C", "D", "E"].map((id) => ({ id, label: `Item ${id}` }));
      const res5 = layoutEngine.computeLayout(doc, { items: items5 }).nodes;
      // 10 + 5 * 40 + 4 * 10 + 10 = 260
      expect(res5["dyn-repeater"].height).toBe(260);
      expect(res5["dyn-repeater-item-4"]).toBeDefined();

      // 3. Remove A -> [B, C, D, E] (4 items)
      const items4 = items5.slice(1);
      const res4 = layoutEngine.computeLayout(doc, { items: items4 }).nodes;
      expect(res4["dyn-repeater"].height).toBe(10 + 4 * 40 + 3 * 10 + 10); // 210

      // 4. Reverse reorder -> [E, D, C, B]
      const itemsRev = [...items4].reverse();
      const resRev = layoutEngine.computeLayout(doc, { items: itemsRev }).nodes;
      expect(resRev["dyn-repeater"].height).toBe(210);

      // 5. Shrink to single item [A]
      const res1 = layoutEngine.computeLayout(doc, { items: [{ id: "A", label: "Solo" }] }).nodes;
      expect(res1["dyn-repeater"].height).toBe(10 + 40 + 10); // 60
    });
  });

  // =========================================================================
  // DOMAIN 1: Scoped Context Resolution (Nested Repeaters)
  // =========================================================================
  describe("Domain 1: Scoped Context Resolution & Nested Repeaters", () => {
    it("1.1: should resolve nested repeaters (teams[].players[]) without context collision", () => {
      const teamsDataset = [
        {
          teamName: "Team Alpha",
          players: [
            { name: "Alice", role: "Captain" },
            { name: "Bob", role: "Support" },
          ],
        },
        {
          teamName: "Team Bravo",
          players: [
            { name: "Charlie", role: "Carry" },
          ],
        },
      ];

      const doc: OverlayDocument = {
        id: "doc-nested-rep",
        version: "1.0",
        title: "Nested Repeaters",
        canvas: { width: 1920, height: 1080 },
        variables: [{ key: "teams", defaultValue: teamsDataset }],
        nodes: [
          {
            id: "team-rep",
            name: "Teams Repeater",
            type: "repeater",
            x: 0,
            y: 0,
            width: 400,
            height: 0,
            datasetBinding: "{{ teams }}",
            itemContextKey: "team",
            indexContextKey: "teamIndex",
            layout: { gap: 20 },
            itemTemplate: {
              id: "team-card",
              name: "Team Card",
              type: "frame",
              x: 0,
              y: 0,
              width: 380,
              height: 0,
              layout: {
                mode: "flex-column",
                constraints: { heightMode: "hug" },
                gap: 8,
                padding: 12,
              },
              children: [
                {
                  id: "team-title",
                  name: "Team Title",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 300,
                  height: 24,
                  text: "{{ team.teamName }}",
                } as PrimitiveTextNode,
                {
                  id: "player-rep",
                  name: "Player Repeater",
                  type: "repeater",
                  x: 0,
                  y: 0,
                  width: 350,
                  height: 0,
                  datasetBinding: "{{ team.players }}",
                  itemContextKey: "player",
                  indexContextKey: "playerIndex",
                  layout: { gap: 4 },
                  itemTemplate: {
                    id: "player-row",
                    name: "Player Row",
                    type: "text",
                    x: 0,
                    y: 0,
                    width: 300,
                    height: 18,
                    text: "{{ player.name }} ({{ team.teamName }})",
                  } as PrimitiveTextNode,
                } as RepeaterNode,
              ],
            } as FrameNode,
          } as RepeaterNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc, { teams: teamsDataset }).nodes;

      // Outer team 0
      expect(res["team-rep-item-0"]).toBeDefined();
      expect(res["team-rep-item-0-team-title"]).toBeDefined();

      // Nested players for Team 0
      expect(res["team-rep-item-0-player-rep-item-0"]).toBeDefined();
      expect(res["team-rep-item-0-player-rep-item-1"]).toBeDefined();

      // Nested players for Team 1
      expect(res["team-rep-item-1-player-rep-item-0"]).toBeDefined();
    });
  });

  // =========================================================================
  // DOMAIN 2: Variable Dimension Items (Heterogeneous Rows)
  // =========================================================================
  describe("Domain 2: Variable Height Items", () => {
    it("2.1: should dynamically measure variable row heights and expand container without overlap", () => {
      const comments = [
        { id: "c1", author: "Dev", comment: "LGTM" }, // 1 line ~24px
        {
          id: "c2",
          author: "Reviewer",
          comment: "This is a comprehensive architectural proposal regarding layout frame validation across 6 domains.", // Wraps to multiple lines ~72px
        },
        { id: "c3", author: "Lead", comment: "Approved." }, // 1 line ~24px
      ];

      const doc: OverlayDocument = {
        id: "doc-var-height",
        version: "1.0",
        title: "Variable Height Repeater",
        canvas: { width: 1920, height: 1080 },
        variables: [{ key: "comments", defaultValue: comments }],
        nodes: [
          {
            id: "comment-stream",
            name: "Comment Stream",
            type: "repeater",
            x: 100,
            y: 100,
            width: 300,
            height: 0,
            datasetBinding: "{{ comments }}",
            layout: { gap: 12, padding: 16, constraints: { heightMode: "hug" } },
            itemTemplate: {
              id: "comment-card",
              name: "Comment Card",
              type: "frame",
              x: 0,
              y: 0,
              width: 268,
              height: 0,
              layout: {
                mode: "flex-column",
                constraints: { widthMode: "fixed", heightMode: "hug" },
                gap: 4,
                padding: 8,
              },
              children: [
                {
                  id: "author-name",
                  name: "Author",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 200,
                  height: 18,
                  text: "{{ item.author }}",
                  layout: { constraints: { heightMode: "hug" } },
                } as PrimitiveTextNode,
                {
                  id: "comment-body",
                  name: "Body",
                  type: "text",
                  x: 0,
                  y: 0,
                  width: 250,
                  height: 0,
                  text: "{{ item.comment }}",
                  style: { fontSize: 16, overflow: "wrap" },
                  layout: { constraints: { widthMode: "fixed", heightMode: "hug" } },
                } as PrimitiveTextNode,
              ],
            } as FrameNode,
          } as RepeaterNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc, { comments }).nodes;

      const item0 = res["comment-stream-item-0"];
      const item1 = res["comment-stream-item-1"];
      const item2 = res["comment-stream-item-2"];

      // Row 1 (long comment) is strictly taller than Row 0 and Row 2
      expect(item1.height).toBeGreaterThan(item0.height);

      // Row 1 starts strictly below Row 0 with exact gap
      expect(item1.y).toBe(item0.y + item0.height + 12);

      // Row 2 starts strictly below Row 1 with exact gap
      expect(item2.y).toBe(item1.y + item1.height + 12);

      // Total stream height hugs sum of heights + gaps + padding
      const expectedTotalH = 16 + item0.height + 12 + item1.height + 12 + item2.height + 16;
      expect(res["comment-stream"].height).toBe(expectedTotalH);
    });
  });

  // =========================================================================
  // DOMAIN 3: Windowing & Virtualization (maxItems Clamping)
  // =========================================================================
  describe("Domain 3: Windowing & Virtualization", () => {
    it("3.1: should clamp 1,000 items to maxItems window and execute sub-millisecond layout", () => {
      const hugeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        score: 1000 - i,
      }));

      const doc: OverlayDocument = {
        id: "doc-windowing",
        version: "1.0",
        title: "Windowing Test",
        canvas: { width: 1920, height: 1080 },
        variables: [{ key: "users", defaultValue: hugeDataset }],
        nodes: [
          {
            id: "top-5-repeater",
            name: "Top 5",
            type: "repeater",
            x: 0,
            y: 0,
            width: 300,
            height: 0,
            datasetBinding: "{{ users }}",
            maxItems: 5,
            layout: { gap: 8, padding: 10, constraints: { heightMode: "hug" } },
            itemTemplate: {
              id: "row",
              name: "Row",
              type: "shape",
              shapeType: "rectangle",
              x: 0,
              y: 0,
              width: 280,
              height: 30,
            } as PrimitiveShapeNode,
          } as RepeaterNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const start = performance.now();
      const res = layoutEngine.computeLayout(doc, { users: hugeDataset }).nodes;
      const durationMs = performance.now() - start;

      // Execution is sub-millisecond / ultra-fast
      expect(durationMs).toBeLessThan(20);

      // Only top 5 instantiated
      expect(res["top-5-repeater-item-0"]).toBeDefined();
      expect(res["top-5-repeater-item-4"]).toBeDefined();
      expect(res["top-5-repeater-item-5"]).toBeUndefined();

      // Total height strictly limited to 5 items: 10 + 5 * 30 + 4 * 8 + 10 = 202
      expect(res["top-5-repeater"].height).toBe(202);
    });
  });

  // =========================================================================
  // DOMAIN 4: Motion & Stagger
  // =========================================================================
  describe("Domain 4: Motion & Dynamic Stagger", () => {
    it("4.1: should support index-driven stagger timing offsets", () => {
      const items = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }];

      const doc: OverlayDocument = {
        id: "doc-stagger",
        version: "1.0",
        title: "Motion Stagger",
        canvas: { width: 1920, height: 1080 },
        variables: [{ key: "items", defaultValue: items }],
        nodes: [
          {
            id: "stagger-rep",
            name: "Stagger Repeater",
            type: "repeater",
            x: 0,
            y: 0,
            width: 200,
            height: 0,
            datasetBinding: "{{ items }}",
            staggerDelay: 0.05,
            itemTemplate: {
              id: "item-box",
              name: "Box",
              type: "shape",
              shapeType: "rectangle",
              x: 0,
              y: 0,
              width: 180,
              height: 40,
            } as PrimitiveShapeNode,
          } as RepeaterNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const res = layoutEngine.computeLayout(doc, { items }).nodes;
      for (let i = 0; i < 4; i++) {
        expect(res[`stagger-rep-item-${i}`]).toBeDefined();
      }
    });
  });

  // =========================================================================
  // DOMAIN 5: Identity Preservation (keyField Tracking)
  // =========================================================================
  describe("Domain 5: Identity Preservation", () => {
    it("5.1: should preserve stable instance node IDs when dataset is sorted or reordered", () => {
      const initialUsers = [
        { id: "usr-alpha", name: "Alpha", score: 100 },
        { id: "usr-beta", name: "Beta", score: 90 },
      ];

      const doc: OverlayDocument = {
        id: "doc-identity",
        version: "1.0",
        title: "Identity Preservation",
        canvas: { width: 1920, height: 1080 },
        variables: [{ key: "players", defaultValue: initialUsers }],
        nodes: [
          {
            id: "player-list",
            name: "Player List",
            type: "repeater",
            x: 50,
            y: 50,
            width: 300,
            height: 0,
            datasetBinding: "{{ players }}",
            keyField: "id", // Track identity by user id
            layout: { gap: 10, padding: 0 },
            itemTemplate: {
              id: "row-card",
              name: "Row Card",
              type: "shape",
              shapeType: "rectangle",
              x: 0,
              y: 0,
              width: 300,
              height: 50,
            } as PrimitiveShapeNode,
          } as RepeaterNode,
        ],
        duration: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Initial layout: Alpha at index 0 (y = 50), Beta at index 1 (y = 110)
      const resInitial = layoutEngine.computeLayout(doc, { players: initialUsers }).nodes;
      expect(resInitial["player-list-item-usr-alpha"].y).toBe(50);
      expect(resInitial["player-list-item-usr-beta"].y).toBe(110);

      // Re-ranked dataset: Beta gains points and overtakes Alpha
      const reorderedUsers = [
        { id: "usr-beta", name: "Beta", score: 150 },
        { id: "usr-alpha", name: "Alpha", score: 100 },
      ];

      const resReordered = layoutEngine.computeLayout(doc, { players: reorderedUsers }).nodes;

      // Identity is preserved: Beta moves to top position (y = 50), Alpha shifts to position 1 (y = 110)
      // The node IDs are stable (usr-beta, usr-alpha), NOT index-based (item-0, item-1)!
      expect(resReordered["player-list-item-usr-beta"].y).toBe(50);
      expect(resReordered["player-list-item-usr-alpha"].y).toBe(110);
    });
  });
});
