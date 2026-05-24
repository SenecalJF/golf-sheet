"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  roundId: string;
  courseName: string;
  totalStrokes: number;
  overPar: number;
};

export function RoundShareButton({
  roundId,
  courseName,
  totalStrokes,
  overPar,
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function onShare() {
    if (busy) return;
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setBusy(true);

    const overParText =
      overPar === 0 ? "even par" : overPar > 0 ? `+${overPar}` : `${overPar}`;
    const downloadFileName = `golf-sheet-${slug(courseName)}-${totalStrokes}.jpg`;

    try {
      const res = await fetch(`/api/share/round/${roundId}?size=story`, {
        method: "GET",
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Image request failed (${res.status})`);
      }
      const blob = await res.blob();
      const shareBlob = await toShareableJpeg(blob);
      const file = new File([shareBlob], downloadFileName, { type: shareBlob.type });

      const nav = typeof navigator === "undefined" ? null : navigator;
      const canShareFiles =
        nav && typeof nav.canShare === "function" && nav.canShare({ files: [file] });

      if (canShareFiles && typeof nav.share === "function") {
        try {
          await nav.share({ files: [file] });
          // Success path: native share sheet handled it. No toast — the OS UI
          // is feedback enough.
          return;
        } catch (err) {
          // User cancelled the share sheet → AbortError. Stay silent.
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Anything else falls through to the download fallback.
        }
      }

      downloadBlob(shareBlob, downloadFileName);
      toast.success(`Image saved — ${totalStrokes} (${overParText}) at ${courseName}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      const message = e instanceof Error ? e.message : "Failed";
      toast.error(`Couldn't generate share image · ${message}`);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  }

  return (
    <Button onClick={onShare} disabled={busy} variant="outline">
      {busy ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Share2 className="mr-1 h-4 w-4" />
      )}
      {busy ? "Building image…" : "Share"}
    </Button>
  );
}

async function toShareableJpeg(blob: Blob): Promise<Blob> {
  const img = await loadBlobImage(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;

  ctx.fillStyle = "#07170f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  for (const quality of [0.9, 0.84, 0.78, 0.72]) {
    const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
    if (jpeg.size <= 950 * 1024) return jpeg;
  }

  return canvasToBlob(canvas, "image/jpeg", 0.66);
}

function loadBlobImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Generated image could not be prepared for sharing"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Generated image could not be compressed"));
      },
      type,
      quality,
    );
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48) || "round";
}
