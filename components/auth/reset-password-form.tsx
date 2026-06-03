"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setBusy(true);
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          typeof payload?.message === "string"
            ? payload.message
            : typeof payload?.error === "string"
              ? payload.error
              : "Password reset failed",
        );
      }

      toast.success("Password reset");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
          <p className="text-sm text-muted-foreground">Use at least 8 characters.</p>
        </div>
      </div>

      {!token ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
            This reset link is invalid or expired. Request a new link to continue.
          </div>
          <Button asChild className="h-10 w-full">
            <Link href="/forgot-password">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Request new link
            </Link>
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              maxLength={128}
              required
              autoComplete="new-password"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              maxLength={128}
              required
              autoComplete="new-password"
              className="h-10"
            />
          </div>

          <Button type="submit" className="h-10 w-full" disabled={busy}>
            <LockKeyhole className="mr-1 h-4 w-4" />
            {busy ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      )}
    </Card>
  );
}
