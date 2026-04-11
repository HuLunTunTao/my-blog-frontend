export interface GuestNote {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  content: string;
  /** Publish time in seconds (unix epoch / 1000). */
  createdAt: number;
}

/** How a note leaves the board when its time is up. */
export type FallStyle = 0 | 1 | 2 | 3;

export interface AgingVisual {
  stage: 0 | 1 | 2 | 3 | 4 | 5;
  wrinkleStrength: number;
  curlStrength: number;
  sepia: number;
  brightness: number;
  saturate: number;
  extraRotate: number;
  rotateX: number;
  scale: number;
  translate: { x: number; y: number };
  opacity: number;
}

export interface NoteDerived {
  hash: number;
  position: { xRatio: number; yRatio: number };
  hue: number;
  colorVariance: number;
  baseTilt: number;
  lifespanFactor: number;
  wrinkleFilterIndex: number;
  fall: { dx: number; dy: number; dRot: number };
  initials: string;
  fallStyle: FallStyle;
}
