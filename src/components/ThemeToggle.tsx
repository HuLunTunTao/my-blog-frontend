import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/context/theme";

interface Option {
  value: Theme;
  label: string;
  Icon: typeof Sun;
}

const options: Option[] = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "system", label: "Follow system theme", Icon: Monitor },
  { value: "dark", label: "Dark theme", Icon: Moon },
];

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-background p-1 font-sans shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        className
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-300",
              active
                ? "bg-foreground text-background"
                : "text-subtle hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}
