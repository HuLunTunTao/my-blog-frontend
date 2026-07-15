import type { CSSProperties } from "react";

interface XiaohongshuIconProps {
  size?: string | number;
  className?: string;
  style?: CSSProperties;
}

export function XiaohongshuIcon({ size = 20, className, style }: XiaohongshuIconProps) {
  return (
    <img
      src="/assets/xiaohongshu.png"
      alt="Xiaohongshu"
      width={205}
      height={96}
      style={{
        display: "inline-block",
        height: size,
        width: "auto", // keep height consistent, allow natural width
        objectFit: "contain",
        verticalAlign: "middle",
        filter: "grayscale(1) brightness(1)", // lighten to match other gray icons
        transform: "translateY(-6.3px)",
        ...style
      }}
      className={className}
      aria-hidden="true"
    />
  );
}
