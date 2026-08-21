/* @ts-self-types="./clypra_render_wasm.d.ts" */

//#region exports

/**
 * Handle to the initialised WebGPU compositor.
 *
 * Do not construct directly. Use `create_renderer()`.
 */
export class WasmRenderer {
    constructor() {
        throw new Error('cannot invoke `new` directly');
    }
    static __wrap(ptr) {
        const obj = Object.create(WasmRenderer.prototype);
        obj.__wbg_ptr = ptr;
        WasmRendererFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmRendererFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmrenderer_free(ptr, 0);
    }
    /**
     * Returns a JSON string describing the GPU adapter the browser selected.
     *
     * ```ts
     * console.log(JSON.parse(renderer.adapter_info()));
     * // { name: "Apple M1", backend: "Metal", deviceType: "IntegratedGpu", ... }
     * ```
     * @returns {string}
     */
    adapter_info() {
        let deferred1_0;
        let deferred1_1;
        try {
            if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
            _assertNum(this.__wbg_ptr);
            const ret = wasm.wasmrenderer_adapter_info(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Render a single frame.
     *
     * `request_json` — a JSON-serialised `FrameRequest` (same contract as
     * `POST /v1/render/frame` on the native daemon).
     *
     * Returns raw PNG bytes as a `Uint8Array`.
     * @param {string} request_json
     * @returns {Promise<Uint8Array>}
     */
    render_frame(request_json) {
        if (this.__wbg_ptr == 0) throw new Error('Attempt to use a moved value');
        _assertNum(this.__wbg_ptr);
        const ptr0 = passStringToWasm0(request_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmrenderer_render_frame(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
}
if (Symbol.dispose) WasmRenderer.prototype[Symbol.dispose] = WasmRenderer.prototype.free;

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
 * @returns {Promise<WasmRenderer>}
 */
export function create_renderer() {
    const ret = wasm.create_renderer();
    return ret;
}

//#endregion

//#region wasm imports
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Window_412fe051c1aa1519: function() { return logError(function (arg0) {
            const ret = arg0.Window;
            return ret;
        }, arguments); },
        __wbg_WorkerGlobalScope_349300f9b277afe1: function() { return logError(function (arg0) {
            const ret = arg0.WorkerGlobalScope;
            return ret;
        }, arguments); },
        __wbg___wbindgen_boolean_get_c9c83ebd41b34df3: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            if (!isLikeNone(ret)) {
                _assertBoolean(ret);
            }
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_a57024b9c6e4a48b: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_function_5e4570eb24ffa122: function(arg0) {
            const ret = typeof(arg0) === 'function';
            _assertBoolean(ret);
            return ret;
        },
        __wbg___wbindgen_is_null_7d13f41e1a2d5140: function(arg0) {
            const ret = arg0 === null;
            _assertBoolean(ret);
            return ret;
        },
        __wbg___wbindgen_is_object_a2790eb24c211ea0: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            _assertBoolean(ret);
            return ret;
        },
        __wbg___wbindgen_is_undefined_6cff064c44e0d823: function(arg0) {
            const ret = arg0 === undefined;
            _assertBoolean(ret);
            return ret;
        },
        __wbg___wbindgen_number_get_136b9679cab35cfb: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            if (!isLikeNone(ret)) {
                _assertNum(ret);
            }
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_d154f1e671052120: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_bb96b2010945f0bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_be22cc64ae6946a0: function() { return logError(function (arg0) {
            arg0._wbg_cb_unref();
        }, arguments); },
        __wbg_activeTexture_8e65ac2e8d488478: function() { return logError(function (arg0, arg1) {
            arg0.activeTexture(arg1 >>> 0);
        }, arguments); },
        __wbg_activeTexture_fd6262686afdbe2f: function() { return logError(function (arg0, arg1) {
            arg0.activeTexture(arg1 >>> 0);
        }, arguments); },
        __wbg_attachShader_26751604f00d1f1b: function() { return logError(function (arg0, arg1, arg2) {
            arg0.attachShader(arg1, arg2);
        }, arguments); },
        __wbg_attachShader_61baa58641ea664a: function() { return logError(function (arg0, arg1, arg2) {
            arg0.attachShader(arg1, arg2);
        }, arguments); },
        __wbg_beginComputePass_097033d61ef8af0f: function() { return logError(function (arg0, arg1) {
            const ret = arg0.beginComputePass(arg1);
            return ret;
        }, arguments); },
        __wbg_beginQuery_444a51812fdbf958: function() { return logError(function (arg0, arg1, arg2) {
            arg0.beginQuery(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_beginRenderPass_34a015f8265125ac: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.beginRenderPass(arg1);
            return ret;
        }, arguments); },
        __wbg_bindAttribLocation_1e182a50e1556784: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.bindAttribLocation(arg1, arg2 >>> 0, getStringFromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_bindAttribLocation_9cc5ab15df1d042d: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.bindAttribLocation(arg1, arg2 >>> 0, getStringFromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_bindBufferRange_5a8d28ef662d8746: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.bindBufferRange(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
        }, arguments); },
        __wbg_bindBuffer_1fb12d083d2a22af: function() { return logError(function (arg0, arg1, arg2) {
            arg0.bindBuffer(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_bindBuffer_31cb159ab5dc5ba7: function() { return logError(function (arg0, arg1, arg2) {
            arg0.bindBuffer(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_bindFramebuffer_32ce672324ce8a16: function() { return logError(function (arg0, arg1, arg2) {
            arg0.bindFramebuffer(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_bindFramebuffer_e620067056f9316f: function() { return logError(function (arg0, arg1, arg2) {
            arg0.bindFramebuffer(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_bindRenderbuffer_765cffe23b9c36f7: function() { return logError(function (arg0, arg1, arg2) {
            arg0.bindRenderbuffer(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_bindRenderbuffer_9b313332bd7aa049: function() { return logError(function (arg0, arg1, arg2) {
            arg0.bindRenderbuffer(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_bindSampler_28b0a4c34c6f96d4: function() { return logError(function (arg0, arg1, arg2) {
            arg0.bindSampler(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_bindTexture_4c54ffb64c33564f: function() { return logError(function (arg0, arg1, arg2) {
            arg0.bindTexture(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_bindTexture_6fe86367f6be8f59: function() { return logError(function (arg0, arg1, arg2) {
            arg0.bindTexture(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_bindVertexArrayOES_96a4898652eac0d8: function() { return logError(function (arg0, arg1) {
            arg0.bindVertexArrayOES(arg1);
        }, arguments); },
        __wbg_bindVertexArray_0185d931d681d806: function() { return logError(function (arg0, arg1) {
            arg0.bindVertexArray(arg1);
        }, arguments); },
        __wbg_blendColor_402572bc445d3ac3: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.blendColor(arg1, arg2, arg3, arg4);
        }, arguments); },
        __wbg_blendColor_af92968fedc595b1: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.blendColor(arg1, arg2, arg3, arg4);
        }, arguments); },
        __wbg_blendEquationSeparate_5ab35e46e7f48717: function() { return logError(function (arg0, arg1, arg2) {
            arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
        }, arguments); },
        __wbg_blendEquationSeparate_9ad084e8266b8e3c: function() { return logError(function (arg0, arg1, arg2) {
            arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
        }, arguments); },
        __wbg_blendEquation_4bab539169e7e865: function() { return logError(function (arg0, arg1) {
            arg0.blendEquation(arg1 >>> 0);
        }, arguments); },
        __wbg_blendEquation_502ed4c6af5bf8ee: function() { return logError(function (arg0, arg1) {
            arg0.blendEquation(arg1 >>> 0);
        }, arguments); },
        __wbg_blendFuncSeparate_2e4d259caaba517e: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        }, arguments); },
        __wbg_blendFuncSeparate_66688b15ecc6529c: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        }, arguments); },
        __wbg_blendFunc_b7f382e97db2fd5b: function() { return logError(function (arg0, arg1, arg2) {
            arg0.blendFunc(arg1 >>> 0, arg2 >>> 0);
        }, arguments); },
        __wbg_blendFunc_d908118bbb181928: function() { return logError(function (arg0, arg1, arg2) {
            arg0.blendFunc(arg1 >>> 0, arg2 >>> 0);
        }, arguments); },
        __wbg_blitFramebuffer_20b32de88a3097b1: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
            arg0.blitFramebuffer(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
        }, arguments); },
        __wbg_bufferData_1dd2939db2d88d82: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
        }, arguments); },
        __wbg_bufferData_69a44ade0864ba2b: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
        }, arguments); },
        __wbg_bufferData_6c10d3e07ec9a2a9: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
        }, arguments); },
        __wbg_bufferData_d359d1c797b8e8b7: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
        }, arguments); },
        __wbg_bufferSubData_4f6063d50303b61d: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
        }, arguments); },
        __wbg_bufferSubData_64b69f468a0d3048: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
        }, arguments); },
        __wbg_buffer_78291c0e094ccf99: function() { return logError(function (arg0) {
            const ret = arg0.buffer;
            return ret;
        }, arguments); },
        __wbg_call_35dba3c747ad7521: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_clearBuffer_b956d6f74b685656: function() { return logError(function (arg0, arg1, arg2) {
            arg0.clearBuffer(arg1, arg2);
        }, arguments); },
        __wbg_clearBuffer_dbbf872f42431e3b: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.clearBuffer(arg1, arg2, arg3);
        }, arguments); },
        __wbg_clearBufferfv_ccbb43fb098f1912: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.clearBufferfv(arg1 >>> 0, arg2, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_clearBufferiv_8b1c68299632478f: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.clearBufferiv(arg1 >>> 0, arg2, getArrayI32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_clearBufferuiv_cd72147d09d432e8: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.clearBufferuiv(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_clearDepth_887000180cc9eb2e: function() { return logError(function (arg0, arg1) {
            arg0.clearDepth(arg1);
        }, arguments); },
        __wbg_clearDepth_c4897278afd894a9: function() { return logError(function (arg0, arg1) {
            arg0.clearDepth(arg1);
        }, arguments); },
        __wbg_clearStencil_3d39149452a2f872: function() { return logError(function (arg0, arg1) {
            arg0.clearStencil(arg1);
        }, arguments); },
        __wbg_clearStencil_96978923f9c6fb1f: function() { return logError(function (arg0, arg1) {
            arg0.clearStencil(arg1);
        }, arguments); },
        __wbg_clear_20f7614cd20df101: function() { return logError(function (arg0, arg1) {
            arg0.clear(arg1 >>> 0);
        }, arguments); },
        __wbg_clear_332f205d7e52df87: function() { return logError(function (arg0, arg1) {
            arg0.clear(arg1 >>> 0);
        }, arguments); },
        __wbg_clientWaitSync_8800b42d1c534e00: function() { return logError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.clientWaitSync(arg1, arg2 >>> 0, arg3 >>> 0);
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_colorMask_5646450fe1f1b723: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
        }, arguments); },
        __wbg_colorMask_8fca508f44773327: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
        }, arguments); },
        __wbg_compileShader_4ede19e4fc1bebce: function() { return logError(function (arg0, arg1) {
            arg0.compileShader(arg1);
        }, arguments); },
        __wbg_compileShader_ac457ada9042f08e: function() { return logError(function (arg0, arg1) {
            arg0.compileShader(arg1);
        }, arguments); },
        __wbg_compressedTexSubImage2D_0968a85385b7c463: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9);
        }, arguments); },
        __wbg_compressedTexSubImage2D_45987d7f0210d36f: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
            arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
        }, arguments); },
        __wbg_compressedTexSubImage2D_a39446fce0a68ad9: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
            arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
        }, arguments); },
        __wbg_compressedTexSubImage3D_3da84908295b8ec3: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
            arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11);
        }, arguments); },
        __wbg_compressedTexSubImage3D_c0bc017057e3942a: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
            arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10);
        }, arguments); },
        __wbg_copyBufferSubData_e5dc2aab90456f99: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
        }, arguments); },
        __wbg_copyBufferToBuffer_99ba10ae51f20b8a: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4, arg5);
        }, arguments); },
        __wbg_copyBufferToTexture_23af60c39ac396d5: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.copyBufferToTexture(arg1, arg2, arg3);
        }, arguments); },
        __wbg_copyExternalImageToTexture_83d6ac68891ec77e: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.copyExternalImageToTexture(arg1, arg2, arg3);
        }, arguments); },
        __wbg_copyTexSubImage2D_188da734d1c8aa07: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
            arg0.copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        }, arguments); },
        __wbg_copyTexSubImage2D_84d99fa40fabace0: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
            arg0.copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        }, arguments); },
        __wbg_copyTexSubImage3D_89064e67340a38b3: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.copyTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        }, arguments); },
        __wbg_copyTextureToBuffer_516f65baac22e0db: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.copyTextureToBuffer(arg1, arg2, arg3);
        }, arguments); },
        __wbg_copyTextureToTexture_d3c9091d3bf4897b: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            arg0.copyTextureToTexture(arg1, arg2, arg3);
        }, arguments); },
        __wbg_createBindGroupLayout_1d37ac0dabfbed28: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createBindGroupLayout(arg1);
            return ret;
        }, arguments); },
        __wbg_createBindGroup_3bccbd7517f0708e: function() { return logError(function (arg0, arg1) {
            const ret = arg0.createBindGroup(arg1);
            return ret;
        }, arguments); },
        __wbg_createBuffer_24b346170c9f54c8: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createBuffer(arg1);
            return ret;
        }, arguments); },
        __wbg_createBuffer_44b37c222efbd326: function() { return logError(function (arg0) {
            const ret = arg0.createBuffer();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createBuffer_af6c411fe2b091f8: function() { return logError(function (arg0) {
            const ret = arg0.createBuffer();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createCommandEncoder_48a406baaa084912: function() { return logError(function (arg0, arg1) {
            const ret = arg0.createCommandEncoder(arg1);
            return ret;
        }, arguments); },
        __wbg_createComputePipeline_4efb4ca205a4b557: function() { return logError(function (arg0, arg1) {
            const ret = arg0.createComputePipeline(arg1);
            return ret;
        }, arguments); },
        __wbg_createFramebuffer_4dc2fb6bd93463a5: function() { return logError(function (arg0) {
            const ret = arg0.createFramebuffer();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createFramebuffer_e6d8917bf9291c65: function() { return logError(function (arg0) {
            const ret = arg0.createFramebuffer();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createPipelineLayout_f668b6fbdf877ab3: function() { return logError(function (arg0, arg1) {
            const ret = arg0.createPipelineLayout(arg1);
            return ret;
        }, arguments); },
        __wbg_createProgram_2ebbd17565e0ede7: function() { return logError(function (arg0) {
            const ret = arg0.createProgram();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createProgram_81b37242eadef893: function() { return logError(function (arg0) {
            const ret = arg0.createProgram();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createQuerySet_a6bdf70e581bbde3: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createQuerySet(arg1);
            return ret;
        }, arguments); },
        __wbg_createQuery_5ef5edffbd3a678d: function() { return logError(function (arg0) {
            const ret = arg0.createQuery();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createRenderBundleEncoder_6ddd889167ace004: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createRenderBundleEncoder(arg1);
            return ret;
        }, arguments); },
        __wbg_createRenderPipeline_def9fb5cd54c36d5: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createRenderPipeline(arg1);
            return ret;
        }, arguments); },
        __wbg_createRenderbuffer_be624f81e06a0cfd: function() { return logError(function (arg0) {
            const ret = arg0.createRenderbuffer();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createRenderbuffer_cd2638d5dda9c277: function() { return logError(function (arg0) {
            const ret = arg0.createRenderbuffer();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createSampler_62cca6d739eaa62a: function() { return logError(function (arg0, arg1) {
            const ret = arg0.createSampler(arg1);
            return ret;
        }, arguments); },
        __wbg_createSampler_f1aedbf47c21745a: function() { return logError(function (arg0) {
            const ret = arg0.createSampler();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createShaderModule_1b0812f3a4503221: function() { return logError(function (arg0, arg1) {
            const ret = arg0.createShaderModule(arg1);
            return ret;
        }, arguments); },
        __wbg_createShader_9a8e5f335caac850: function() { return logError(function (arg0, arg1) {
            const ret = arg0.createShader(arg1 >>> 0);
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createShader_f8638cf4c19a1d2d: function() { return logError(function (arg0, arg1) {
            const ret = arg0.createShader(arg1 >>> 0);
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createTexture_42c791197006c64a: function() { return logError(function (arg0) {
            const ret = arg0.createTexture();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createTexture_77337549db437b45: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createTexture(arg1);
            return ret;
        }, arguments); },
        __wbg_createTexture_c74740f68b5c2a93: function() { return logError(function (arg0) {
            const ret = arg0.createTexture();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createVertexArrayOES_f7e8c94194c4e075: function() { return logError(function (arg0) {
            const ret = arg0.createVertexArrayOES();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createVertexArray_abd18ded26b75653: function() { return logError(function (arg0) {
            const ret = arg0.createVertexArray();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_createView_13bc5cdadcefa9ec: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.createView(arg1);
            return ret;
        }, arguments); },
        __wbg_cullFace_053fc24c214cae86: function() { return logError(function (arg0, arg1) {
            arg0.cullFace(arg1 >>> 0);
        }, arguments); },
        __wbg_cullFace_94e1cd382e8b654f: function() { return logError(function (arg0, arg1) {
            arg0.cullFace(arg1 >>> 0);
        }, arguments); },
        __wbg_deleteBuffer_42bd497a20b76d88: function() { return logError(function (arg0, arg1) {
            arg0.deleteBuffer(arg1);
        }, arguments); },
        __wbg_deleteBuffer_50f20219abee4d05: function() { return logError(function (arg0, arg1) {
            arg0.deleteBuffer(arg1);
        }, arguments); },
        __wbg_deleteFramebuffer_073235a01c2a0a28: function() { return logError(function (arg0, arg1) {
            arg0.deleteFramebuffer(arg1);
        }, arguments); },
        __wbg_deleteFramebuffer_07fcc16563d17920: function() { return logError(function (arg0, arg1) {
            arg0.deleteFramebuffer(arg1);
        }, arguments); },
        __wbg_deleteProgram_0191056307686073: function() { return logError(function (arg0, arg1) {
            arg0.deleteProgram(arg1);
        }, arguments); },
        __wbg_deleteProgram_ee7f1925cb856dc2: function() { return logError(function (arg0, arg1) {
            arg0.deleteProgram(arg1);
        }, arguments); },
        __wbg_deleteQuery_4624acbf9cbfc6e2: function() { return logError(function (arg0, arg1) {
            arg0.deleteQuery(arg1);
        }, arguments); },
        __wbg_deleteRenderbuffer_570117534d9608a1: function() { return logError(function (arg0, arg1) {
            arg0.deleteRenderbuffer(arg1);
        }, arguments); },
        __wbg_deleteRenderbuffer_ba4a805dfac20358: function() { return logError(function (arg0, arg1) {
            arg0.deleteRenderbuffer(arg1);
        }, arguments); },
        __wbg_deleteSampler_527e8d31f81669d9: function() { return logError(function (arg0, arg1) {
            arg0.deleteSampler(arg1);
        }, arguments); },
        __wbg_deleteShader_2558228a4ef7373e: function() { return logError(function (arg0, arg1) {
            arg0.deleteShader(arg1);
        }, arguments); },
        __wbg_deleteShader_413961eb94f5c67c: function() { return logError(function (arg0, arg1) {
            arg0.deleteShader(arg1);
        }, arguments); },
        __wbg_deleteSync_11f80510355180d6: function() { return logError(function (arg0, arg1) {
            arg0.deleteSync(arg1);
        }, arguments); },
        __wbg_deleteTexture_0ccd278d6db819ff: function() { return logError(function (arg0, arg1) {
            arg0.deleteTexture(arg1);
        }, arguments); },
        __wbg_deleteTexture_aadf9716c394d7be: function() { return logError(function (arg0, arg1) {
            arg0.deleteTexture(arg1);
        }, arguments); },
        __wbg_deleteVertexArrayOES_e43a9a425587d52b: function() { return logError(function (arg0, arg1) {
            arg0.deleteVertexArrayOES(arg1);
        }, arguments); },
        __wbg_deleteVertexArray_106030034355d246: function() { return logError(function (arg0, arg1) {
            arg0.deleteVertexArray(arg1);
        }, arguments); },
        __wbg_depthFunc_6c6f948417f5bde4: function() { return logError(function (arg0, arg1) {
            arg0.depthFunc(arg1 >>> 0);
        }, arguments); },
        __wbg_depthFunc_bb3152f635a60ff2: function() { return logError(function (arg0, arg1) {
            arg0.depthFunc(arg1 >>> 0);
        }, arguments); },
        __wbg_depthMask_4e0075e07739355b: function() { return logError(function (arg0, arg1) {
            arg0.depthMask(arg1 !== 0);
        }, arguments); },
        __wbg_depthMask_bdc57b9e64c6b4d8: function() { return logError(function (arg0, arg1) {
            arg0.depthMask(arg1 !== 0);
        }, arguments); },
        __wbg_depthRange_0acaf3031a92d51d: function() { return logError(function (arg0, arg1, arg2) {
            arg0.depthRange(arg1, arg2);
        }, arguments); },
        __wbg_depthRange_e2d0a59942d33efd: function() { return logError(function (arg0, arg1, arg2) {
            arg0.depthRange(arg1, arg2);
        }, arguments); },
        __wbg_destroy_1f28d3a203763add: function() { return logError(function (arg0) {
            arg0.destroy();
        }, arguments); },
        __wbg_destroy_7dbb1c1a5f51c9c1: function() { return logError(function (arg0) {
            arg0.destroy();
        }, arguments); },
        __wbg_destroy_b3008b9da9c3651e: function() { return logError(function (arg0) {
            arg0.destroy();
        }, arguments); },
        __wbg_disableVertexAttribArray_98752beca840c3da: function() { return logError(function (arg0, arg1) {
            arg0.disableVertexAttribArray(arg1 >>> 0);
        }, arguments); },
        __wbg_disableVertexAttribArray_aee51b7f1a8ef4cc: function() { return logError(function (arg0, arg1) {
            arg0.disableVertexAttribArray(arg1 >>> 0);
        }, arguments); },
        __wbg_disable_2ad210ba5315372a: function() { return logError(function (arg0, arg1) {
            arg0.disable(arg1 >>> 0);
        }, arguments); },
        __wbg_disable_bb1df5a6c75eaecd: function() { return logError(function (arg0, arg1) {
            arg0.disable(arg1 >>> 0);
        }, arguments); },
        __wbg_document_ac38448dbfd31a57: function() { return logError(function (arg0) {
            const ret = arg0.document;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_done_669171204c3dcae2: function() { return logError(function (arg0) {
            const ret = arg0.done;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_drawArraysInstancedANGLE_cb3b87925641d5b9: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.drawArraysInstancedANGLE(arg1 >>> 0, arg2, arg3, arg4);
        }, arguments); },
        __wbg_drawArraysInstanced_45317b22bbf7ffe8: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.drawArraysInstanced(arg1 >>> 0, arg2, arg3, arg4);
        }, arguments); },
        __wbg_drawArrays_02c354e377984441: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.drawArrays(arg1 >>> 0, arg2, arg3);
        }, arguments); },
        __wbg_drawArrays_b2004a40c212065c: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.drawArrays(arg1 >>> 0, arg2, arg3);
        }, arguments); },
        __wbg_drawBuffersWEBGL_0b4935290cba977e: function() { return logError(function (arg0, arg1) {
            arg0.drawBuffersWEBGL(arg1);
        }, arguments); },
        __wbg_drawBuffers_f07f796e50bb0077: function() { return logError(function (arg0, arg1) {
            arg0.drawBuffers(arg1);
        }, arguments); },
        __wbg_drawElementsInstancedANGLE_8179cb41f5862831: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.drawElementsInstancedANGLE(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
        }, arguments); },
        __wbg_drawElementsInstanced_07717eeb890435e9: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.drawElementsInstanced(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
        }, arguments); },
        __wbg_drawIndexedIndirect_594cb5229719fe3f: function() { return logError(function (arg0, arg1, arg2) {
            arg0.drawIndexedIndirect(arg1, arg2);
        }, arguments); },
        __wbg_drawIndexed_fd47a285c65bc454: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
        }, arguments); },
        __wbg_drawIndirect_ffbff8b93bf03cf9: function() { return logError(function (arg0, arg1, arg2) {
            arg0.drawIndirect(arg1, arg2);
        }, arguments); },
        __wbg_draw_754f5b2022d90fd7: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        }, arguments); },
        __wbg_enableVertexAttribArray_90f1a9f570379c36: function() { return logError(function (arg0, arg1) {
            arg0.enableVertexAttribArray(arg1 >>> 0);
        }, arguments); },
        __wbg_enableVertexAttribArray_b072ffcbe4f26e2b: function() { return logError(function (arg0, arg1) {
            arg0.enableVertexAttribArray(arg1 >>> 0);
        }, arguments); },
        __wbg_enable_17346ff3b2257cae: function() { return logError(function (arg0, arg1) {
            arg0.enable(arg1 >>> 0);
        }, arguments); },
        __wbg_enable_db1e433ea267f29b: function() { return logError(function (arg0, arg1) {
            arg0.enable(arg1 >>> 0);
        }, arguments); },
        __wbg_endQuery_0434371d408e59b7: function() { return logError(function (arg0, arg1) {
            arg0.endQuery(arg1 >>> 0);
        }, arguments); },
        __wbg_end_1300dc816a60c7ab: function() { return logError(function (arg0) {
            arg0.end();
        }, arguments); },
        __wbg_error_757e9472f8410341: function() { return logError(function (arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        }, arguments); },
        __wbg_error_9995e4f5bc493ed6: function() { return logError(function (arg0) {
            const ret = arg0.error;
            return ret;
        }, arguments); },
        __wbg_executeBundles_7ee5bf07f5eed7c9: function() { return logError(function (arg0, arg1) {
            arg0.executeBundles(arg1);
        }, arguments); },
        __wbg_features_205df3dd891b74bf: function() { return logError(function (arg0) {
            const ret = arg0.features;
            return ret;
        }, arguments); },
        __wbg_features_efadd23951712b29: function() { return logError(function (arg0) {
            const ret = arg0.features;
            return ret;
        }, arguments); },
        __wbg_fenceSync_57ab30f550e5a5a2: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.fenceSync(arg1 >>> 0, arg2 >>> 0);
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_finish_2440fb64e53f7d5a: function() { return logError(function (arg0, arg1) {
            const ret = arg0.finish(arg1);
            return ret;
        }, arguments); },
        __wbg_finish_4b40810f0b577bc2: function() { return logError(function (arg0) {
            const ret = arg0.finish();
            return ret;
        }, arguments); },
        __wbg_framebufferRenderbuffer_5736a8553be94035: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
        }, arguments); },
        __wbg_framebufferRenderbuffer_e0c873b9f296443d: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
        }, arguments); },
        __wbg_framebufferTexture2D_8584b49a205ffe5b: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
        }, arguments); },
        __wbg_framebufferTexture2D_9abab99d6209666a: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
        }, arguments); },
        __wbg_framebufferTextureLayer_e236352620170c5a: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.framebufferTextureLayer(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
        }, arguments); },
        __wbg_framebufferTextureMultiviewOVR_9b89dd83134856d3: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.framebufferTextureMultiviewOVR(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5, arg6);
        }, arguments); },
        __wbg_frontFace_188579d7bba462b1: function() { return logError(function (arg0, arg1) {
            arg0.frontFace(arg1 >>> 0);
        }, arguments); },
        __wbg_frontFace_19294c82ae89fa71: function() { return logError(function (arg0, arg1) {
            arg0.frontFace(arg1 >>> 0);
        }, arguments); },
        __wbg_getBufferSubData_d1d7ad69c40ea085: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.getBufferSubData(arg1 >>> 0, arg2, arg3);
        }, arguments); },
        __wbg_getContext_123ddade3a0fb2f5: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2), arg3);
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getContext_53c8c42beb820370: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2), arg3);
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getContext_71c33f14b63da593: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getContext_c5236e0057b35024: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getExtension_8e8c3be603d4f5ce: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getExtension(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getIndexedParameter_fa6cca29d50de787: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getIndexedParameter(arg1 >>> 0, arg2 >>> 0);
            return ret;
        }, arguments); },
        __wbg_getMappedRange_55878eb97535ca19: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.getMappedRange(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_getParameter_19325d4aa1b66856: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.getParameter(arg1 >>> 0);
            return ret;
        }, arguments); },
        __wbg_getParameter_7ddbe9f9606f6a80: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.getParameter(arg1 >>> 0);
            return ret;
        }, arguments); },
        __wbg_getProgramInfoLog_50a07d12dddd0da6: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg1.getProgramInfoLog(arg2);
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_getProgramInfoLog_72665662cf78b5a2: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg1.getProgramInfoLog(arg2);
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_getProgramParameter_1f5cceb73030e823: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
            return ret;
        }, arguments); },
        __wbg_getProgramParameter_41e1ea6f52a71ba5: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
            return ret;
        }, arguments); },
        __wbg_getQueryParameter_fa2ce36cfdedc862: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.getQueryParameter(arg1, arg2 >>> 0);
            return ret;
        }, arguments); },
        __wbg_getShaderInfoLog_337a0567e83283d1: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg1.getShaderInfoLog(arg2);
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_getShaderInfoLog_663a9b136ab42b32: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg1.getShaderInfoLog(arg2);
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_getShaderParameter_95d4ad40668ee798: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.getShaderParameter(arg1, arg2 >>> 0);
            return ret;
        }, arguments); },
        __wbg_getShaderParameter_9e9aa18598294f3b: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.getShaderParameter(arg1, arg2 >>> 0);
            return ret;
        }, arguments); },
        __wbg_getSupportedExtensions_63e3eaba880055c5: function() { return logError(function (arg0) {
            const ret = arg0.getSupportedExtensions();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getSupportedProfiles_7cd826b4eff5e8fc: function() { return logError(function (arg0) {
            const ret = arg0.getSupportedProfiles();
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getSyncParameter_3eb3ecefa061c5ee: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.getSyncParameter(arg1, arg2 >>> 0);
            return ret;
        }, arguments); },
        __wbg_getUniformBlockIndex_78264d4d94f8252d: function() { return logError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.getUniformBlockIndex(arg1, getStringFromWasm0(arg2, arg3));
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_getUniformLocation_11fd99fee70965dc: function() { return logError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_getUniformLocation_c493d2f5f1a6213d: function() { return logError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_get_36debceb6d43d7a1: function() { return logError(function (arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_get_971a0c45d172643f: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_unchecked_e20b893aeafc3fca: function() { return logError(function (arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        }, arguments); },
        __wbg_gpu_bafbc1407fe850fb: function() { return logError(function (arg0) {
            const ret = arg0.gpu;
            return ret;
        }, arguments); },
        __wbg_has_b3a6e6d0d28295fa: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.has(arg0, arg1);
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_has_dc80aa6186153231: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.has(getStringFromWasm0(arg1, arg2));
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_height_89544b3a2329e1e4: function() { return logError(function (arg0) {
            const ret = arg0.height;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_height_b0594a7850e20673: function() { return logError(function (arg0) {
            const ret = arg0.height;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_height_e56f6fb197710e09: function() { return logError(function (arg0) {
            const ret = arg0.height;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_height_e6a5d9a72f05fc93: function() { return logError(function (arg0) {
            const ret = arg0.height;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_height_f2659a9165347939: function() { return logError(function (arg0) {
            const ret = arg0.height;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_includes_a4b83ade703cb80b: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.includes(arg1, arg2);
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_GpuAdapter_aff4b0f95a6c1c3e: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof GPUAdapter;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_GpuCanvasContext_dc8dc7061b962990: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof GPUCanvasContext;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_GpuDeviceLostInfo_8a1670921dcc0ec6: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof GPUDeviceLostInfo;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_GpuOutOfMemoryError_c9077369f40e8df6: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof GPUOutOfMemoryError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_GpuValidationError_6f92e479d86616a6: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof GPUValidationError;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_HtmlCanvasElement_327e7f7530c72bbd: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof HTMLCanvasElement;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_Object_80ad464782e2bd73: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof Object;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_WebGl2RenderingContext_e27143c72f888655: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof WebGL2RenderingContext;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_instanceof_Window_5625ff9937037a38: function() { return logError(function (arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_invalidateFramebuffer_9a711eeb3940aba0: function() { return handleError(function (arg0, arg1, arg2) {
            arg0.invalidateFramebuffer(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_is_86be747e88e872fb: function() { return logError(function (arg0, arg1) {
            const ret = Object.is(arg0, arg1);
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_keys_05e621d03a0feaae: function() { return logError(function (arg0) {
            const ret = arg0.keys();
            return ret;
        }, arguments); },
        __wbg_label_4b6427d9045e3926: function() { return logError(function (arg0, arg1) {
            const ret = arg1.label;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_length_36bd29c6848c2144: function() { return logError(function (arg0) {
            const ret = arg0.length;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_length_ecfa2c63d3d0d82c: function() { return logError(function (arg0) {
            const ret = arg0.length;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_limits_2ae770381034d5ef: function() { return logError(function (arg0) {
            const ret = arg0.limits;
            return ret;
        }, arguments); },
        __wbg_limits_805a5a24eacdef89: function() { return logError(function (arg0) {
            const ret = arg0.limits;
            return ret;
        }, arguments); },
        __wbg_linkProgram_124252d16ea0ef40: function() { return logError(function (arg0, arg1) {
            arg0.linkProgram(arg1);
        }, arguments); },
        __wbg_linkProgram_dd3cfc19950a354c: function() { return logError(function (arg0, arg1) {
            arg0.linkProgram(arg1);
        }, arguments); },
        __wbg_lost_5450e6b9e280ed71: function() { return logError(function (arg0) {
            const ret = arg0.lost;
            return ret;
        }, arguments); },
        __wbg_mapAsync_f7fe2e4825742580: function() { return logError(function (arg0, arg1, arg2, arg3) {
            const ret = arg0.mapAsync(arg1 >>> 0, arg2, arg3);
            return ret;
        }, arguments); },
        __wbg_maxBindGroups_aeb19ade452446c6: function() { return logError(function (arg0) {
            const ret = arg0.maxBindGroups;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxBindingsPerBindGroup_56b9cd783b976459: function() { return logError(function (arg0) {
            const ret = arg0.maxBindingsPerBindGroup;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxBufferSize_b9cfa105ccd49524: function() { return logError(function (arg0) {
            const ret = arg0.maxBufferSize;
            return ret;
        }, arguments); },
        __wbg_maxColorAttachmentBytesPerSample_3853759407ab3c40: function() { return logError(function (arg0) {
            const ret = arg0.maxColorAttachmentBytesPerSample;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxColorAttachments_a9a3c5bc728fb56f: function() { return logError(function (arg0) {
            const ret = arg0.maxColorAttachments;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxComputeInvocationsPerWorkgroup_732f87215035d9e5: function() { return logError(function (arg0) {
            const ret = arg0.maxComputeInvocationsPerWorkgroup;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxComputeWorkgroupSizeX_4f1d6552edeba82a: function() { return logError(function (arg0) {
            const ret = arg0.maxComputeWorkgroupSizeX;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxComputeWorkgroupSizeY_170c377843fcdda9: function() { return logError(function (arg0) {
            const ret = arg0.maxComputeWorkgroupSizeY;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxComputeWorkgroupSizeZ_78bd13bc9226bc99: function() { return logError(function (arg0) {
            const ret = arg0.maxComputeWorkgroupSizeZ;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxComputeWorkgroupStorageSize_0a6873ffe86d432d: function() { return logError(function (arg0) {
            const ret = arg0.maxComputeWorkgroupStorageSize;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxComputeWorkgroupsPerDimension_7f64fa252d98d9e0: function() { return logError(function (arg0) {
            const ret = arg0.maxComputeWorkgroupsPerDimension;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxDynamicStorageBuffersPerPipelineLayout_548c4d8427692343: function() { return logError(function (arg0) {
            const ret = arg0.maxDynamicStorageBuffersPerPipelineLayout;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxDynamicUniformBuffersPerPipelineLayout_575f81e5a619fda4: function() { return logError(function (arg0) {
            const ret = arg0.maxDynamicUniformBuffersPerPipelineLayout;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxSampledTexturesPerShaderStage_4b0d0d0deb7f9173: function() { return logError(function (arg0) {
            const ret = arg0.maxSampledTexturesPerShaderStage;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxSamplersPerShaderStage_122e1c314b7d5f0e: function() { return logError(function (arg0) {
            const ret = arg0.maxSamplersPerShaderStage;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxStorageBufferBindingSize_69368e8c4a720d65: function() { return logError(function (arg0) {
            const ret = arg0.maxStorageBufferBindingSize;
            return ret;
        }, arguments); },
        __wbg_maxStorageBuffersPerShaderStage_483da9a48e09b2cd: function() { return logError(function (arg0) {
            const ret = arg0.maxStorageBuffersPerShaderStage;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxStorageTexturesPerShaderStage_825095cb824c2a90: function() { return logError(function (arg0) {
            const ret = arg0.maxStorageTexturesPerShaderStage;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxTextureArrayLayers_311d9cd973092ad3: function() { return logError(function (arg0) {
            const ret = arg0.maxTextureArrayLayers;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxTextureDimension1D_f14696527b4dd4c9: function() { return logError(function (arg0) {
            const ret = arg0.maxTextureDimension1D;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxTextureDimension2D_8a888981a9a496a3: function() { return logError(function (arg0) {
            const ret = arg0.maxTextureDimension2D;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxTextureDimension3D_af7a8c47b3a93760: function() { return logError(function (arg0) {
            const ret = arg0.maxTextureDimension3D;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxUniformBufferBindingSize_5cab04d98886e7d3: function() { return logError(function (arg0) {
            const ret = arg0.maxUniformBufferBindingSize;
            return ret;
        }, arguments); },
        __wbg_maxUniformBuffersPerShaderStage_14f4345c06c80500: function() { return logError(function (arg0) {
            const ret = arg0.maxUniformBuffersPerShaderStage;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxVertexAttributes_73ce901689262af1: function() { return logError(function (arg0) {
            const ret = arg0.maxVertexAttributes;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxVertexBufferArrayStride_4cb22981054e6df0: function() { return logError(function (arg0) {
            const ret = arg0.maxVertexBufferArrayStride;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_maxVertexBuffers_a6df2bc183ca7af0: function() { return logError(function (arg0) {
            const ret = arg0.maxVertexBuffers;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_message_25bb811d1d056a2d: function() { return logError(function (arg0, arg1) {
            const ret = arg1.message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_message_e2fb350ad8cfe709: function() { return logError(function (arg0, arg1) {
            const ret = arg1.message;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_minStorageBufferOffsetAlignment_2039bfddd5b42bd9: function() { return logError(function (arg0) {
            const ret = arg0.minStorageBufferOffsetAlignment;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_minUniformBufferOffsetAlignment_4366c5e24c3a2e2f: function() { return logError(function (arg0) {
            const ret = arg0.minUniformBufferOffsetAlignment;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_navigator_6cfdd5fa246d910f: function() { return logError(function (arg0) {
            const ret = arg0.navigator;
            return ret;
        }, arguments); },
        __wbg_navigator_e5c345298a9609cd: function() { return logError(function (arg0) {
            const ret = arg0.navigator;
            return ret;
        }, arguments); },
        __wbg_new_116be93542d39019: function() { return logError(function () {
            const ret = new Array();
            return ret;
        }, arguments); },
        __wbg_new_227d7c05414eb861: function() { return logError(function () {
            const ret = new Error();
            return ret;
        }, arguments); },
        __wbg_new_652118cdee90118f: function() { return handleError(function (arg0, arg1) {
            const ret = new OffscreenCanvas(arg0 >>> 0, arg1 >>> 0);
            return ret;
        }, arguments); },
        __wbg_new_ebe3e0f6837f0879: function() { return logError(function () {
            const ret = new Object();
            return ret;
        }, arguments); },
        __wbg_new_from_slice_3eea173078478cfe: function() { return logError(function (arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        }, arguments); },
        __wbg_new_typed_cceaf62d8d95e9f2: function() { return logError(function (arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen__convert__closures_____invoke__h6890542ec23ad306(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        }, arguments); },
        __wbg_new_with_byte_offset_and_length_ff6e927f8d72f0c3: function() { return logError(function (arg0, arg1, arg2) {
            const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
            return ret;
        }, arguments); },
        __wbg_next_42cf16ee0dafc9e2: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_of_0c6464fa8d2aa86d: function() { return logError(function (arg0) {
            const ret = Array.of(arg0);
            return ret;
        }, arguments); },
        __wbg_pixelStorei_11bdfb5bc6a39d28: function() { return logError(function (arg0, arg1, arg2) {
            arg0.pixelStorei(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_pixelStorei_86481a168d6e225e: function() { return logError(function (arg0, arg1, arg2) {
            arg0.pixelStorei(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_polygonOffset_2b8b141e8cc17c10: function() { return logError(function (arg0, arg1, arg2) {
            arg0.polygonOffset(arg1, arg2);
        }, arguments); },
        __wbg_polygonOffset_94b427c5130ab6c2: function() { return logError(function (arg0, arg1, arg2) {
            arg0.polygonOffset(arg1, arg2);
        }, arguments); },
        __wbg_popErrorScope_79543cb048170397: function() { return logError(function (arg0) {
            const ret = arg0.popErrorScope();
            return ret;
        }, arguments); },
        __wbg_prototypesetcall_de8e0d9553586985: function() { return logError(function (arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        }, arguments); },
        __wbg_pushErrorScope_674df658c271daea: function() { return logError(function (arg0, arg1) {
            arg0.pushErrorScope(__wbindgen_enum_GpuErrorFilter[arg1]);
        }, arguments); },
        __wbg_push_adb0107829f02d75: function() { return logError(function (arg0, arg1) {
            const ret = arg0.push(arg1);
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_queryCounterEXT_b0cddcdfb28830df: function() { return logError(function (arg0, arg1, arg2) {
            arg0.queryCounterEXT(arg1, arg2 >>> 0);
        }, arguments); },
        __wbg_querySelectorAll_9b6a612499ecb916: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.querySelectorAll(getStringFromWasm0(arg1, arg2));
            return ret;
        }, arguments); },
        __wbg_querySelector_2c472eddb417c6b3: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.querySelector(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_queueMicrotask_ac694eae12e92dfb: function() { return logError(function (arg0) {
            queueMicrotask(arg0);
        }, arguments); },
        __wbg_queueMicrotask_be5fe34a8f4cad4d: function() { return logError(function (arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        }, arguments); },
        __wbg_queue_3e40156d83b9183e: function() { return logError(function (arg0) {
            const ret = arg0.queue;
            return ret;
        }, arguments); },
        __wbg_readBuffer_2de0b72ac08915c8: function() { return logError(function (arg0, arg1) {
            arg0.readBuffer(arg1 >>> 0);
        }, arguments); },
        __wbg_readPixels_0033d2834b498dda: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
        }, arguments); },
        __wbg_readPixels_0e3230bf7a891882: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
        }, arguments); },
        __wbg_readPixels_8f8bde9ee420ba35: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
        }, arguments); },
        __wbg_reason_a10491741453b0e1: function() { return logError(function (arg0) {
            const ret = arg0.reason;
            return (__wbindgen_enum_GpuDeviceLostReason.indexOf(ret) + 1 || 3) - 1;
        }, arguments); },
        __wbg_renderbufferStorageMultisample_a9f65ef0cc53fb37: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.renderbufferStorageMultisample(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
        }, arguments); },
        __wbg_renderbufferStorage_33c57e600b175bd6: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
        }, arguments); },
        __wbg_renderbufferStorage_3fb6d5a0f3e07d46: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
        }, arguments); },
        __wbg_requestAdapter_245da40985c2fdc5: function() { return logError(function (arg0, arg1) {
            const ret = arg0.requestAdapter(arg1);
            return ret;
        }, arguments); },
        __wbg_requestDevice_28434913a23418c4: function() { return logError(function (arg0, arg1) {
            const ret = arg0.requestDevice(arg1);
            return ret;
        }, arguments); },
        __wbg_resolveQuerySet_9c9de6862d76dfd5: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.resolveQuerySet(arg1, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
        }, arguments); },
        __wbg_resolve_020f95d838c6ef25: function() { return logError(function (arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        }, arguments); },
        __wbg_run_ef366b557a6598c4: function() { return logError(function (arg0, arg1, arg2) {
            try {
                var state0 = {a: arg1, b: arg2};
                var cb0 = () => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen__convert__closures_____invoke__hf578ab18b69ee5d0(a, state0.b, );
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = arg0.run(cb0);
                _assertBoolean(ret);
                return ret;
            } finally {
                state0.a = 0;
            }
        }, arguments); },
        __wbg_samplerParameterf_d7f38ba3194c43ba: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.samplerParameterf(arg1, arg2 >>> 0, arg3);
        }, arguments); },
        __wbg_samplerParameteri_3d8994d9967c6803: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.samplerParameteri(arg1, arg2 >>> 0, arg3);
        }, arguments); },
        __wbg_scissor_2f02706fbca6e98a: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.scissor(arg1, arg2, arg3, arg4);
        }, arguments); },
        __wbg_scissor_cdfb84de20f004b6: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.scissor(arg1, arg2, arg3, arg4);
        }, arguments); },
        __wbg_setBindGroup_14e047cccfca4206: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
        }, arguments); },
        __wbg_setBindGroup_e7493a4d990b460a: function() { return logError(function (arg0, arg1, arg2) {
            arg0.setBindGroup(arg1 >>> 0, arg2);
        }, arguments); },
        __wbg_setBlendConstant_bc7417f283cebcfc: function() { return handleError(function (arg0, arg1) {
            arg0.setBlendConstant(arg1);
        }, arguments); },
        __wbg_setIndexBuffer_4fb98e6d19bb7f33: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4);
        }, arguments); },
        __wbg_setIndexBuffer_7fdf61bb296c38e7: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3);
        }, arguments); },
        __wbg_setPipeline_323a115b52180cad: function() { return logError(function (arg0, arg1) {
            arg0.setPipeline(arg1);
        }, arguments); },
        __wbg_setScissorRect_91ab81001aa06f8c: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.setScissorRect(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        }, arguments); },
        __wbg_setStencilReference_b560fc83ebdd4420: function() { return logError(function (arg0, arg1) {
            arg0.setStencilReference(arg1 >>> 0);
        }, arguments); },
        __wbg_setVertexBuffer_e32a2441b1f7bfa3: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4);
        }, arguments); },
        __wbg_setVertexBuffer_f90b4b03dde32ab1: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3);
        }, arguments); },
        __wbg_setViewport_b5382516378a0227: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.setViewport(arg1, arg2, arg3, arg4, arg5, arg6);
        }, arguments); },
        __wbg_set_8155bb79a948541b: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            _assertBoolean(ret);
            return ret;
        }, arguments); },
        __wbg_set_862c439a342a8818: function() { return logError(function (arg0, arg1, arg2) {
            arg0.set(arg1, arg2 >>> 0);
        }, arguments); },
        __wbg_set_a_e8353b5faed116b8: function() { return logError(function (arg0, arg1) {
            arg0.a = arg1;
        }, arguments); },
        __wbg_set_access_1cc7ab8607a9643c: function() { return logError(function (arg0, arg1) {
            arg0.access = __wbindgen_enum_GpuStorageTextureAccess[arg1];
        }, arguments); },
        __wbg_set_address_mode_u_1d68fc63a680df34: function() { return logError(function (arg0, arg1) {
            arg0.addressModeU = __wbindgen_enum_GpuAddressMode[arg1];
        }, arguments); },
        __wbg_set_address_mode_v_ccd53f17094d3a31: function() { return logError(function (arg0, arg1) {
            arg0.addressModeV = __wbindgen_enum_GpuAddressMode[arg1];
        }, arguments); },
        __wbg_set_address_mode_w_b90bd1f395bf22f7: function() { return logError(function (arg0, arg1) {
            arg0.addressModeW = __wbindgen_enum_GpuAddressMode[arg1];
        }, arguments); },
        __wbg_set_alpha_f4d387342be7589e: function() { return logError(function (arg0, arg1) {
            arg0.alpha = arg1;
        }, arguments); },
        __wbg_set_alpha_to_coverage_enabled_ae6d838cf7f69c3f: function() { return logError(function (arg0, arg1) {
            arg0.alphaToCoverageEnabled = arg1 !== 0;
        }, arguments); },
        __wbg_set_array_layer_count_37c76e4cca82351f: function() { return logError(function (arg0, arg1) {
            arg0.arrayLayerCount = arg1 >>> 0;
        }, arguments); },
        __wbg_set_array_stride_be930c5983868c93: function() { return logError(function (arg0, arg1) {
            arg0.arrayStride = arg1;
        }, arguments); },
        __wbg_set_aspect_2708288ca7c8f51e: function() { return logError(function (arg0, arg1) {
            arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
        }, arguments); },
        __wbg_set_aspect_c9292d2a13f954e1: function() { return logError(function (arg0, arg1) {
            arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
        }, arguments); },
        __wbg_set_attributes_c0fe49febc11550f: function() { return logError(function (arg0, arg1) {
            arg0.attributes = arg1;
        }, arguments); },
        __wbg_set_b_c127e87dfb6c67af: function() { return logError(function (arg0, arg1) {
            arg0.b = arg1;
        }, arguments); },
        __wbg_set_base_array_layer_6374493b6bc1a0a9: function() { return logError(function (arg0, arg1) {
            arg0.baseArrayLayer = arg1 >>> 0;
        }, arguments); },
        __wbg_set_base_mip_level_5a0524f10a35bff6: function() { return logError(function (arg0, arg1) {
            arg0.baseMipLevel = arg1 >>> 0;
        }, arguments); },
        __wbg_set_beginning_of_pass_write_index_aa7255a7590f9493: function() { return logError(function (arg0, arg1) {
            arg0.beginningOfPassWriteIndex = arg1 >>> 0;
        }, arguments); },
        __wbg_set_beginning_of_pass_write_index_ac45c363336c24c7: function() { return logError(function (arg0, arg1) {
            arg0.beginningOfPassWriteIndex = arg1 >>> 0;
        }, arguments); },
        __wbg_set_bind_group_layouts_b4667372bdcee99f: function() { return logError(function (arg0, arg1) {
            arg0.bindGroupLayouts = arg1;
        }, arguments); },
        __wbg_set_binding_0a48264269982c5e: function() { return logError(function (arg0, arg1) {
            arg0.binding = arg1 >>> 0;
        }, arguments); },
        __wbg_set_binding_15ab1e2c74990b25: function() { return logError(function (arg0, arg1) {
            arg0.binding = arg1 >>> 0;
        }, arguments); },
        __wbg_set_blend_16ab90d22bf8916c: function() { return logError(function (arg0, arg1) {
            arg0.blend = arg1;
        }, arguments); },
        __wbg_set_buffer_3b3e4c4a884d1610: function() { return logError(function (arg0, arg1) {
            arg0.buffer = arg1;
        }, arguments); },
        __wbg_set_buffer_5c9fd98c06ff0965: function() { return logError(function (arg0, arg1) {
            arg0.buffer = arg1;
        }, arguments); },
        __wbg_set_buffer_ff433f6fc0bcc260: function() { return logError(function (arg0, arg1) {
            arg0.buffer = arg1;
        }, arguments); },
        __wbg_set_buffers_a0aac3bc1d868127: function() { return logError(function (arg0, arg1) {
            arg0.buffers = arg1;
        }, arguments); },
        __wbg_set_bytes_per_row_677fe88cface9df0: function() { return logError(function (arg0, arg1) {
            arg0.bytesPerRow = arg1 >>> 0;
        }, arguments); },
        __wbg_set_bytes_per_row_af08702a3d159816: function() { return logError(function (arg0, arg1) {
            arg0.bytesPerRow = arg1 >>> 0;
        }, arguments); },
        __wbg_set_clear_value_4c76b232d6720cd3: function() { return logError(function (arg0, arg1) {
            arg0.clearValue = arg1;
        }, arguments); },
        __wbg_set_code_c616b86ce504e24a: function() { return logError(function (arg0, arg1, arg2) {
            arg0.code = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_color_attachments_24458ffe50f4adf3: function() { return logError(function (arg0, arg1) {
            arg0.colorAttachments = arg1;
        }, arguments); },
        __wbg_set_color_bfad4ca850b49bef: function() { return logError(function (arg0, arg1) {
            arg0.color = arg1;
        }, arguments); },
        __wbg_set_color_formats_f208f1ec66a7df6d: function() { return logError(function (arg0, arg1) {
            arg0.colorFormats = arg1;
        }, arguments); },
        __wbg_set_compare_a75d29183e0b391a: function() { return logError(function (arg0, arg1) {
            arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
        }, arguments); },
        __wbg_set_compare_e3e5cfed6b9fb08f: function() { return logError(function (arg0, arg1) {
            arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
        }, arguments); },
        __wbg_set_compute_7c274f1347709d07: function() { return logError(function (arg0, arg1) {
            arg0.compute = arg1;
        }, arguments); },
        __wbg_set_count_7e33db45fa773144: function() { return logError(function (arg0, arg1) {
            arg0.count = arg1 >>> 0;
        }, arguments); },
        __wbg_set_count_f4ae1546794fb395: function() { return logError(function (arg0, arg1) {
            arg0.count = arg1 >>> 0;
        }, arguments); },
        __wbg_set_cull_mode_5a9a78be0b9e959d: function() { return logError(function (arg0, arg1) {
            arg0.cullMode = __wbindgen_enum_GpuCullMode[arg1];
        }, arguments); },
        __wbg_set_depth_bias_clamp_6e19879f7d3c4847: function() { return logError(function (arg0, arg1) {
            arg0.depthBiasClamp = arg1;
        }, arguments); },
        __wbg_set_depth_bias_d20e6bd7bb8d2943: function() { return logError(function (arg0, arg1) {
            arg0.depthBias = arg1;
        }, arguments); },
        __wbg_set_depth_bias_slope_scale_71f49974c86014f3: function() { return logError(function (arg0, arg1) {
            arg0.depthBiasSlopeScale = arg1;
        }, arguments); },
        __wbg_set_depth_clear_value_2ca0c53af7b55fd0: function() { return logError(function (arg0, arg1) {
            arg0.depthClearValue = arg1;
        }, arguments); },
        __wbg_set_depth_compare_6f8d2861799b9b1b: function() { return logError(function (arg0, arg1) {
            arg0.depthCompare = __wbindgen_enum_GpuCompareFunction[arg1];
        }, arguments); },
        __wbg_set_depth_fail_op_3ffe0a79cc0c6c78: function() { return logError(function (arg0, arg1) {
            arg0.depthFailOp = __wbindgen_enum_GpuStencilOperation[arg1];
        }, arguments); },
        __wbg_set_depth_load_op_f93e6e6b73a935f4: function() { return logError(function (arg0, arg1) {
            arg0.depthLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
        }, arguments); },
        __wbg_set_depth_or_array_layers_e21f6b37c67d8790: function() { return logError(function (arg0, arg1) {
            arg0.depthOrArrayLayers = arg1 >>> 0;
        }, arguments); },
        __wbg_set_depth_read_only_e7e0fc0fead69d30: function() { return logError(function (arg0, arg1) {
            arg0.depthReadOnly = arg1 !== 0;
        }, arguments); },
        __wbg_set_depth_read_only_fbf088139113cd77: function() { return logError(function (arg0, arg1) {
            arg0.depthReadOnly = arg1 !== 0;
        }, arguments); },
        __wbg_set_depth_stencil_6aadfcbb91ef3c92: function() { return logError(function (arg0, arg1) {
            arg0.depthStencil = arg1;
        }, arguments); },
        __wbg_set_depth_stencil_attachment_f6f91f5bf5d13235: function() { return logError(function (arg0, arg1) {
            arg0.depthStencilAttachment = arg1;
        }, arguments); },
        __wbg_set_depth_stencil_format_9e4ae8fd6d086139: function() { return logError(function (arg0, arg1) {
            arg0.depthStencilFormat = __wbindgen_enum_GpuTextureFormat[arg1];
        }, arguments); },
        __wbg_set_depth_store_op_9c95e333852d3582: function() { return logError(function (arg0, arg1) {
            arg0.depthStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
        }, arguments); },
        __wbg_set_depth_write_enabled_2321a5fb094805ad: function() { return logError(function (arg0, arg1) {
            arg0.depthWriteEnabled = arg1 !== 0;
        }, arguments); },
        __wbg_set_dimension_117c2064ce996b47: function() { return logError(function (arg0, arg1) {
            arg0.dimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        }, arguments); },
        __wbg_set_dimension_5c6032ac740887c0: function() { return logError(function (arg0, arg1) {
            arg0.dimension = __wbindgen_enum_GpuTextureDimension[arg1];
        }, arguments); },
        __wbg_set_dst_factor_b97f1b6e89186af3: function() { return logError(function (arg0, arg1) {
            arg0.dstFactor = __wbindgen_enum_GpuBlendFactor[arg1];
        }, arguments); },
        __wbg_set_end_of_pass_write_index_38e826851cbbb415: function() { return logError(function (arg0, arg1) {
            arg0.endOfPassWriteIndex = arg1 >>> 0;
        }, arguments); },
        __wbg_set_end_of_pass_write_index_c60088bc589e6882: function() { return logError(function (arg0, arg1) {
            arg0.endOfPassWriteIndex = arg1 >>> 0;
        }, arguments); },
        __wbg_set_entries_bfc700c1f97eec0b: function() { return logError(function (arg0, arg1) {
            arg0.entries = arg1;
        }, arguments); },
        __wbg_set_entries_f07df780e3613292: function() { return logError(function (arg0, arg1) {
            arg0.entries = arg1;
        }, arguments); },
        __wbg_set_entry_point_24a4e90f52608a39: function() { return logError(function (arg0, arg1, arg2) {
            arg0.entryPoint = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_entry_point_77641c5f6ad5355e: function() { return logError(function (arg0, arg1, arg2) {
            arg0.entryPoint = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_entry_point_aa503b3bb9fed987: function() { return logError(function (arg0, arg1, arg2) {
            arg0.entryPoint = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_fail_op_fa7348fc04abc3f6: function() { return logError(function (arg0, arg1) {
            arg0.failOp = __wbindgen_enum_GpuStencilOperation[arg1];
        }, arguments); },
        __wbg_set_flip_y_989082c3d40069c7: function() { return logError(function (arg0, arg1) {
            arg0.flipY = arg1 !== 0;
        }, arguments); },
        __wbg_set_format_11c7232d92ed699b: function() { return logError(function (arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        }, arguments); },
        __wbg_set_format_3132a1562e48d4f8: function() { return logError(function (arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        }, arguments); },
        __wbg_set_format_aa06ccc03e770abb: function() { return logError(function (arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        }, arguments); },
        __wbg_set_format_b554909c259d57d4: function() { return logError(function (arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuVertexFormat[arg1];
        }, arguments); },
        __wbg_set_format_b8158198b657d617: function() { return logError(function (arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        }, arguments); },
        __wbg_set_format_c38221656906581e: function() { return logError(function (arg0, arg1) {
            arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
        }, arguments); },
        __wbg_set_fragment_5fd7881ebd420d39: function() { return logError(function (arg0, arg1) {
            arg0.fragment = arg1;
        }, arguments); },
        __wbg_set_front_face_1adffec645ea35e2: function() { return logError(function (arg0, arg1) {
            arg0.frontFace = __wbindgen_enum_GpuFrontFace[arg1];
        }, arguments); },
        __wbg_set_g_130527c5176eefae: function() { return logError(function (arg0, arg1) {
            arg0.g = arg1;
        }, arguments); },
        __wbg_set_has_dynamic_offset_4d5601049080763e: function() { return logError(function (arg0, arg1) {
            arg0.hasDynamicOffset = arg1 !== 0;
        }, arguments); },
        __wbg_set_height_3ebe4c6ea2510fcc: function() { return logError(function (arg0, arg1) {
            arg0.height = arg1 >>> 0;
        }, arguments); },
        __wbg_set_height_ca39bd9597314f83: function() { return logError(function (arg0, arg1) {
            arg0.height = arg1 >>> 0;
        }, arguments); },
        __wbg_set_height_d72f2b76484a44de: function() { return logError(function (arg0, arg1) {
            arg0.height = arg1 >>> 0;
        }, arguments); },
        __wbg_set_label_0d9081f92dff44a8: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_22c92b4f74920fe2: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_392dc66ad76d942d: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_3e06143ad04772ae: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_4f44629bc3c49d4b: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_50f397060b5b5610: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_68e2953cfd33a5a5: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_76c4f74a38ff9bcd: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_79484ec4d6d85bbf: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_8031305fa610925b: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_83c85af4cf247cfd: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_861c8e348e26599d: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_c6d451b2fc960c7d: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_d1b6a326332d0520: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_d687cfb9a30329c8: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_dcf5143835b5d044: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_label_e345704005fb385b: function() { return logError(function (arg0, arg1, arg2) {
            arg0.label = getStringFromWasm0(arg1, arg2);
        }, arguments); },
        __wbg_set_layout_8e94366580ade994: function() { return logError(function (arg0, arg1) {
            arg0.layout = arg1;
        }, arguments); },
        __wbg_set_layout_b9b36c291ee7f2e1: function() { return logError(function (arg0, arg1) {
            arg0.layout = arg1;
        }, arguments); },
        __wbg_set_layout_cccbb8f794df887c: function() { return logError(function (arg0, arg1) {
            arg0.layout = arg1;
        }, arguments); },
        __wbg_set_load_op_4716d76153bebb14: function() { return logError(function (arg0, arg1) {
            arg0.loadOp = __wbindgen_enum_GpuLoadOp[arg1];
        }, arguments); },
        __wbg_set_lod_max_clamp_f42eca55c9217397: function() { return logError(function (arg0, arg1) {
            arg0.lodMaxClamp = arg1;
        }, arguments); },
        __wbg_set_lod_min_clamp_4d711017231cc5a0: function() { return logError(function (arg0, arg1) {
            arg0.lodMinClamp = arg1;
        }, arguments); },
        __wbg_set_mag_filter_ac0090a8079675c5: function() { return logError(function (arg0, arg1) {
            arg0.magFilter = __wbindgen_enum_GpuFilterMode[arg1];
        }, arguments); },
        __wbg_set_mapped_at_creation_34da9d6bf64b78d6: function() { return logError(function (arg0, arg1) {
            arg0.mappedAtCreation = arg1 !== 0;
        }, arguments); },
        __wbg_set_mask_250d8d1991cda6ea: function() { return logError(function (arg0, arg1) {
            arg0.mask = arg1 >>> 0;
        }, arguments); },
        __wbg_set_max_anisotropy_1042535ecf2aa351: function() { return logError(function (arg0, arg1) {
            arg0.maxAnisotropy = arg1;
        }, arguments); },
        __wbg_set_min_binding_size_9389ad67218af140: function() { return logError(function (arg0, arg1) {
            arg0.minBindingSize = arg1;
        }, arguments); },
        __wbg_set_min_filter_aef574957db07999: function() { return logError(function (arg0, arg1) {
            arg0.minFilter = __wbindgen_enum_GpuFilterMode[arg1];
        }, arguments); },
        __wbg_set_mip_level_1fe1b17b2d4930dc: function() { return logError(function (arg0, arg1) {
            arg0.mipLevel = arg1 >>> 0;
        }, arguments); },
        __wbg_set_mip_level_9dbc9d088b560d0a: function() { return logError(function (arg0, arg1) {
            arg0.mipLevel = arg1 >>> 0;
        }, arguments); },
        __wbg_set_mip_level_count_ce77bbcd6aa77dfb: function() { return logError(function (arg0, arg1) {
            arg0.mipLevelCount = arg1 >>> 0;
        }, arguments); },
        __wbg_set_mip_level_count_faa8a47d0fd87c1e: function() { return logError(function (arg0, arg1) {
            arg0.mipLevelCount = arg1 >>> 0;
        }, arguments); },
        __wbg_set_mipmap_filter_7879f073bcd8d466: function() { return logError(function (arg0, arg1) {
            arg0.mipmapFilter = __wbindgen_enum_GpuMipmapFilterMode[arg1];
        }, arguments); },
        __wbg_set_module_51b2f2e08accb016: function() { return logError(function (arg0, arg1) {
            arg0.module = arg1;
        }, arguments); },
        __wbg_set_module_5f33a55198ad797f: function() { return logError(function (arg0, arg1) {
            arg0.module = arg1;
        }, arguments); },
        __wbg_set_module_92f53f6a4172b60c: function() { return logError(function (arg0, arg1) {
            arg0.module = arg1;
        }, arguments); },
        __wbg_set_multisample_8fea65aa177ce42b: function() { return logError(function (arg0, arg1) {
            arg0.multisample = arg1;
        }, arguments); },
        __wbg_set_multisampled_b526741755338725: function() { return logError(function (arg0, arg1) {
            arg0.multisampled = arg1 !== 0;
        }, arguments); },
        __wbg_set_offset_1a0f95ffb7dd6f40: function() { return logError(function (arg0, arg1) {
            arg0.offset = arg1;
        }, arguments); },
        __wbg_set_offset_39885158a5562ef6: function() { return logError(function (arg0, arg1) {
            arg0.offset = arg1;
        }, arguments); },
        __wbg_set_offset_73eef07e0840c207: function() { return logError(function (arg0, arg1) {
            arg0.offset = arg1;
        }, arguments); },
        __wbg_set_offset_7742a652907a0dcc: function() { return logError(function (arg0, arg1) {
            arg0.offset = arg1;
        }, arguments); },
        __wbg_set_onuncapturederror_08dfd7cc581bbee3: function() { return logError(function (arg0, arg1) {
            arg0.onuncapturederror = arg1;
        }, arguments); },
        __wbg_set_operation_3f77d077d89e8104: function() { return logError(function (arg0, arg1) {
            arg0.operation = __wbindgen_enum_GpuBlendOperation[arg1];
        }, arguments); },
        __wbg_set_origin_0f783ac97d6931ee: function() { return logError(function (arg0, arg1) {
            arg0.origin = arg1;
        }, arguments); },
        __wbg_set_origin_b315d15931fdd138: function() { return logError(function (arg0, arg1) {
            arg0.origin = arg1;
        }, arguments); },
        __wbg_set_origin_ed8de26e4ab25e0c: function() { return logError(function (arg0, arg1) {
            arg0.origin = arg1;
        }, arguments); },
        __wbg_set_pass_op_f289598b9bf2b26f: function() { return logError(function (arg0, arg1) {
            arg0.passOp = __wbindgen_enum_GpuStencilOperation[arg1];
        }, arguments); },
        __wbg_set_power_preference_915480f4b9565dc2: function() { return logError(function (arg0, arg1) {
            arg0.powerPreference = __wbindgen_enum_GpuPowerPreference[arg1];
        }, arguments); },
        __wbg_set_premultiplied_alpha_28bbf5064131dc75: function() { return logError(function (arg0, arg1) {
            arg0.premultipliedAlpha = arg1 !== 0;
        }, arguments); },
        __wbg_set_primitive_65f0197724aa1998: function() { return logError(function (arg0, arg1) {
            arg0.primitive = arg1;
        }, arguments); },
        __wbg_set_query_set_0a78c3dcb3650b2b: function() { return logError(function (arg0, arg1) {
            arg0.querySet = arg1;
        }, arguments); },
        __wbg_set_query_set_3088af736d5ed6bb: function() { return logError(function (arg0, arg1) {
            arg0.querySet = arg1;
        }, arguments); },
        __wbg_set_r_1f5bdc587af1ad2e: function() { return logError(function (arg0, arg1) {
            arg0.r = arg1;
        }, arguments); },
        __wbg_set_required_features_42347bf311233eb6: function() { return logError(function (arg0, arg1) {
            arg0.requiredFeatures = arg1;
        }, arguments); },
        __wbg_set_resolve_target_d9752c5e8b620b01: function() { return logError(function (arg0, arg1) {
            arg0.resolveTarget = arg1;
        }, arguments); },
        __wbg_set_resource_f2d72f59cc9308fc: function() { return logError(function (arg0, arg1) {
            arg0.resource = arg1;
        }, arguments); },
        __wbg_set_rows_per_image_c93769be14a45b2d: function() { return logError(function (arg0, arg1) {
            arg0.rowsPerImage = arg1 >>> 0;
        }, arguments); },
        __wbg_set_rows_per_image_f3e25334bd0cdec8: function() { return logError(function (arg0, arg1) {
            arg0.rowsPerImage = arg1 >>> 0;
        }, arguments); },
        __wbg_set_sample_count_1e14cc980425e00a: function() { return logError(function (arg0, arg1) {
            arg0.sampleCount = arg1 >>> 0;
        }, arguments); },
        __wbg_set_sample_count_47378e3363905cfe: function() { return logError(function (arg0, arg1) {
            arg0.sampleCount = arg1 >>> 0;
        }, arguments); },
        __wbg_set_sample_type_6d1e240a417bdf44: function() { return logError(function (arg0, arg1) {
            arg0.sampleType = __wbindgen_enum_GpuTextureSampleType[arg1];
        }, arguments); },
        __wbg_set_sampler_f864a162bad4f66f: function() { return logError(function (arg0, arg1) {
            arg0.sampler = arg1;
        }, arguments); },
        __wbg_set_shader_location_512e18558f4b5044: function() { return logError(function (arg0, arg1) {
            arg0.shaderLocation = arg1 >>> 0;
        }, arguments); },
        __wbg_set_size_657d97f8d513b5e9: function() { return logError(function (arg0, arg1) {
            arg0.size = arg1;
        }, arguments); },
        __wbg_set_size_6b2fc4a0e39e4d07: function() { return logError(function (arg0, arg1) {
            arg0.size = arg1;
        }, arguments); },
        __wbg_set_size_c78ae8d2e2181815: function() { return logError(function (arg0, arg1) {
            arg0.size = arg1;
        }, arguments); },
        __wbg_set_source_8794557a59a4c226: function() { return logError(function (arg0, arg1) {
            arg0.source = arg1;
        }, arguments); },
        __wbg_set_src_factor_f6d030d42c740795: function() { return logError(function (arg0, arg1) {
            arg0.srcFactor = __wbindgen_enum_GpuBlendFactor[arg1];
        }, arguments); },
        __wbg_set_stencil_back_445dca081a7a482f: function() { return logError(function (arg0, arg1) {
            arg0.stencilBack = arg1;
        }, arguments); },
        __wbg_set_stencil_clear_value_1ff6e0286bac04f0: function() { return logError(function (arg0, arg1) {
            arg0.stencilClearValue = arg1 >>> 0;
        }, arguments); },
        __wbg_set_stencil_front_c2e7583fc42d1289: function() { return logError(function (arg0, arg1) {
            arg0.stencilFront = arg1;
        }, arguments); },
        __wbg_set_stencil_load_op_aa4f07acdc265e20: function() { return logError(function (arg0, arg1) {
            arg0.stencilLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
        }, arguments); },
        __wbg_set_stencil_read_mask_fa2e080bf4e50296: function() { return logError(function (arg0, arg1) {
            arg0.stencilReadMask = arg1 >>> 0;
        }, arguments); },
        __wbg_set_stencil_read_only_20584635b795b50a: function() { return logError(function (arg0, arg1) {
            arg0.stencilReadOnly = arg1 !== 0;
        }, arguments); },
        __wbg_set_stencil_read_only_c668e2f4792200dc: function() { return logError(function (arg0, arg1) {
            arg0.stencilReadOnly = arg1 !== 0;
        }, arguments); },
        __wbg_set_stencil_store_op_817f5569dcbe011c: function() { return logError(function (arg0, arg1) {
            arg0.stencilStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
        }, arguments); },
        __wbg_set_stencil_write_mask_cd78f765a9d1922b: function() { return logError(function (arg0, arg1) {
            arg0.stencilWriteMask = arg1 >>> 0;
        }, arguments); },
        __wbg_set_step_mode_957a94d543f8cb9c: function() { return logError(function (arg0, arg1) {
            arg0.stepMode = __wbindgen_enum_GpuVertexStepMode[arg1];
        }, arguments); },
        __wbg_set_storage_texture_c3919f22b211c542: function() { return logError(function (arg0, arg1) {
            arg0.storageTexture = arg1;
        }, arguments); },
        __wbg_set_store_op_cbb1498982c43f58: function() { return logError(function (arg0, arg1) {
            arg0.storeOp = __wbindgen_enum_GpuStoreOp[arg1];
        }, arguments); },
        __wbg_set_strip_index_format_cf0e1ae7ebc6e801: function() { return logError(function (arg0, arg1) {
            arg0.stripIndexFormat = __wbindgen_enum_GpuIndexFormat[arg1];
        }, arguments); },
        __wbg_set_targets_ed82ec017a08e9be: function() { return logError(function (arg0, arg1) {
            arg0.targets = arg1;
        }, arguments); },
        __wbg_set_texture_4d59304aca7817f2: function() { return logError(function (arg0, arg1) {
            arg0.texture = arg1;
        }, arguments); },
        __wbg_set_texture_a2c2ca844a3a3014: function() { return logError(function (arg0, arg1) {
            arg0.texture = arg1;
        }, arguments); },
        __wbg_set_texture_bf820de044f0d291: function() { return logError(function (arg0, arg1) {
            arg0.texture = arg1;
        }, arguments); },
        __wbg_set_timestamp_writes_2c9801ffc2c74de7: function() { return logError(function (arg0, arg1) {
            arg0.timestampWrites = arg1;
        }, arguments); },
        __wbg_set_timestamp_writes_b9e1d87e2f057bd1: function() { return logError(function (arg0, arg1) {
            arg0.timestampWrites = arg1;
        }, arguments); },
        __wbg_set_topology_e97a4999800a37a9: function() { return logError(function (arg0, arg1) {
            arg0.topology = __wbindgen_enum_GpuPrimitiveTopology[arg1];
        }, arguments); },
        __wbg_set_type_40f4ae4fa32946cd: function() { return logError(function (arg0, arg1) {
            arg0.type = __wbindgen_enum_GpuBufferBindingType[arg1];
        }, arguments); },
        __wbg_set_type_4f1cd48d79f4d6dc: function() { return logError(function (arg0, arg1) {
            arg0.type = __wbindgen_enum_GpuSamplerBindingType[arg1];
        }, arguments); },
        __wbg_set_type_90c8feb4413481b1: function() { return logError(function (arg0, arg1) {
            arg0.type = __wbindgen_enum_GpuQueryType[arg1];
        }, arguments); },
        __wbg_set_usage_794d488202743c10: function() { return logError(function (arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        }, arguments); },
        __wbg_set_usage_9aa23fa1e13799a8: function() { return logError(function (arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        }, arguments); },
        __wbg_set_usage_ba31cd3d9ce977fe: function() { return logError(function (arg0, arg1) {
            arg0.usage = arg1 >>> 0;
        }, arguments); },
        __wbg_set_vertex_90d5407453f59d4a: function() { return logError(function (arg0, arg1) {
            arg0.vertex = arg1;
        }, arguments); },
        __wbg_set_view_36f140b43e2eca60: function() { return logError(function (arg0, arg1) {
            arg0.view = arg1;
        }, arguments); },
        __wbg_set_view_51a85be8f2338ed2: function() { return logError(function (arg0, arg1) {
            arg0.view = arg1;
        }, arguments); },
        __wbg_set_view_dimension_36c0bf530395d014: function() { return logError(function (arg0, arg1) {
            arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        }, arguments); },
        __wbg_set_view_dimension_553cd9fa176d06ca: function() { return logError(function (arg0, arg1) {
            arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
        }, arguments); },
        __wbg_set_view_formats_0a8a8e11cfa73759: function() { return logError(function (arg0, arg1) {
            arg0.viewFormats = arg1;
        }, arguments); },
        __wbg_set_visibility_eef2d8e9608a8981: function() { return logError(function (arg0, arg1) {
            arg0.visibility = arg1 >>> 0;
        }, arguments); },
        __wbg_set_width_36ef6630b22fc519: function() { return logError(function (arg0, arg1) {
            arg0.width = arg1 >>> 0;
        }, arguments); },
        __wbg_set_width_60b542bb7870a825: function() { return logError(function (arg0, arg1) {
            arg0.width = arg1 >>> 0;
        }, arguments); },
        __wbg_set_width_661c95ea46b71eba: function() { return logError(function (arg0, arg1) {
            arg0.width = arg1 >>> 0;
        }, arguments); },
        __wbg_set_write_mask_6d312328ac2d4d97: function() { return logError(function (arg0, arg1) {
            arg0.writeMask = arg1 >>> 0;
        }, arguments); },
        __wbg_set_x_29ba832907a8e90c: function() { return logError(function (arg0, arg1) {
            arg0.x = arg1 >>> 0;
        }, arguments); },
        __wbg_set_x_d11527965ec29a57: function() { return logError(function (arg0, arg1) {
            arg0.x = arg1 >>> 0;
        }, arguments); },
        __wbg_set_y_1883209e3ffad610: function() { return logError(function (arg0, arg1) {
            arg0.y = arg1 >>> 0;
        }, arguments); },
        __wbg_set_y_55ef7c361345d5fd: function() { return logError(function (arg0, arg1) {
            arg0.y = arg1 >>> 0;
        }, arguments); },
        __wbg_set_z_dc148d1e458d403e: function() { return logError(function (arg0, arg1) {
            arg0.z = arg1 >>> 0;
        }, arguments); },
        __wbg_shaderSource_7d3f360b4b626db7: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_shaderSource_dcba4cd3379b35bd: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_size_89ae8d3401867305: function() { return logError(function (arg0) {
            const ret = arg0.size;
            return ret;
        }, arguments); },
        __wbg_stack_3b0d974bbf31e44f: function() { return logError(function (arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        }, arguments); },
        __wbg_static_accessor_CREATE_TASK_307e3054ac4aa976: function() { return logError(function () {
            const ret = typeof console === 'undefined' ? null : console?.createTask;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_static_accessor_GLOBAL_THIS_466428f93b4eaa76: function() { return logError(function () {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_static_accessor_GLOBAL_c7aea38d4de089bc: function() { return logError(function () {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_static_accessor_SELF_42d4fae05e59267a: function() { return logError(function () {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_static_accessor_WINDOW_e0db14a0eba6a812: function() { return logError(function () {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        }, arguments); },
        __wbg_stencilFuncSeparate_1455ac65895207da: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
        }, arguments); },
        __wbg_stencilFuncSeparate_55627e589746e09f: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
        }, arguments); },
        __wbg_stencilMaskSeparate_85d929ff95496631: function() { return logError(function (arg0, arg1, arg2) {
            arg0.stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
        }, arguments); },
        __wbg_stencilMaskSeparate_8e37bf59a93afc15: function() { return logError(function (arg0, arg1, arg2) {
            arg0.stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
        }, arguments); },
        __wbg_stencilMask_020d2d7ea8e4f640: function() { return logError(function (arg0, arg1) {
            arg0.stencilMask(arg1 >>> 0);
        }, arguments); },
        __wbg_stencilMask_967f16a89bfd056a: function() { return logError(function (arg0, arg1) {
            arg0.stencilMask(arg1 >>> 0);
        }, arguments); },
        __wbg_stencilOpSeparate_1f45c75c83dad8d5: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        }, arguments); },
        __wbg_stencilOpSeparate_33a6764dd0ce6e24: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        }, arguments); },
        __wbg_submit_2521bdd9a232bca7: function() { return logError(function (arg0, arg1) {
            arg0.submit(arg1);
        }, arguments); },
        __wbg_texImage2D_053488112c3d702f: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texImage2D_2854247ff7d047a1: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texImage2D_44740302c934daf1: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texImage3D_d23f7d2f9e66b916: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
            arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
        }, arguments); },
        __wbg_texImage3D_faae3ea3f2969ecc: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
            arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
        }, arguments); },
        __wbg_texParameteri_2bc38aa8e9964d77: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
        }, arguments); },
        __wbg_texParameteri_dd4f56c2acbbe859: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
        }, arguments); },
        __wbg_texStorage2D_d473a12d49d7deee: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.texStorage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
        }, arguments); },
        __wbg_texStorage3D_3ceb25ba9ad4b7ac: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.texStorage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6);
        }, arguments); },
        __wbg_texSubImage2D_1b383b66dfe35010: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texSubImage2D_205cfbaea80e77e6: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texSubImage2D_606540d3e650e0bb: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texSubImage2D_62ae3d4b2700f7cd: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texSubImage2D_6eb05d8f455f99ba: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texSubImage2D_a035d2307e014a73: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texSubImage2D_ad5a64d8f68a2d0d: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texSubImage2D_cb9ad676165c5da5: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
        }, arguments); },
        __wbg_texSubImage3D_09e44c66b4ac6bc6: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
            arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
        }, arguments); },
        __wbg_texSubImage3D_16678785ac62fd6b: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
            arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
        }, arguments); },
        __wbg_texSubImage3D_3ee8764dfdcb6746: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
            arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
        }, arguments); },
        __wbg_texSubImage3D_53489be691cee78d: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
            arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
        }, arguments); },
        __wbg_texSubImage3D_73d365baf8dad003: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
            arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
        }, arguments); },
        __wbg_texSubImage3D_8a2331639ee1ee0e: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
            arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
        }, arguments); },
        __wbg_texSubImage3D_9b0bd9fd73d7bb1c: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
            arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
        }, arguments); },
        __wbg_then_03887f33d8da4f96: function() { return logError(function (arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        }, arguments); },
        __wbg_then_7026b513a94278a8: function() { return logError(function (arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        }, arguments); },
        __wbg_then_72819b8d4e081fb5: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_then_f730e17d115c60b2: function() { return logError(function (arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_uniform1f_e92095ce29c38424: function() { return logError(function (arg0, arg1, arg2) {
            arg0.uniform1f(arg1, arg2);
        }, arguments); },
        __wbg_uniform1f_e93503bc589b432d: function() { return logError(function (arg0, arg1, arg2) {
            arg0.uniform1f(arg1, arg2);
        }, arguments); },
        __wbg_uniform1i_235dff1d94e0df95: function() { return logError(function (arg0, arg1, arg2) {
            arg0.uniform1i(arg1, arg2);
        }, arguments); },
        __wbg_uniform1i_d5db9c3184abbd04: function() { return logError(function (arg0, arg1, arg2) {
            arg0.uniform1i(arg1, arg2);
        }, arguments); },
        __wbg_uniform1ui_8bbaaa1161bfd433: function() { return logError(function (arg0, arg1, arg2) {
            arg0.uniform1ui(arg1, arg2 >>> 0);
        }, arguments); },
        __wbg_uniform2fv_1443080aaf9c1077: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform2fv_b039f28911c30526: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform2iv_9648a06d054a25aa: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform2iv_e0496dc424dc25ec: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform2uiv_935dfb31f50dfbe3: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform2uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform3fv_025760367cc4eed3: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform3fv_b985d45f54156d3b: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform3iv_193b7a0e1ae9ac9a: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform3iv_63e82687b07e66fc: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform3uiv_ccd86b78a5fb3077: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform3uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform4f_61192d516e9bede4: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.uniform4f(arg1, arg2, arg3, arg4, arg5);
        }, arguments); },
        __wbg_uniform4f_d9bb623add5d2541: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.uniform4f(arg1, arg2, arg3, arg4, arg5);
        }, arguments); },
        __wbg_uniform4fv_c39527800fc76c8e: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform4fv_fcff56a650906708: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform4iv_197c2f54a8dfb5c2: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform4iv_9e6e36f0e1d1f84d: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniform4uiv_73fc9e298d02c948: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniform4uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
        }, arguments); },
        __wbg_uniformBlockBinding_057177606c8b522f: function() { return logError(function (arg0, arg1, arg2, arg3) {
            arg0.uniformBlockBinding(arg1, arg2 >>> 0, arg3 >>> 0);
        }, arguments); },
        __wbg_uniformMatrix2fv_013723900a9cb65c: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix2fv_fb61eccac67a8218: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix2x3fv_de8b00219f47ffb4: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix2x4fv_e659cc34e95fee5e: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix3fv_3e548032fc28c3e2: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix3fv_72ca83d3393e0364: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix3x2fv_8598636e806d318d: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix3x4fv_277fbf38db85e612: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix4fv_20161efad644f822: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix4fv_8689fd0481ac5ab4: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix4x2fv_e91bd4e774f6266d: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_uniformMatrix4x3fv_a829c88dfd0c29d3: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        }, arguments); },
        __wbg_unmap_815a075fd850cb73: function() { return logError(function (arg0) {
            arg0.unmap();
        }, arguments); },
        __wbg_usage_ce592e1220bc8469: function() { return logError(function (arg0) {
            const ret = arg0.usage;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_useProgram_1c047de878f20b72: function() { return logError(function (arg0, arg1) {
            arg0.useProgram(arg1);
        }, arguments); },
        __wbg_useProgram_9edff145e073d3b1: function() { return logError(function (arg0, arg1) {
            arg0.useProgram(arg1);
        }, arguments); },
        __wbg_valueOf_a8a77b9f1e9bfd39: function() { return logError(function (arg0) {
            const ret = arg0.valueOf();
            return ret;
        }, arguments); },
        __wbg_value_1e2369fab29b420e: function() { return logError(function (arg0) {
            const ret = arg0.value;
            return ret;
        }, arguments); },
        __wbg_vertexAttribDivisorANGLE_581f060f68a0c850: function() { return logError(function (arg0, arg1, arg2) {
            arg0.vertexAttribDivisorANGLE(arg1 >>> 0, arg2 >>> 0);
        }, arguments); },
        __wbg_vertexAttribDivisor_f910af52b19ce382: function() { return logError(function (arg0, arg1, arg2) {
            arg0.vertexAttribDivisor(arg1 >>> 0, arg2 >>> 0);
        }, arguments); },
        __wbg_vertexAttribIPointer_54e6be6fa5e39567: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.vertexAttribIPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
        }, arguments); },
        __wbg_vertexAttribPointer_7bc186aca7721b90: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
        }, arguments); },
        __wbg_vertexAttribPointer_b0838f8618a8c446: function() { return logError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
        }, arguments); },
        __wbg_videoHeight_366d8642c2f751ef: function() { return logError(function (arg0) {
            const ret = arg0.videoHeight;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_videoWidth_b3db67c306038bbe: function() { return logError(function (arg0) {
            const ret = arg0.videoWidth;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_viewport_07bb1829f0fe2245: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.viewport(arg1, arg2, arg3, arg4);
        }, arguments); },
        __wbg_viewport_dfe81d333ce7be86: function() { return logError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.viewport(arg1, arg2, arg3, arg4);
        }, arguments); },
        __wbg_wasmrenderer_new: function() { return logError(function (arg0) {
            const ret = WasmRenderer.__wrap(arg0);
            return ret;
        }, arguments); },
        __wbg_wgslLanguageFeatures_afbb792e5e6b2d77: function() { return logError(function (arg0) {
            const ret = arg0.wgslLanguageFeatures;
            return ret;
        }, arguments); },
        __wbg_width_1952934caca67137: function() { return logError(function (arg0) {
            const ret = arg0.width;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_width_20a4245f8941072f: function() { return logError(function (arg0) {
            const ret = arg0.width;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_width_4bb073b449891b57: function() { return logError(function (arg0) {
            const ret = arg0.width;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_width_534fef037caa5f9b: function() { return logError(function (arg0) {
            const ret = arg0.width;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_width_aeade399d283e83a: function() { return logError(function (arg0) {
            const ret = arg0.width;
            _assertNum(ret);
            return ret;
        }, arguments); },
        __wbg_writeBuffer_e8b792fb0962f30d: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.writeBuffer(arg1, arg2, arg3, arg4, arg5);
        }, arguments); },
        __wbg_writeTexture_d97144f6ad799c38: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
            arg0.writeTexture(arg1, arg2, arg3, arg4);
        }, arguments); },
        __wbindgen_cast_0000000000000001: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 2594, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen__convert__closures_____invoke__h43e9943cf2c4f3e9);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000002: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 713, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen__convert__closures_____invoke__h28ca0ccefdd47645);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000003: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [NamedExternref("GPUUncapturedErrorEvent")], shim_idx: 714, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen__convert__closures_____invoke__h4a9ffdf99e28b405);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000004: function() { return logError(function (arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000005: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(F32)) -> NamedExternref("Float32Array")`.
            const ret = getArrayF32FromWasm0(arg0, arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000006: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(I16)) -> NamedExternref("Int16Array")`.
            const ret = getArrayI16FromWasm0(arg0, arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000007: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(I32)) -> NamedExternref("Int32Array")`.
            const ret = getArrayI32FromWasm0(arg0, arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000008: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(I8)) -> NamedExternref("Int8Array")`.
            const ret = getArrayI8FromWasm0(arg0, arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000009: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U16)) -> NamedExternref("Uint16Array")`.
            const ret = getArrayU16FromWasm0(arg0, arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_000000000000000a: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U32)) -> NamedExternref("Uint32Array")`.
            const ret = getArrayU32FromWasm0(arg0, arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_000000000000000b: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_000000000000000c: function() { return logError(function (arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_000000000000000d: function() { return logError(function (arg0, arg1) {
            var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 1, 1);
            // Cast intrinsic for `Vector(U8) -> Externref`.
            const ret = v0;
            return ret;
        }, arguments); },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./clypra_render_wasm_bg.js": import0,
    };
}


//#endregion
function wasm_bindgen__convert__closures_____invoke__hf578ab18b69ee5d0(arg0, arg1) {
    _assertNum(arg0);
    _assertNum(arg1);
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__hf578ab18b69ee5d0(arg0, arg1);
    return ret !== 0;
}

function wasm_bindgen__convert__closures_____invoke__h28ca0ccefdd47645(arg0, arg1, arg2) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.wasm_bindgen__convert__closures_____invoke__h28ca0ccefdd47645(arg0, arg1, arg2);
}

function wasm_bindgen__convert__closures_____invoke__h4a9ffdf99e28b405(arg0, arg1, arg2) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.wasm_bindgen__convert__closures_____invoke__h4a9ffdf99e28b405(arg0, arg1, arg2);
}

function wasm_bindgen__convert__closures_____invoke__h43e9943cf2c4f3e9(arg0, arg1, arg2) {
    _assertNum(arg0);
    _assertNum(arg1);
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__h43e9943cf2c4f3e9(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen__convert__closures_____invoke__h6890542ec23ad306(arg0, arg1, arg2, arg3) {
    _assertNum(arg0);
    _assertNum(arg1);
    wasm.wasm_bindgen__convert__closures_____invoke__h6890542ec23ad306(arg0, arg1, arg2, arg3);
}


const __wbindgen_enum_GpuAddressMode = ["clamp-to-edge", "repeat", "mirror-repeat"];


const __wbindgen_enum_GpuBlendFactor = ["zero", "one", "src", "one-minus-src", "src-alpha", "one-minus-src-alpha", "dst", "one-minus-dst", "dst-alpha", "one-minus-dst-alpha", "src-alpha-saturated", "constant", "one-minus-constant", "src1", "one-minus-src1", "src1-alpha", "one-minus-src1-alpha"];


const __wbindgen_enum_GpuBlendOperation = ["add", "subtract", "reverse-subtract", "min", "max"];


const __wbindgen_enum_GpuBufferBindingType = ["uniform", "storage", "read-only-storage"];


const __wbindgen_enum_GpuCompareFunction = ["never", "less", "equal", "less-equal", "greater", "not-equal", "greater-equal", "always"];


const __wbindgen_enum_GpuCullMode = ["none", "front", "back"];


const __wbindgen_enum_GpuDeviceLostReason = ["unknown", "destroyed"];


const __wbindgen_enum_GpuErrorFilter = ["validation", "out-of-memory", "internal"];


const __wbindgen_enum_GpuFilterMode = ["nearest", "linear"];


const __wbindgen_enum_GpuFrontFace = ["ccw", "cw"];


const __wbindgen_enum_GpuIndexFormat = ["uint16", "uint32"];


const __wbindgen_enum_GpuLoadOp = ["load", "clear"];


const __wbindgen_enum_GpuMipmapFilterMode = ["nearest", "linear"];


const __wbindgen_enum_GpuPowerPreference = ["low-power", "high-performance"];


const __wbindgen_enum_GpuPrimitiveTopology = ["point-list", "line-list", "line-strip", "triangle-list", "triangle-strip"];


const __wbindgen_enum_GpuQueryType = ["occlusion", "timestamp"];


const __wbindgen_enum_GpuSamplerBindingType = ["filtering", "non-filtering", "comparison"];


const __wbindgen_enum_GpuStencilOperation = ["keep", "zero", "replace", "invert", "increment-clamp", "decrement-clamp", "increment-wrap", "decrement-wrap"];


const __wbindgen_enum_GpuStorageTextureAccess = ["write-only", "read-only", "read-write"];


const __wbindgen_enum_GpuStoreOp = ["store", "discard"];


const __wbindgen_enum_GpuTextureAspect = ["all", "stencil-only", "depth-only"];


const __wbindgen_enum_GpuTextureDimension = ["1d", "2d", "3d"];


const __wbindgen_enum_GpuTextureFormat = ["r8unorm", "r8snorm", "r8uint", "r8sint", "r16uint", "r16sint", "r16float", "rg8unorm", "rg8snorm", "rg8uint", "rg8sint", "r32uint", "r32sint", "r32float", "rg16uint", "rg16sint", "rg16float", "rgba8unorm", "rgba8unorm-srgb", "rgba8snorm", "rgba8uint", "rgba8sint", "bgra8unorm", "bgra8unorm-srgb", "rgb9e5ufloat", "rgb10a2uint", "rgb10a2unorm", "rg11b10ufloat", "rg32uint", "rg32sint", "rg32float", "rgba16uint", "rgba16sint", "rgba16float", "rgba32uint", "rgba32sint", "rgba32float", "stencil8", "depth16unorm", "depth24plus", "depth24plus-stencil8", "depth32float", "depth32float-stencil8", "bc1-rgba-unorm", "bc1-rgba-unorm-srgb", "bc2-rgba-unorm", "bc2-rgba-unorm-srgb", "bc3-rgba-unorm", "bc3-rgba-unorm-srgb", "bc4-r-unorm", "bc4-r-snorm", "bc5-rg-unorm", "bc5-rg-snorm", "bc6h-rgb-ufloat", "bc6h-rgb-float", "bc7-rgba-unorm", "bc7-rgba-unorm-srgb", "etc2-rgb8unorm", "etc2-rgb8unorm-srgb", "etc2-rgb8a1unorm", "etc2-rgb8a1unorm-srgb", "etc2-rgba8unorm", "etc2-rgba8unorm-srgb", "eac-r11unorm", "eac-r11snorm", "eac-rg11unorm", "eac-rg11snorm", "astc-4x4-unorm", "astc-4x4-unorm-srgb", "astc-5x4-unorm", "astc-5x4-unorm-srgb", "astc-5x5-unorm", "astc-5x5-unorm-srgb", "astc-6x5-unorm", "astc-6x5-unorm-srgb", "astc-6x6-unorm", "astc-6x6-unorm-srgb", "astc-8x5-unorm", "astc-8x5-unorm-srgb", "astc-8x6-unorm", "astc-8x6-unorm-srgb", "astc-8x8-unorm", "astc-8x8-unorm-srgb", "astc-10x5-unorm", "astc-10x5-unorm-srgb", "astc-10x6-unorm", "astc-10x6-unorm-srgb", "astc-10x8-unorm", "astc-10x8-unorm-srgb", "astc-10x10-unorm", "astc-10x10-unorm-srgb", "astc-12x10-unorm", "astc-12x10-unorm-srgb", "astc-12x12-unorm", "astc-12x12-unorm-srgb"];


const __wbindgen_enum_GpuTextureSampleType = ["float", "unfilterable-float", "depth", "sint", "uint"];


const __wbindgen_enum_GpuTextureViewDimension = ["1d", "2d", "2d-array", "cube", "cube-array", "3d"];


const __wbindgen_enum_GpuVertexFormat = ["uint8", "uint8x2", "uint8x4", "sint8", "sint8x2", "sint8x4", "unorm8", "unorm8x2", "unorm8x4", "snorm8", "snorm8x2", "snorm8x4", "uint16", "uint16x2", "uint16x4", "sint16", "sint16x2", "sint16x4", "unorm16", "unorm16x2", "unorm16x4", "snorm16", "snorm16x2", "snorm16x4", "float16", "float16x2", "float16x4", "float32", "float32x2", "float32x3", "float32x4", "uint32", "uint32x2", "uint32x3", "uint32x4", "sint32", "sint32x2", "sint32x3", "sint32x4", "unorm10-10-10-2", "unorm8x4-bgra"];


const __wbindgen_enum_GpuVertexStepMode = ["vertex", "instance"];
const WasmRendererFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmrenderer_free(ptr, 1));


//#region intrinsics
function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertBoolean(n) {
    if (typeof(n) !== 'boolean') {
        throw new Error(`expected a boolean argument, found ${typeof(n)}`);
    }
}

function _assertNum(n) {
    if (typeof(n) !== 'number') throw new Error(`expected a number argument, found ${typeof(n)}`);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_destroy_closure(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayI16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayI8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getArrayU16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

let cachedInt16ArrayMemory0 = null;
function getInt16ArrayMemory0() {
    if (cachedInt16ArrayMemory0 === null || cachedInt16ArrayMemory0.byteLength === 0) {
        cachedInt16ArrayMemory0 = new Int16Array(wasm.memory.buffer);
    }
    return cachedInt16ArrayMemory0;
}

let cachedInt32ArrayMemory0 = null;
function getInt32ArrayMemory0() {
    if (cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0) {
        cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32ArrayMemory0;
}

let cachedInt8ArrayMemory0 = null;
function getInt8ArrayMemory0() {
    if (cachedInt8ArrayMemory0 === null || cachedInt8ArrayMemory0.byteLength === 0) {
        cachedInt8ArrayMemory0 = new Int8Array(wasm.memory.buffer);
    }
    return cachedInt8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint16ArrayMemory0 = null;
function getUint16ArrayMemory0() {
    if (cachedUint16ArrayMemory0 === null || cachedUint16ArrayMemory0.byteLength === 0) {
        cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16ArrayMemory0;
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function logError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        let error = (function () {
            try {
                return e instanceof Error ? `${e.message}\n\nStack:\n${e.stack}` : e.toString();
            } catch(_) {
                return "<failed to stringify thrown value>";
            }
        }());
        console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
        throw e;
    }
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_destroy_closure(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (typeof(arg) !== 'string') throw new Error(`expected a string argument, found ${typeof(arg)}`);
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);
        if (ret.read !== arg.length) throw new Error('failed to pass whole string');
        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;


//#endregion

//#region wasm loading
let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedInt16ArrayMemory0 = null;
    cachedInt32ArrayMemory0 = null;
    cachedInt8ArrayMemory0 = null;
    cachedUint16ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL(/* @vite-ignore */ 'clypra_render_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
//#endregion
export { wasm as __wasm }
