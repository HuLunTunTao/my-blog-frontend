import type { LucideProps } from "lucide-react";

type XiaohongshuIconProps = LucideProps;

export function XiaohongshuIcon({ size = 20, className, style, ...props }: XiaohongshuIconProps) {
  return (
    <img
      src="/assets/xiaohongshu.png"
      alt="Xiaohongshu"
      height={size}
      style={{
        display: "inline-block",
        height: size,
        width: "auto", // keep height consistent, allow natural width
        objectFit: "contain",
        verticalAlign: "middle",
        filter: "grayscale(1) brightness(1)", // lighten to match other gray icons
        transform: "translateY(-5.5px)",
        ...style
      }}
      className={className}
      aria-hidden="true"
      {...props}
    />
  );
}
