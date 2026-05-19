import Link from "next/link";
import { ArrowRight, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dashboard } from "@/components/dashboard/dashboard";
import { requireUser } from "@/lib/auth-utils";
import { getRoundsForUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const rounds = await getRoundsForUser(user.id);

  if (rounds.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-primary">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Your golf, distilled.
            </h1>
          </div>
          <Button asChild>
            <Link href="/rounds/new">
              New round <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Flag className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold">No rounds yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Upload a scorecard photo or enter your score by hand to get started.
            Once you log a few rounds your handicap, trends, and per-course
            insights will appear here.
          </p>
          <div className="mt-2 flex gap-3">
            <Button asChild>
              <Link href="/rounds/new">Add round</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/courses">Set up a course</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <Dashboard rounds={rounds} />;
}
