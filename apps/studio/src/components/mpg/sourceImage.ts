import type { SourceMedia } from "./types";

/** Load an HTMLImageElement — avoids crossOrigin issues on blob: and same-origin URLs */
export function loadSourceImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    if (url.startsWith("http://") || url.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export function createCustomSourceFromFile(file: File): { source: SourceMedia; objectUrl: string } {
  const objectUrl = URL.createObjectURL(file);
  return {
    objectUrl,
    source: {
      id: `custom-${Date.now()}`,
      name: file.name,
      url: objectUrl,
      kind: "image",
      isCustom: true,
    },
  };
}

export const ACCEPTED_IMAGE_TYPES = "image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.heic,.heif";
