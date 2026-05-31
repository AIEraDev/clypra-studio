/**
 * Programmatic Lottie Animation Builder and Mutation Engine (Bodymovin Schema)
 * Supports creating compositions from scratch, layer insertions, and visual keyframe timeline tracking.
 *
 * Font Handling:
 * Lottie-web uses the 'fName' property to look up fonts in the browser's CSS.
 * Each font variant (Regular, Bold, Italic, BoldItalic) is registered as a separate
 * font-family name (e.g., "Poppins-Italic") that maps to the actual font with
 * appropriate font-weight and font-style via @font-face rules in index.css.
 */

export interface EasingControlPoint {
  x: number[];
  y: number[];
}

export interface LottieKeyframe {
  t: number; // Frame number
  s: number[] | number; // Start value at this keyframe
  i?: EasingControlPoint; // Easing in control points
  o?: EasingControlPoint; // Easing out control points
}

export type LottiePropertyPath = "ks.a" | "ks.p" | "ks.s" | "ks.r" | "ks.o";

/**
 * Creates a valid minimum blank slate Lottie composition
 */
export function createBlankLottie(w: number, h: number, fps: number, durationFrames: number): any {
  return {
    v: "5.7.5",
    fr: fps,
    ip: 0,
    op: durationFrames,
    w,
    h,
    nm: "Clypra Motion Composition",
    ddd: 0,
    assets: [],
    layers: [],
    fonts: {
      list: [
        {
          fName: "Poppins-Bold",
          fFamily: "Poppins",
          fWeight: "700",
          fStyle: "Bold",
          asName: "Poppins-Bold",
        },
        {
          fName: "Poppins-Regular",
          fFamily: "Poppins",
          fWeight: "400",
          fStyle: "Regular",
          asName: "Poppins-Regular",
        },
        {
          fName: "Poppins-Italic",
          fFamily: "Poppins",
          fWeight: "400",
          fStyle: "Italic",
          asName: "Poppins-Italic",
        },
        {
          fName: "Poppins-BoldItalic",
          fFamily: "Poppins",
          fWeight: "700",
          fStyle: "Bold Italic",
          asName: "Poppins-BoldItalic",
        },
        {
          fName: "Arial",
          fFamily: "Arial",
          fWeight: "400",
          fStyle: "Regular",
          asName: "Arial",
        },
        {
          fName: "Arial-Bold",
          fFamily: "Arial",
          fWeight: "700",
          fStyle: "Bold",
          asName: "Arial-Bold",
        },
        {
          fName: "Arial-Italic",
          fFamily: "Arial",
          fWeight: "400",
          fStyle: "Italic",
          asName: "Arial-Italic",
        },
        {
          fName: "Arial-BoldItalic",
          fFamily: "Arial",
          fWeight: "700",
          fStyle: "Bold Italic",
          asName: "Arial-BoldItalic",
        },
        {
          fName: "Montserrat-Regular",
          fFamily: "Montserrat",
          fWeight: "400",
          fStyle: "Regular",
          asName: "Montserrat-Regular",
        },
        {
          fName: "Montserrat-Bold",
          fFamily: "Montserrat",
          fWeight: "700",
          fStyle: "Bold",
          asName: "Montserrat-Bold",
        },
        {
          fName: "Montserrat-ExtraBold",
          fFamily: "Montserrat",
          fWeight: "800",
          fStyle: "ExtraBold",
          asName: "Montserrat-ExtraBold",
        },
        {
          fName: "Montserrat-Black",
          fFamily: "Montserrat",
          fWeight: "900",
          fStyle: "Black",
          asName: "Montserrat-Black",
        },
        {
          fName: "Montserrat-Italic",
          fFamily: "Montserrat",
          fWeight: "400",
          fStyle: "Italic",
          asName: "Montserrat-Italic",
        },
        {
          fName: "Montserrat-BoldItalic",
          fFamily: "Montserrat",
          fWeight: "700",
          fStyle: "Bold Italic",
          asName: "Montserrat-BoldItalic",
        },
        {
          fName: "Montserrat-ExtraBoldItalic",
          fFamily: "Montserrat",
          fWeight: "800",
          fStyle: "ExtraBold Italic",
          asName: "Montserrat-ExtraBoldItalic",
        },
        {
          fName: "Montserrat-BlackItalic",
          fFamily: "Montserrat",
          fWeight: "900",
          fStyle: "Black Italic",
          asName: "Montserrat-BlackItalic",
        },
      ],
    },
  };
}

/**
 * Re-indexes layer indices (ind) in a Lottie composition to ensure ordering integrity
 */
export function reindexLayers(lottieData: any): void {
  if (!lottieData || !Array.isArray(lottieData.layers)) return;
  lottieData.layers.forEach((layer: any, index: number) => {
    // Standard layers index is 1-indexed descending
    layer.ind = lottieData.layers.length - index;
  });
}

/**
 * Adds a solid background layer (ty === 1) to the composition
 */
export function addSolidLayer(lottieData: any, name: string, color: string, w: number, h: number): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  if (!Array.isArray(clone.layers)) clone.layers = [];

  const newLayer = {
    ty: 1,
    nm: name,
    sr: 1,
    st: 0,
    ip: 0,
    op: clone.op,
    ind: clone.layers.length + 1,
    sw: w,
    sh: h,
    sc: color, // Solid color hex
    ks: {
      a: { a: 0, k: [0, 0, 0] },
      p: { a: 0, k: [w / 2, h / 2, 0] },
      s: { a: 0, k: [100, 100, 100] },
      r: { a: 0, k: 0 },
      o: { a: 0, k: 100 },
    },
  };

  // Prepend so that solid backgrounds sit at the bottom of the rendering stack
  clone.layers.push(newLayer);
  reindexLayers(clone);
  return clone;
}

/**
 * Adds a standard vector text layer (ty === 5) to the composition
 */
export function addTextLayer(lottieData: any, name: string, text: string): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  if (!Array.isArray(clone.layers)) clone.layers = [];

  const w = clone.w || 1920;
  const h = clone.h || 1080;

  const newLayer = {
    ty: 5,
    nm: name,
    sr: 1,
    st: 0,
    ip: 0,
    op: clone.op,
    ind: clone.layers.length + 1,
    ks: {
      a: { a: 0, k: [0, 0, 0] },
      p: { a: 0, k: [w / 2, h / 2, 0] },
      s: { a: 0, k: [100, 100, 100] },
      r: { a: 0, k: 0 },
      o: { a: 0, k: 100 },
    },
    t: {
      d: {
        k: [
          {
            s: {
              s: 64, // Font size
              f: "Poppins-Bold", // Font name
              t: text, // Initial Text content
              j: 1, // Center alignment
              tr: 0,
              lh: 80, // Line height
              ls: 0,
              fc: [1, 1, 1], // White [r,g,b] range 0-1
            },
          },
        ],
      },
      p: {},
      a: [],
      m: {
        g: 1,
        a: {
          a: 0,
          k: [0, 0],
        },
      },
    },
  };

  // Prepend to render on top
  clone.layers.unshift(newLayer);
  reindexLayers(clone);
  return clone;
}

/**
 * Adds an empty shape layer (ty === 4) to the composition
 */
export function addShapeLayer(lottieData: any, name: string): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  if (!Array.isArray(clone.layers)) clone.layers = [];

  const w = clone.w || 1920;
  const h = clone.h || 1080;

  const newLayer = {
    ty: 4,
    nm: name,
    sr: 1,
    st: 0,
    ip: 0,
    op: clone.op,
    ind: clone.layers.length + 1,
    ks: {
      a: { a: 0, k: [0, 0, 0] },
      p: { a: 0, k: [w / 2, h / 2, 0] },
      s: { a: 0, k: [100, 100, 100] },
      r: { a: 0, k: 0 },
      o: { a: 0, k: 100 },
    },
    shapes: [],
  };

  clone.layers.unshift(newLayer);
  reindexLayers(clone);
  return clone;
}

/**
 * Appends a basic vector shape (Rectangle or Ellipse) to a shape layer
 */
export function addVectorShape(lottieData: any, layerIndex: number, shapeType: "rect" | "ellipse", colorHex: string): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  const layer = clone.layers[layerIndex];
  if (!layer || layer.ty !== 4) return clone;

  if (!Array.isArray(layer.shapes)) layer.shapes = [];

  // Convert hex color to normalized [r, g, b]
  const cleanHex = colorHex.startsWith("#") ? colorHex.slice(1) : colorHex;
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255 || 0.5;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255 || 0.4;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255 || 1.0;

  let shapeContent: any;

  if (shapeType === "rect") {
    shapeContent = {
      ty: "gr",
      nm: "Rectangle Group",
      it: [
        {
          ty: "rc", // Rectangle
          nm: "Rect Path",
          p: { a: 0, k: [0, 0] }, // position centered in group
          s: { a: 0, k: [250, 150] }, // size
          r: { a: 0, k: 8 }, // rounded corners
        },
        {
          ty: "fl", // Fill shape
          nm: "Rect Fill",
          c: { a: 0, k: [r, g, b, 1] }, // color
          o: { a: 0, k: 100 },
        },
        {
          ty: "tr", // Group transform
          nm: "Group Transform",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
      ],
    };
  } else {
    shapeContent = {
      ty: "gr",
      nm: "Ellipse Group",
      it: [
        {
          ty: "el", // Ellipse
          nm: "Ellipse Path",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [200, 200] },
        },
        {
          ty: "fl",
          nm: "Ellipse Fill",
          c: { a: 0, k: [r, g, b, 1] },
          o: { a: 0, k: 100 },
        },
        {
          ty: "tr",
          nm: "Group Transform",
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
      ],
    };
  }

  layer.shapes.push(shapeContent);
  return clone;
}

/**
 * Gets the nested object inside a layer via property path (e.g. 'ks.p')
 */
function getProperty(layer: any, path: LottiePropertyPath): any {
  if (!layer) return null;
  const keys = path.split(".");
  let current = layer;
  for (const key of keys) {
    if (!current[key]) return null;
    current = current[key];
  }
  return current;
}

/**
 * Updates a static property on a Lottie layer
 */
export function updateStaticProperty(lottieData: any, layerIndex: number, path: LottiePropertyPath, value: number | number[]): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  const layer = clone.layers[layerIndex];
  if (!layer) return clone;

  const propObj = getProperty(layer, path);
  if (propObj) {
    propObj.a = 0; // Not animated

    // Ensure 3D coordinate array bounds
    if (Array.isArray(value) && (path === "ks.p" || path === "ks.s" || path === "ks.a")) {
      propObj.k = [value[0] || 0, value[1] || 0, value[2] || 0];
    } else {
      propObj.k = value;
    }
  }

  return clone;
}

/**
 * Standard easing cubic bezier presets mapping
 */
const EASING_CURVES: Record<string, { o: EasingControlPoint; i: EasingControlPoint }> = {
  linear: {
    o: { x: [0], y: [0] },
    i: { x: [1], y: [1] },
  },
  easeIn: {
    o: { x: [0.42], y: [0] },
    i: { x: [1], y: [1] },
  },
  easeOut: {
    o: { x: [0], y: [0] },
    i: { x: [0.58], y: [1] },
  },
  easeInOut: {
    o: { x: [0.42], y: [0] },
    i: { x: [0.58], y: [1] },
  },
};

/**
 * Converts a static property to an animated keyframed track, inserting a default start keyframe
 */
export function enableKeyframing(lottieData: any, layerIndex: number, path: LottiePropertyPath): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  const layer = clone.layers[layerIndex];
  if (!layer) return clone;

  const propObj = getProperty(layer, path);
  if (propObj && propObj.a === 0) {
    const staticValue = propObj.k;
    propObj.a = 1; // Animated!

    // Create initial keyframe at frame 0
    propObj.k = [
      {
        t: 0,
        s: staticValue,
        i: EASING_CURVES.easeInOut.i,
        o: EASING_CURVES.easeInOut.o,
      },
    ];
  }
  return clone;
}

/**
 * Inserts or updates a keyframe in an animated Lottie property track
 */
export function addOrUpdateKeyframe(lottieData: any, layerIndex: number, path: LottiePropertyPath, frame: number, value: number | number[], easing: "linear" | "easeIn" | "easeOut" | "easeInOut" = "easeInOut"): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  const layer = clone.layers[layerIndex];
  if (!layer) return clone;

  const propObj = getProperty(layer, path);
  if (!propObj) return clone;

  // Guarantee keyframing is active
  if (propObj.a === 0) {
    // If not animated, convert to keyframed first
    propObj.a = 1;
    propObj.k = [
      {
        t: 0,
        s: propObj.k,
        i: EASING_CURVES[easing].i,
        o: EASING_CURVES[easing].o,
      },
    ];
  }

  const keyframes: LottieKeyframe[] = propObj.k;

  // Format coordinate values
  let formattedVal = value;
  if (Array.isArray(value) && (path === "ks.p" || path === "ks.s" || path === "ks.a")) {
    formattedVal = [value[0] || 0, value[1] || 0, value[2] || 0];
  }

  // Look for existing keyframe at exact frame number
  const matchIndex = keyframes.findIndex((kf) => kf.t === frame);
  const curves = EASING_CURVES[easing];

  if (matchIndex !== -1) {
    // Update existing keyframe
    keyframes[matchIndex].s = formattedVal;
    keyframes[matchIndex].i = curves.i;
    keyframes[matchIndex].o = curves.o;
  } else {
    // Insert new keyframe
    keyframes.push({
      t: frame,
      s: formattedVal,
      i: curves.i,
      o: curves.o,
    });

    // Keep keyframes sorted by frame time ascending
    keyframes.sort((a, b) => a.t - b.t);
  }

  // Bodymovin specification requires the last keyframe in the array to NOT contain easing control points,
  // as it represents the endpoint of the animation.
  keyframes.forEach((kf, idx) => {
    if (idx === keyframes.length - 1) {
      delete kf.i;
      delete kf.o;
    } else {
      kf.i = kf.i || curves.i;
      kf.o = kf.o || curves.o;
    }
  });

  return clone;
}

/**
 * Removes a keyframe from an animated Lottie property track
 */
export function deleteKeyframe(lottieData: any, layerIndex: number, path: LottiePropertyPath, frame: number): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  const layer = clone.layers[layerIndex];
  if (!layer) return clone;

  const propObj = getProperty(layer, path);
  if (!propObj || propObj.a === 0) return clone;

  let keyframes: LottieKeyframe[] = propObj.k;

  // Remove match
  keyframes = keyframes.filter((kf) => kf.t !== frame);

  if (keyframes.length === 0) {
    // If no keyframes left, convert back to static at frame 0 values
    propObj.a = 0;
    propObj.k = path === "ks.p" || path === "ks.s" || path === "ks.a" ? [0, 0, 0] : 0;
  } else {
    propObj.k = keyframes;

    // Patch last keyframe ending
    keyframes.forEach((kf, idx) => {
      if (idx === keyframes.length - 1) {
        delete kf.i;
        delete kf.o;
      }
    });
  }

  return clone;
}

/**
 * Adds an image asset and corresponding Image Layer (ty === 2) to the composition
 */
export function addImageLayer(lottieData: any, name: string, base64Data: string, w: number, h: number): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  if (!Array.isArray(clone.assets)) clone.assets = [];
  if (!Array.isArray(clone.layers)) clone.layers = [];

  const assetId = `img_${Date.now()}`;

  // 1. Add image to assets pool
  clone.assets.push({
    id: assetId,
    w,
    h,
    u: "",
    p: base64Data, // data:image/png;base64,...
    e: 1,
  });

  const compW = clone.w || 1920;
  const compH = clone.h || 1080;

  // 2. Add Image Layer pointing to the asset
  const newLayer = {
    ty: 2,
    nm: name,
    refId: assetId,
    sr: 1,
    st: 0,
    ip: 0,
    op: clone.op,
    ind: clone.layers.length + 1,
    ks: {
      a: { a: 0, k: [w / 2, h / 2, 0] },
      p: { a: 0, k: [compW / 2, compH / 2, 0] },
      s: { a: 0, k: [100, 100, 100] },
      r: { a: 0, k: 0 },
      o: { a: 0, k: 100 },
    },
  };

  clone.layers.unshift(newLayer);
  reindexLayers(clone);
  return clone;
}

/**
 * Sets or clears the track matte mask setting of a layer
 * matteType: 0 = None, 1 = Alpha Matte, 2 = Alpha Inverted Matte
 */
export function updateTrackMatte(lottieData: any, layerIndex: number, matteType: number): any {
  const clone = JSON.parse(JSON.stringify(lottieData));
  const layer = clone.layers[layerIndex];
  if (!layer) return clone;

  if (matteType === 0) {
    delete layer.tt;
  } else {
    layer.tt = matteType;
  }

  return clone;
}
