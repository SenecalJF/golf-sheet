"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Sign out failed");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign out failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "sm"}
      onClick={signOut}
      disabled={busy}
      aria-label="Sign out"
      className={compact ? "h-9 w-9" : "w-full justify-start"}
    >
      <LogOut className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
      {!compact && (busy ? "Signing out..." : "Sign out")}
    </Button>
  );
}
