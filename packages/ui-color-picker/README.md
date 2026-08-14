# @clypra/ui-color-picker

Professional, accessible, high-performance Color Picker suite designed for Clypra video editor and creative web applications.

Built with **React 19**, **TypeScript (Strict, zero `any`)**, **Tailwind CSS**, and **shadcn/ui** design principles.

---

## ✨ Features

- 🎨 **Dark Surface Aesthetic**: Meticulously designed for professional video editing suites (`bg-zinc-950`, `border-white/10`, `shadow-2xl shadow-violet-950/30`, Violet-500 `#8B5CF6` accents).
- 🎛️ **Multi-Format Color Engine**: Native support for **HEX**, **RGB**, **HSL**, and **HSV** with real-time bidirectional mathematical conversion.
- ⚡ **Ultra-smooth 60fps Drag Interactions**: Powered by unified Pointer Events, `requestAnimationFrame`, and 16ms throttled callbacks.
- 🔬 **Double-Ring Contrast Cursors**: 12px double-ring thumb cursors with white inner ring and black outer outline, ensuring crystal-clear visibility over any background color.
- 🌈 **Rainbow Hue & Alpha Sliders**: Precision vertical gradient tracks with keyboard stepping (1% standard, 10% with Shift).
- 💾 **Preset & Recent Swatches**: Built-in MRU recent color cache and configurable preset swatch palette with ghost "Add to Presets" handler.
- 🔍 **Native EyeDropper Support**: Automatic integration with `window.EyeDropper` where available.
- 📋 **One-Click Clipboard Copy**: Formatted string clipboard copy button with visual checkmark toast.
- ♿ **Full Accessibility (ARIA)**: `role="slider"`, `aria-valuenow`, `aria-valuetext`, `aria-valuemin/max`, keyboard arrow navigation, Tab cycling, and Escape dismiss.
- 🎚️ **Imperative Ref Handle**: `getFormat()`, `setFormat()`, `getValue()`, `focus()` via `useImperativeHandle`.
- 📦 **Dual Rendering Modes**: Popover trigger mode and direct inline panel mode.

---

## 📦 Installation

```bash
# Using pnpm (monorepo or standalone)
pnpm add @clypra/ui-color-picker

# Using npm
npm install @clypra/ui-color-picker
```

---

## 🚀 Quick Start

```tsx
import React, { useState } from 'react';
import { ClypraColorPicker } from '@clypra/ui-color-picker';
import '@clypra/ui-color-picker/styles.css';

export function ExampleVideoInspector() {
  const [shadowColor, setShadowColor] = useState('#8B5CF6');

  return (
    <div className="p-6 bg-zinc-950 text-white">
      <h3 className="text-sm font-semibold mb-3">Drop Shadow Color</h3>
      <ClypraColorPicker
        value={shadowColor}
        onChange={(color) => setShadowColor(color)}
        onChangeComplete={(color) => console.log('Finalized color:', color)}
        format="hex"
        showAlpha
        presetColors={[
          '#8B5CF6',
          '#6366F1',
          '#3B82F6',
          '#06B6D4',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#EC4899',
          '#FFFFFF',
          '#000000',
        ]}
        onSavePreset={(color) => console.log('Saved preset:', color)}
        size="md"
      />
    </div>
  );
}
```

---

## 🛠️ Props & Configuration

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `undefined` | Controlled color value (hex, rgba, hsla, etc.). |
| `defaultValue` | `string` | `'#8B5CF6'` | Default value when used in uncontrolled mode. |
| `onChange` | `(color: string) => void` | `undefined` | Real-time color change callback (16ms throttled during drag). |
| `onChangeComplete` | `(color: string) => void` | `undefined` | Fires on drag release (`pointerup`/`touchend`), input blur, or preset selection. |
| `format` | `'hex' \| 'rgb' \| 'hsl' \| 'hsv'` | `'hex'` | Default color output format. |
| `showAlpha` | `boolean` | `true` | Show alpha slider & transparency in formatted outputs. |
| `presetColors` | `string[]` | `[...]` | Array of preset color swatches. |
| `recentColors` | `string[]` | `[...]` | Array of recent color swatches. |
| `onSavePreset` | `(color: string) => void` | `undefined` | Callback when "Save" button is clicked. |
| `disabled` | `boolean` | `false` | Disables all interactions. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant for trigger swatch and controls. |
| `inline` | `boolean` | `false` | Renders the picker inline instead of inside a popover dropdown. |
| `label` | `string` | `undefined` | Optional accessibility label / title. |
| `showEyeDropper` | `boolean` | `true` | Show eyedropper tool if supported by browser. |
| `showCopyButton` | `boolean` | `true` | Show copy formatted color string button. |

---

## 🎯 Imperative Ref Handle

```tsx
import React, { useRef } from 'react';
import { ClypraColorPicker, type ClypraColorPickerHandle } from '@clypra/ui-color-picker';

export function AdvancedController() {
  const pickerRef = useRef<ClypraColorPickerHandle>(null);

  const switchToRgb = () => {
    pickerRef.current?.setFormat('rgb');
    console.log('Current value:', pickerRef.current?.getValue());
    pickerRef.current?.focus();
  };

  return (
    <div>
      <button onClick={switchToRgb}>Switch to RGB</button>
      <ClypraColorPicker ref={pickerRef} defaultValue="#EF4444" />
    </div>
  );
}
```

---

## 🧮 Pure Mathematical Color Utilities

The package also exports standalone, pure, zero-dependency color mathematics:

```ts
import {
  hexToRgba,
  rgbaToHex,
  rgbaToHsva,
  hsvaToRgba,
  hsvaToHsla,
  hslaToHsva,
  parseColor,
  formatColor,
  isValidColor,
  getContrastColor,
} from '@clypra/ui-color-picker';

const hsva = parseColor('rgba(139, 92, 246, 0.85)');
// -> { h: 258.3, s: 62.6, v: 96.5, a: 0.85 }

const hex = formatColor(hsva!, 'hex');
// -> "#8B5CF6D9"

const textContrast = getContrastColor(hsva!);
// -> "#000000" or "#ffffff"
```

---

## 📄 License

MIT © Clypra Contributors
