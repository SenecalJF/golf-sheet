"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RoundDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function onDelete() {
    if (!confirm("Delete this round? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/rounds/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Round deleted");
      router.push("/rounds");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={onDelete} disabled={busy}>
      <Trash2 className="mr-1 h-4 w-4" /> Delete round
    </Button>
  );
}
