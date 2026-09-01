// src/components/CopyButton.tsx
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex shrink-0 items-center border px-2.5 py-1 text-xs font-sans transition-colors duration-200",
        copied 
          ? "bg-foreground text-background border-foreground" 
          : "bg-paper text-muted border-border hover:text-foreground hover:border-foreground dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600 dark:hover:text-stone-50 dark:hover:border-stone-400"
      )}
      aria-label="Copy code"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
