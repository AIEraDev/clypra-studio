import { NodeRegistry } from "@clypra-studio/engine";
import type { StackNode } from "./types";

let nodeCounter = 0;

export function createStackNode(type: string, params?: Record<string, unknown>): StackNode {
  const registry = NodeRegistry.createDefault();
  const def = registry.getDefinition(type);
  const defaults = def?.defaultParams ?? {};
  return {
    id: `node-${++nodeCounter}-${Date.now()}`,
    type,
    params: { ...defaults, ...params },
  };
}

export function duplicateStack(nodes: StackNode[]): StackNode[] {
  return nodes.map((n) => ({ ...n, id: createStackNode(n.type, n.params).id, params: { ...n.params } }));
}

export function moveStackNode(nodes: StackNode[], fromIndex: number, toIndex: number): StackNode[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= nodes.length || toIndex >= nodes.length) {
    return nodes;
  }
  const next = [...nodes];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function updateNodeParams(nodes: StackNode[], nodeId: string, params: Record<string, unknown>): StackNode[] {
  return nodes.map((n) => (n.id === nodeId ? { ...n, params: { ...n.params, ...params } } : n));
}

export function removeStackNode(nodes: StackNode[], nodeId: string): StackNode[] {
  return nodes.filter((n) => n.id !== nodeId);
}

export function addStackNode(nodes: StackNode[], type: string): StackNode[] {
  return [...nodes, createStackNode(type)];
}

/** Keyword-based stack generator — builds CapCut-style multi-node looks locally */
export function generateStackFromPrompt(prompt: string): { name: string; nodes: StackNode[] } {
  const lower = prompt.toLowerCase();
  const nodes: StackNode[] = [];

  const wantsBlur = /blur|bokeh|soft|dream|haze|fog|airy/.test(lower);
  const wantsBright = /bright|light|glow|lift|exposure|golden|warm/.test(lower);
  const wantsDark = /dark|moody|shadow|dim|noir|underexposed/.test(lower);
  const wantsContrast = /contrast|punch|bold|cinematic|dramatic|vivid|pop|blockbuster/.test(lower);
  const wantsMuted = /muted|fade|pastel|washed/.test(lower);
  const wantsVintage = /vintage|retro|film|70s|polaroid|aged/.test(lower);
  const wantsSepia = /sepia|amber|golden hour/.test(lower);
  const wantsCool = /cool|cold|blue|teal|cyan|minimal/.test(lower);
  const wantsWarm = /warm|orange|sunset|skin|portrait/.test(lower);
  const wantsSaturated = /saturat|vivid|vibrant|colorful|pop|bold/.test(lower);
  const wantsDesaturated = /desaturat|muted color|mono|black.?white|bw|grayscale/.test(lower);
  const wantsVignette = /vignette|edge|focus|cinema|movie/.test(lower);
  const wantsTealOrange = /teal.?orange|hollywood|blockbuster/.test(lower);

  if (wantsTealOrange) {
    nodes.push(createStackNode("Temperature", { temperature: -0.15 }));
    nodes.push(createStackNode("Saturation", { saturation: 0.2 }));
    nodes.push(createStackNode("Contrast", { contrast: 0.22 }));
    nodes.push(createStackNode("Vignette", { vignette: 0.4 }));
  } else {
    if (wantsWarm) nodes.push(createStackNode("Temperature", { temperature: 0.3 }));
    else if (wantsCool) nodes.push(createStackNode("Temperature", { temperature: -0.25 }));

    if (wantsBright) nodes.push(createStackNode("Brightness", { brightness: 0.15 }));
    else if (wantsDark) nodes.push(createStackNode("Brightness", { brightness: -0.12 }));

    if (wantsSaturated) nodes.push(createStackNode("Saturation", { saturation: 0.35 }));
    else if (wantsDesaturated) nodes.push(createStackNode("Grayscale", { grayscale: /mono|black.?white|bw/.test(lower) ? 1.0 : 0.5 }));
    else if (wantsMuted) nodes.push(createStackNode("Saturation", { saturation: -0.15 }));

    if (wantsContrast) nodes.push(createStackNode("Contrast", { contrast: 0.25 }));
    else if (wantsMuted) nodes.push(createStackNode("Contrast", { contrast: -0.08 }));

    if (wantsVintage || wantsSepia) nodes.push(createStackNode("Sepia", { sepia: wantsSepia ? 0.5 : 0.35 }));

    if (wantsVignette) nodes.push(createStackNode("Vignette", { vignette: wantsDark ? 0.55 : 0.35 }));

    if (wantsBlur) nodes.push(createStackNode("GaussianBlur", { blur: /heavy|strong|bokeh|dream/.test(lower) ? 14 : 6 }));
  }

  if (nodes.length === 0) {
    nodes.push(createStackNode("Saturation", { saturation: 0.15 }));
    nodes.push(createStackNode("Contrast", { contrast: 0.1 }));
    nodes.push(createStackNode("Brightness", { brightness: 0.05 }));
  }

  const name =
    prompt.length > 40 ? `${prompt.slice(0, 37).trim()}…` : prompt.trim() || "Custom Look";

  return { name, nodes };
}

export function stackToPresetPayload(nodes: StackNode[]) {
  return nodes.map(({ type, params }) => ({ type, params }));
}
