# Runtime Capability Validation

This document tracks the validation status of the Clypra V2 runtime.

**Philosophy:** Validate capabilities, not effects. Each capability must be proven before building on top of it.

## Current Status

🔴 **Pipeline Skeleton Wired** - Not yet validated  
⏸️ **GPU Execution** - Awaiting capability validation

## Validation Checklist

### ✅ Capability 0: Architecture Wiring

**Status:** COMPLETE

**What was validated:**

```
Effect Selection
  ↓
GraphBuilder (Compiler)
  ↓
FrameGraphPlanner (Planner)
  ↓
PixiRenderer
  ↓
Canvas
```

**Evidence:**

- GraphBuilder creates processing graphs
- Planner generates frame graphs with resource requests
- Renderer initializes and accepts frame graphs
- PreviewCanvas hosts Pixi application

**Not yet validated:**

- Actual GPU execution
- Correctness of output
- Resource management
- Performance characteristics

---

### 🔴 Capability 1: Identity Pass

**Status:** IN PROGRESS

**Objective:** Validate the most fundamental capability - pass-through rendering.

**What must work:**

- ✅ Texture upload to GPU
- ⏸️ Texture reuse across frames
- ⏸️ Frame synchronization
- ⏸️ Resize handling
- ⏸️ Seeking in video
- ⏸️ Playback stability
- ⏸️ Pixel-perfect pass-through

**Test Coverage:**

- `src/__tests__/identity-pass.test.ts` (requires WebGL environment)

**Manual Validation Steps:**

1. Upload video to Video Lab
2. Select no effect (or create Identity effect)
3. Play video - should show original without modification
4. Seek to different timestamps - should update correctly
5. Pause/play - should be stable
6. Check FPS counter - should maintain 60 FPS

**Success Criteria:**

- Output pixels match input pixels (tolerance: ±2 per channel)
- No visual artifacts
- Stable 60 FPS playback
- Clean seeking with no flicker
- Resource cleanup (no memory leaks)

**Current Issues:**

- Identity filter not yet added to effect library
- No visual way to verify pixel accuracy in UI

---

### 🔴 Capability 2: Uniform-Driven Shader

**Status:** NOT STARTED

**Effect:** Brightness

**What must work:**

- Parameter passing to GPU
- Real-time uniform updates
- Hot reload on parameter change
- Slider-driven changes (no lag)
- Parameter validation

**Test Cases:**

1. Set brightness = 0.0 → Image should be black
2. Set brightness = 1.0 → Image unchanged
3. Set brightness = 2.0 → Image brightened
4. Move slider rapidly → Should update smoothly
5. Reset parameters → Should return to default

**Success Criteria:**

- Changes visible within 1 frame (16ms)
- No stuttering during parameter adjustments
- Correct mathematical application of uniform
- Min/max clamping works correctly

---

### 🔴 Capability 3: Multiple Sequential Passes

**Status:** NOT STARTED

**Effect Chain:** Brightness → Contrast → Saturation

**What must work:**

- Pass ordering (execution order)
- Intermediate texture allocation
- Ping-pong buffering
- Resource lifecycle

**Architecture Questions to Answer:**

- Does planner correctly order passes?
- Are intermediate textures allocated?
- Are resources cleaned up after use?
- Can we visualize pass order in inspector?

**Test Cases:**

1. Apply Brightness + Contrast in sequence
2. Apply Brightness + Contrast + Saturation
3. Verify execution order matches graph order
4. Check intermediate texture allocation in inspector

**Success Criteria:**

- Passes execute in correct order
- Output matches expected composed result
- No resource leaks
- Inspector shows correct pass count

---

### 🔴 Capability 4: Multipass (Single Effect)

**Status:** NOT STARTED

**Effect:** Gaussian Blur (Horizontal → Vertical)

**What must work:**

- Single effect generates multiple passes
- Temporary texture allocation
- Pass dependencies
- Resource recycling

**Planner Questions:**

- Does planner allocate: `Input → Temp → Output`?
- Or: `Input → TempA → TempB → Output`?
- Are temp textures marked transient?
- Does resource manager recycle textures?

**Test Cases:**

1. Apply Gaussian Blur
2. Inspect frame graph - should show 2 passes
3. Check resource allocation - should have 1 temp texture
4. Apply Blur at different resolutions
5. Verify temp textures are cleaned up

**Success Criteria:**

- Exactly 2 passes generated (H + V)
- Correct blur result (matches reference)
- Temp textures allocated and freed
- No memory growth over time

---

### 🔴 Capability 5: Procedural Effects

**Status:** NOT STARTED

**Effect:** Film Grain

**What must work:**

- Time-based uniforms
- Random seed management
- Deterministic rendering
- Frame-locked noise

**Critical Test - Deterministic Rendering:**

```
Render Frame 100
  ↓
Capture Output A

Render Frame 100 again
  ↓
Capture Output B

A must equal B (pixel-perfect match)
```

**Why This Matters:**

- Export must be frame-accurate
- Scrubbing must be consistent
- Golden tests must be reproducible

**Test Cases:**

1. Render same frame twice - must match exactly
2. Seek to frame N, render - must match previous render of frame N
3. Pause and play - grain pattern must be stable
4. Export frames 1-100 twice - must be identical

**Success Criteria:**

- Deterministic output (same frame = same pixels)
- Grain pattern matches time/seed formula
- No temporal flickering
- Export reliability

---

### 🔴 Capability 6: Composite Effects

**Status:** NOT STARTED

**Effect:** Bloom (Threshold → Blur → Composite)

**What must work:**

- Multiple inputs to single pass
- Blending modes
- Intermediate texture management
- Multi-stage pipelines

**Architecture Validation:**

```
Input
  ↓
Threshold → Bright texture
  ↓
Blur H → Temp A
  ↓
Blur V → Temp B
  ↓
Composite (Input + Temp B) → Output
```

**Test Cases:**

1. Apply Bloom effect
2. Verify pass count (should be 4+)
3. Check intermediate textures allocated
4. Verify blend mode applied correctly
5. Test at different threshold values

**Success Criteria:**

- Correct number of passes
- Blending mathematically correct
- No artifacts at blend boundaries
- Resources properly managed

---

### 🔴 Capability 7: Geometry Effects

**Status:** NOT STARTED

**Effect:** Wave / Shockwave

**What must work:**

- Vertex shader execution
- Geometry manipulation
- UV coordinate transformation
- Edge handling

---

### 🔴 Capability 8: Temporal Effects

**Status:** NOT STARTED

**Effect:** Motion Blur / Echo

**What must work:**

- Frame history management
- Temporal radius handling
- Frame buffer management
- Lookback/lookahead

---

### 🔴 Capability 9: Dual-Input Effects

**Status:** NOT STARTED

**Effect:** Chroma Key (Video + Key Color)

**What must work:**

- Multiple input textures
- Input synchronization
- Parameter + texture inputs

---

### 🔴 Capability 10: Feature Provider Integration

**Status:** NOT STARTED

**Effect:** Segmentation Blur

**What must work:**

- Feature map generation
- Feature map as input
- Conditional rendering based on features
- Performance with ML inference

---

## Runtime Inspector Requirements

### Phase 1: Timing Panel

```
Frame  492
-------------------
Compile    0.12 ms
Planner    0.04 ms
GPU Encode 0.01 ms
GPU Render 0.71 ms
Present    0.03 ms
-------------------
FPS: 60
```

### Phase 2: Resource Panel

```
Passes:       4
Textures:     3
  Allocated:  2
  Reused:     1
Peak VRAM:    14 MB
```

### Phase 3: Graph Visualization

```
Video
  ↓ (0.1ms)
Brightness
  ↓ (0.2ms)
Contrast
  ↓ (0.3ms)
Blur H
  ↓ (0.5ms)
Blur V
  ↓ (0.4ms)
Output
```

Each node should show:

- Execution time
- Texture size
- Cache hit/miss
- Shader name

---

## Golden Image Testing

### Setup

1. Render reference frames at key points
2. Store golden images in test fixtures
3. Compare runtime output against golden images
4. Tolerance: ±2 per channel (accounts for GPU precision)

### Test Matrix

```
Effect       | Frame | Expected Hash
-------------|-------|---------------
Identity     |   0   | abc123...
Brightness   |   0   | def456...
Blur         |   0   | ghi789...
Bloom        |   0   | jkl012...
```

### Backend Parity

Once Rust backend exists:

```
Pixi Output  ==  Rust Output
  (tolerance: ±2 per channel)
```

This validates both backends implement the same specification.

---

## Next Milestone

**Current:** Architecture Skeleton  
**Next:** Runtime Capability Validation

**Definition of Done:**

- ✅ Identity Pass validated (Capability 1)
- ✅ Uniform Updates validated (Capability 2)
- ✅ Multi-pass validated (Capability 3)
- ✅ Multipass (single effect) validated (Capability 4)
- ✅ Procedural validated (Capability 5)
- ✅ Composite validated (Capability 6)
- ✅ Runtime Inspector integrated
- ✅ Graph visualization working
- ✅ Golden tests passing

**Only after this milestone:** Begin implementing production effects en masse.

---

## Philosophy

> "Clypra Studio isn't just an effect editor;  
> it's the validation environment for the rendering engine  
> that will power both the web development experience  
> and the future native Rust runtime."

Every capability validated in Studio is automatically validated for:

- Desktop export (current Pixi backend)
- Future native export (Rust backend)
- Real-time preview (web)
- Batch processing (server)

The same compiler, planner, and frame graph specification powers all of them.
