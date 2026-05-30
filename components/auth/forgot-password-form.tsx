"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          redirectTo: "/reset-password",
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          typeof payload?.message === "string"
            ? payload.message
            : typeof payload?.error === "string"
              ? payload.error
              : "Password reset email failed",
        );
      }

      setSent(true);
      toast.success("Reset email sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password reset email failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground">Get a secure link by email.</p>
        </div>
      </div>

      {sent ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
            If that email has an account, a reset link is on the way. The link expires in 1 hour.
          </div>
          <Button asChild className="h-10 w-full">
            <Link href="/login">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-10"
            />
          </div>

          <Button type="submit" className="h-10 w-full" disabled={busy}>
            <Send className="mr-1 h-4 w-4" />
            {busy ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}

      {!sent && (
        <div className="mt-5 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      )}
    </Card>
  );
}
