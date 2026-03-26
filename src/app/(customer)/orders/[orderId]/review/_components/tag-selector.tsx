"use client";

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
            className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-all ${
              isSelected
                ? "text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={isSelected ? { backgroundColor: "#2DB400" } : {}}
          >
            {isSelected && "✓ "}
            {tag}
          </button>
        );
      })}
    </div>
  );
}
