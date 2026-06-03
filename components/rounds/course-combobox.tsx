"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CourseComboboxItem = {
  id: string;
  name: string;
  city: string;
  playCount?: number;
};

export function CourseCombobox({
  courses,
  value,
  onChange,
  placeholder = "Choose a course...",
  disabled,
  includeAllOption = false,
  allOptionLabel = "All courses",
  allOptionDescription = "Every course",
  triggerClassName,
}: {
  courses: CourseComboboxItem[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  allOptionDescription?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const options = includeAllOption
    ? [{ id: "all", name: allOptionLabel, city: allOptionDescription }, ...courses]
    : courses;
  const selected = options.find((c) => c.id === value);
  const selectedLabel =
    selected == null
      ? placeholder
      : selected.id === "all"
        ? selected.name
        : `${selected.name} — ${selected.city}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-1 h-9 w-full justify-between font-normal",
          !selected && "text-muted-foreground",
          triggerClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Search className="h-4 w-4 shrink-0 opacity-60" />
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,28rem)] p-0">
        <Command>
          <CommandInput placeholder="Search course or city..." autoFocus />
          <CommandList>
            <CommandEmpty>No course found.</CommandEmpty>
            {options.map((c) => (
              <CommandItem
                key={c.id}
                value={`${c.name} ${c.city}`}
                onSelect={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    c.id === value ? "opacity-100 text-primary" : "opacity-0",
                  )}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{c.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {c.city}
                  </span>
                </span>
                {c.playCount ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.playCount}× played
                  </span>
                ) : null}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
