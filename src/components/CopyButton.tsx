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
      onClick={handleCopy}
      className={cn(
        "absolute right-2 top-2 px-2 py-1 text-xs rounded border transition-all duration-200 z-10 font-sans",
        copied 
          ? "bg-foreground text-background border-foreground" 
          : "bg-background/80 text-subtle border-border hover:text-foreground hover:border-foreground backdrop-blur-sm"
      )}
      aria-label="Copy code"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
