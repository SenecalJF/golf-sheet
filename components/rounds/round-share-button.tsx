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
    const shareTitle = courseName;
    const shareText = `${totalStrokes} (${overParText}) at ${courseName}`;
    const fileName = `golf-sheet-${slug(courseName)}-${totalStrokes}.png`;

    try {
      const res = await fetch(`/api/share/round/${roundId}?size=story`, {
        method: "GET",
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Image request failed (${res.status})`);
      }
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });

      const nav = typeof navigator === "undefined" ? null : navigator;
      const canShareFiles =
        nav && typeof nav.canShare === "function" && nav.canShare({ files: [file] });

      if (canShareFiles && typeof nav.share === "function") {
        try {
          await nav.share({
            files: [file],
            title: shareTitle,
            text: shareText,
          });
          // Success path: native share sheet handled it. No toast — the OS UI
          // is feedback enough.
          return;
        } catch (err) {
          // User cancelled the share sheet → AbortError. Stay silent.
          if (err instanceof DOMException && err.name === "AbortError") return;
          // Anything else falls through to the download fallback.
        }
      }

      downloadBlob(blob, fileName);
      toast.success("Image saved — attach it in Insta Story, Snap, etc.");
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
