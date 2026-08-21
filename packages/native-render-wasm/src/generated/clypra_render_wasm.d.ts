/* tslint:disable */
/* eslint-disable */

/**
 * Handle to the initialised WebGPU compositor.
 *
 * Do not construct directly. Use `create_renderer()`.
 */
export class WasmRenderer {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Returns a JSON string describing the GPU adapter the browser selected.
     *
     * ```ts
     * console.log(JSON.parse(renderer.adapter_info()));
     * // { name: "Apple M1", backend: "Metal", deviceType: "IntegratedGpu", ... }
     * ```
     */
    adapter_info(): string;
    /**
     * Render a single frame.
     *
     * `request_json` — a JSON-serialised `FrameRequest` (same contract as
     * `POST /v1/render/frame` on the native daemon).
     *
     * Returns raw PNG bytes as a `Uint8Array`.
     */
    render_frame(request_json: string): Promise<Uint8Array>;
}

/**
 * Async factory — the entry point Studio uses instead of `new WasmRenderer()`.
 *
 * Must be called after `await init()` (the wasm-pack generated `init()`
 * that sets up WASM linear memory). Calling this before `init()` produces
 * a "memory access out of bounds" panic.
 *
 * ```ts
 * import init, { create_renderer } from "@clypra/render-wasm";
 * await init();
 * const renderer = await create_renderer();
 * ```
 */
export function create_renderer(): Promise<WasmRenderer>;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmrenderer_free: (a: number, b: number) => void;
    readonly create_renderer: () => any;
    readonly wasmrenderer_adapter_info: (a: number) => [number, number];
    readonly wasmrenderer_render_frame: (a: number, b: number, c: number) => any;
    readonly wasm_bindgen__convert__closures_____invoke__h43e9943cf2c4f3e9: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen__convert__closures_____invoke__h6890542ec23ad306: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h28ca0ccefdd47645: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h4a9ffdf99e28b405: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__hf578ab18b69ee5d0: (a: number, b: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
