import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Database, Sparkles } from "lucide-react";
import { hasApiKey } from "@/lib/anthropic";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const apiOk = hasApiKey();
  const [courseCount, roundCount] = await Promise.all([
    prisma.course.count(),
    prisma.round.count(),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-primary">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Configuration</h1>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Anthropic API key</h2>
            <p className="text-xs text-muted-foreground">
              Required for scorecard OCR and AI insights.
            </p>
          </div>
          <div className="ml-auto">
            {apiOk ? (
              <Badge variant="outline" className="border-primary/40 text-primary">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                Missing
              </Badge>
            )}
          </div>
        </div>
        {!apiOk && (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-secondary p-4 text-xs">
{`# .env.local
ANTHROPIC_API_KEY=sk-ant-...`}
          </pre>
        )}
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
              SQLite, stored locally in <code>dev.db</code>. Single user, no cloud sync.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-secondary/40 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Courses</div>
            <div className="number-mono mt-1 text-2xl font-semibold">{courseCount}</div>
          </div>
          <div className="rounded-lg bg-secondary/40 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Rounds</div>
            <div className="number-mono mt-1 text-2xl font-semibold">{roundCount}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
