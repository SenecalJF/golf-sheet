"use client";

import * as React from "react";
import { format } from "date-fns";
import { Database, KeyRound, Save, Sparkles, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type KeyStatus = {
  configured: boolean;
  keyLast4: string | null;
  updatedAt: Date | string | null;
};

export function AccountSettings({
  user,
  keyStatus,
  courseCount,
  roundCount,
}: {
  user: { name: string; email: string };
  keyStatus: KeyStatus;
  courseCount: number;
  roundCount: number;
}) {
  const [name, setName] = React.useState(user.name);
  const [apiKey, setApiKey] = React.useState("");
  const [status, setStatus] = React.useState(keyStatus);
  const [busy, setBusy] = React.useState<string | null>(null);

  async function saveProfile() {
    setBusy("profile");
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(await readError(res, "Profile update failed"));
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile update failed");
    } finally {
      setBusy(null);
    }
  }

  async function submitKey(testOnly: boolean) {
    setBusy(testOnly ? "test-key" : "save-key");
    try {
      const res = await fetch(`/api/settings/anthropic-key${testOnly ? "?test=1" : ""}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error(await readError(res, "Claude key check failed"));
      const next = (await res.json()) as KeyStatus;
      if (!testOnly) {
        setStatus(next);
        setApiKey("");
      }
      toast.success(testOnly ? "Claude key works" : "Claude key saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Claude key check failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteKey() {
    if (!confirm("Delete your saved Claude API key?")) return;
    setBusy("delete-key");
    try {
      const res = await fetch("/api/settings/anthropic-key", { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res, "Delete failed"));
      setStatus((await res.json()) as KeyStatus);
      toast.success("Claude key deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Profile</h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={name}
              minLength={2}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={saveProfile} disabled={busy === "profile" || name.trim().length < 2}>
              <Save className="mr-1 h-4 w-4" />
              {busy === "profile" ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Claude API key</h2>
            <p className="text-xs text-muted-foreground">
              Stored encrypted. Used only for your scorecard OCR and AI insights.
            </p>
          </div>
          <div className="ml-auto">
            {status.configured ? (
              <Badge variant="outline" className="border-primary/40 text-primary">
                Connected · ****{status.keyLast4}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                Missing
              </Badge>
            )}
          </div>
        </div>

        {status.updatedAt && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last updated {format(new Date(status.updatedAt), "MMM d, yyyy")}
          </p>
        )}

        <div className="mt-5 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="anthropicKey">New key</Label>
            <Input
              id="anthropicKey"
              type="password"
              value={apiKey}
              placeholder="sk-ant-..."
              autoComplete="off"
              onChange={(event) => setApiKey(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => submitKey(true)}
              disabled={busy != null || apiKey.trim().length === 0}
            >
              Test key
            </Button>
            <Button
              onClick={() => submitKey(false)}
              disabled={busy != null || apiKey.trim().length === 0}
            >
              <Save className="mr-1 h-4 w-4" />
              {busy === "save-key" ? "Saving..." : "Save key"}
            </Button>
            {status.configured && (
              <Button variant="destructive" onClick={deleteKey} disabled={busy != null}>
                <Trash2 className="mr-1 h-4 w-4" />
                Delete key
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">AI models</h2>
            <p className="text-xs text-muted-foreground">
              Default scorecard reader: <span className="text-foreground">claude-sonnet-4-6</span>{" "}
              · fallback for messy cards:{" "}
              <span className="text-foreground">claude-opus-4-7</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Database</h2>
            <p className="text-xs text-muted-foreground">
              Shared course catalog, private rounds, encrypted per-user Claude keys.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-secondary/40 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Courses</div>
            <div className="number-mono mt-1 text-2xl font-semibold">{courseCount}</div>
          </div>
          <div className="rounded-lg bg-secondary/40 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Your rounds
            </div>
            <div className="number-mono mt-1 text-2xl font-semibold">{roundCount}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

async function readError(res: Response, fallback: string): Promise<string> {
  const payload = await res.json().catch(() => null);
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.message === "string") return payload.message;
  if (payload?.error && typeof payload.error === "object") return "Check the form fields.";
  return fallback;
}
