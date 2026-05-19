"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  Flag,
  BarChart3,
  Settings,
  Camera,
  Menu,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignOutButton } from "@/components/auth/sign-out-button";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rounds", label: "Rounds", icon: ListChecks },
  { href: "/rounds/new", label: "New round", icon: Camera, accent: true },
  { href: "/courses", label: "Courses", icon: Flag },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/players", label: "Players", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onSelect }: { onSelect?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((it) => {
        const active =
          it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onSelect}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-foreground shadow-inner shadow-primary/10"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              it.accent && !active && "text-primary hover:text-primary",
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-primary" : "")} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <Flag className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight">Golf Sheet</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">Personal tracker</div>
        )}
      </div>
    </Link>
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border/60 bg-sidebar/60 backdrop-blur-xl lg:block">
      <div className="flex h-full flex-col p-4">
        <div className="mb-8 px-2">
          <Brand />
        </div>
        {!isAuthPage && (
          <>
            <NavLinks />
            <div className="mt-auto space-y-3">
              <div className="rounded-xl border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
                <div className="mb-1 font-semibold text-foreground">Across Quebec</div>
                From Montreal to Tremblant to Charlevoix. Add more on the Courses page.
              </div>
              <SignOutButton />
            </div>
          </>
        )}
        {isAuthPage && (
          <div className="mt-auto rounded-xl border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
            Private invite-only golf tracking.
          </div>
        )}
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Brand subtitle={false} />
      {!isAuthPage && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Open menu"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-secondary/60 text-foreground"
              >
                <Menu className="h-5 w-5" />
              </button>
            }
          />
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border/60 p-4">
              <SheetTitle className="text-left">
                <Brand />
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 p-4">
              <NavLinks onSelect={() => setOpen(false)} />
              <SignOutButton />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
}
