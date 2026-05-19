"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "signup";

export function AuthForm({ mode, nextPath }: { mode: AuthMode; nextPath?: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const endpoint = isSignup ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
    const body = isSignup
      ? {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          inviteCode: String(form.get("inviteCode") ?? ""),
          rememberMe: true,
        }
      : {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          rememberMe: true,
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(
          typeof payload?.message === "string"
            ? payload.message
            : typeof payload?.error === "string"
              ? payload.error
              : isSignup
                ? "Signup failed"
                : "Login failed",
        );
      }
      toast.success(isSignup ? "Account created" : "Signed in");
      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          {isSignup ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isSignup ? "Create account" : "Sign in"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignup ? "Use the private invite code." : "Open your golf dashboard."}
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" minLength={2} required autoComplete="name" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            maxLength={128}
            required
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </div>

        {isSignup && (
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite code</Label>
            <Input id="inviteCode" name="inviteCode" required autoComplete="off" />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          <LockKeyhole className="mr-1 h-4 w-4" />
          {busy
            ? isSignup
              ? "Creating..."
              : "Signing in..."
            : isSignup
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 text-center text-sm text-muted-foreground">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Need an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
