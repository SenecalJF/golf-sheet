"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Save, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { parsePars, formatPars } from "@/lib/types";

type TeeRow = {
  id: string;
  name: string;
  color: string | null;
  rating: number | null;
  slope: number | null;
  yardage: number | null;
  pars: string;
  holeCount: number;
  rating9F: number | null;
  slope9F: number | null;
  rating9B: number | null;
  slope9B: number | null;
};

export function TeeEditor({ courseId, tees }: { courseId: string; tees: TeeRow[] }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Tees</h2>
          <p className="text-xs text-muted-foreground">
            Rating + slope are optional. The AI can fill them in from a scorecard photo when you
            log a round here, or you can enter them now.
          </p>
        </div>
        <AddTeeButton courseId={courseId} />
      </div>

      {tees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tees yet.</p>
      ) : (
        <div className="space-y-6">
          {tees.map((tee) => (
            <TeeForm key={tee.id} courseId={courseId} tee={tee} />
          ))}
        </div>
      )}
    </Card>
  );
}

function AddTeeButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  async function addTee() {
    setBusy(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/tees`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `New ${Date.now().toString().slice(-4)}`,
          pars: "4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4",
          holeCount: 18,
        }),
      });
      if (!res.ok) throw new Error("Failed to add tee");
      toast.success("Tee added");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button onClick={addTee} disabled={busy} size="sm" variant="outline">
      <Plus className="mr-1 h-4 w-4" /> Add tee
    </Button>
  );
}

function TeeForm({ courseId, tee }: { courseId: string; tee: TeeRow }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [name, setName] = React.useState(tee.name);
  const [color, setColor] = React.useState(tee.color ?? "#ffffff");
  const [rating, setRating] = React.useState(tee.rating?.toString() ?? "");
  const [slope, setSlope] = React.useState(tee.slope?.toString() ?? "");
  const [yardage, setYardage] = React.useState(tee.yardage?.toString() ?? "");
  const [holeCount, setHoleCount] = React.useState<9 | 18>(tee.holeCount as 9 | 18);
  const [pars, setPars] = React.useState<number[]>(parsePars(tee.pars));
  const [rating9F, setRating9F] = React.useState(tee.rating9F?.toString() ?? "");
  const [slope9F, setSlope9F] = React.useState(tee.slope9F?.toString() ?? "");
  const [rating9B, setRating9B] = React.useState(tee.rating9B?.toString() ?? "");
  const [slope9B, setSlope9B] = React.useState(tee.slope9B?.toString() ?? "");

  React.useEffect(() => {
    setPars((prev) => {
      if (prev.length === holeCount) return prev;
      if (holeCount === 18 && prev.length === 9) return [...prev, ...prev];
      return prev.slice(0, holeCount).concat(Array(Math.max(0, holeCount - prev.length)).fill(4));
    });
  }, [holeCount]);

  const totalPar = pars.reduce((s, p) => s + p, 0);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/tees`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          teeId: tee.id,
          name,
          color,
          rating: rating ? Number(rating) : null,
          slope: slope ? Number(slope) : null,
          yardage: yardage ? Number(yardage) : null,
          pars: formatPars(pars),
          holeCount,
          rating9F: rating9F ? Number(rating9F) : null,
          slope9F: slope9F ? Number(slope9F) : null,
          rating9B: rating9B ? Number(rating9B) : null,
          slope9B: slope9B ? Number(slope9B) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.error === "string" ? err.error : "Validation failed");
      }
      toast.success("Tee saved");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function fillStandard() {
    setPars(holeCount === 9 ? [4, 4, 3, 5, 4, 4, 3, 4, 5] : [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5]);
  }

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Tee name
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Color</Label>
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-1 h-9 w-20 p-1"
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Holes</Label>
          <div className="mt-1 flex gap-2">
            {([9, 18] as const).map((n) => (
              <Button
                key={n}
                type="button"
                variant={holeCount === n ? "default" : "outline"}
                size="sm"
                onClick={() => setHoleCount(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 md:grid-cols-3">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Course rating
          </Label>
          <Input value={rating} onChange={(e) => setRating(e.target.value)} placeholder="71.2" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Slope</Label>
          <Input value={slope} onChange={(e) => setSlope(e.target.value)} placeholder="130" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Yardage</Label>
          <Input value={yardage} onChange={(e) => setYardage(e.target.value)} placeholder="6500" />
        </div>
      </div>

      {holeCount === 18 && (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Front-9 rating
            </Label>
            <Input value={rating9F} onChange={(e) => setRating9F(e.target.value)} placeholder="35.6" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Front-9 slope
            </Label>
            <Input value={slope9F} onChange={(e) => setSlope9F(e.target.value)} placeholder="130" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Back-9 rating
            </Label>
            <Input value={rating9B} onChange={(e) => setRating9B(e.target.value)} placeholder="35.6" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Back-9 slope
            </Label>
            <Input value={slope9B} onChange={(e) => setSlope9B(e.target.value)} placeholder="130" />
          </div>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Par per hole · Total <span className="number-mono text-foreground">{totalPar}</span>
          </Label>
          <Button type="button" size="sm" variant="ghost" onClick={fillStandard}>
            <Wand2 className="mr-1 h-3.5 w-3.5" /> Standard pattern
          </Button>
        </div>
        <div className="grid grid-cols-9 gap-1.5">
          {pars.map((p, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground">{i + 1}</span>
              <Input
                type="number"
                min={3}
                max={6}
                value={p}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    const next = [...pars];
                    next[i] = v;
                    setPars(next);
                  }
                }}
                className="number-mono mt-1 h-9 w-full px-1 text-center"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {rating && slope ? (
            <Badge variant="outline" className="border-primary/40 text-primary">
              Handicap-ready
            </Badge>
          ) : (
            <span>Rating + slope optional — the AI can fill these from a scorecard photo.</span>
          )}
        </div>
        <Button onClick={save} disabled={busy} size="sm">
          <Save className="mr-1 h-4 w-4" /> Save
        </Button>
      </div>
    </div>
  );
}
