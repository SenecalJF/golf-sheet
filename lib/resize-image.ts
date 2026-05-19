/**
 * Resize a user-picked image in the browser before upload so that we stay under
 * Vercel's 4.5MB request-body limit even with several photos selected.
 *
 * Returns a fresh JPEG File. Falls back to the original if anything goes wrong.
 */
export async function resizeImage(
  file: File,
  maxDim = 1800,
  quality = 0.85,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (typeof window === "undefined") return file;

  try {
    const img = await loadImage(file);
    const { width, height } = scaleDown(img.width, img.height, maxDim);
    if (width === img.width && height === img.height && file.size < 800 * 1024) {
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });
    if (!blob) return file;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function scaleDown(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = Math.min(max / w, max / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
