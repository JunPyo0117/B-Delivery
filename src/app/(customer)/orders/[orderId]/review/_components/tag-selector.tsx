"use client";

import { cn } from "@/lib/utils";
import { REVIEW_TAGS } from "../actions";

interface TagSelectorProps {
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

export function TagSelector({ selectedTags, onToggle }: TagSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {REVIEW_TAGS.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              isSelected
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50"
            )}
          >
            {isSelected && "✓ "}
            {tag}
          </button>
        );
      })}
    </div>
  );
}
