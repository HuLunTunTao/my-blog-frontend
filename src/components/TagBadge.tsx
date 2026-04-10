import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  count?: number;
  className?: string;
}

export default function TagBadge({ tag, count, className }: TagBadgeProps) {
  return (
    <Link
      to={`/tags/${tag}`}
      className={cn(
        "group inline-flex items-center gap-2 border border-border px-2 py-1 rounded hover:border-foreground transition-colors bg-neutral-50 dark:bg-stone-800/50",
        className
      )}
    >
      <span className="font-sans font-medium text-xs text-subtle group-hover:text-foreground">#{tag}</span>
      {count !== undefined && (
        <span className="bg-neutral-200 dark:bg-stone-700 text-subtle text-[10px] px-1 rounded group-hover:bg-neutral-300 dark:group-hover:bg-stone-600">
          {count}
        </span>
      )}
    </Link>
  );
}
