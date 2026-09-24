type PinnedPostBadgeProps = {
  className?: string;
};

export default function PinnedPostBadge({ className = "" }: PinnedPostBadgeProps) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-sm border border-foreground/20 bg-foreground/5 px-2 py-[3px] text-[10px] font-medium leading-none tracking-[0.12em] text-subtle ${className}`}>
      置顶
    </span>
  );
}
