import { useMemo } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { AgingVisual, GuestNote } from '@/lib/guestbook/types';
import { deriveNote, formatNoteBg, formatNoteBand } from '@/lib/guestbook/derive';
import { computeAging, getPristineVisual } from '@/lib/guestbook/aging';
import type { ResolvedTheme } from '@/context/ThemeContext';

type CSSVarProperties = CSSProperties & Record<`--${string}`, string | number>;

interface StickyNoteProps {
  note: GuestNote;
  currentTime: number;
  baseSize: number;
  baseLifespan: number;
  theme: ResolvedTheme;
  boardSize?: { width: number; height: number };
  forcedVisual?: AgingVisual;
  onClick?: (noteId: string) => void;
  floating?: boolean;
  scale?: number;
}

export function StickyNote(props: StickyNoteProps) {
  const {
    note,
    currentTime,
    baseSize,
    baseLifespan,
    theme,
    boardSize,
    forcedVisual,
    onClick,
    floating = false,
    scale = 1,
  } = props;

  const derived = useMemo(() => deriveNote(note), [note]);

  const noteBg = useMemo(
    () => formatNoteBg(derived.hue, derived.colorVariance, theme),
    [derived.hue, derived.colorVariance, theme]
  );
  const noteBand = useMemo(
    () => formatNoteBand(derived.hue, theme),
    [derived.hue, theme]
  );

  const actualLifespan = Math.max(1, baseLifespan * derived.lifespanFactor);
  const age = (currentTime - note.createdAt) / actualLifespan;
  const visual = forcedVisual ?? computeAging(age, derived);

  if (!forcedVisual && age >= 1 && visual.opacity <= 0.01) {
    return null;
  }

  const width = baseSize * scale;
  const minHeight = baseSize * 1.1 * scale;

  let left: number | string | undefined;
  let top: number | string | undefined;
  if (!floating && boardSize) {
    left = derived.position.xRatio * (boardSize.width - width);
    top = derived.position.yRatio * (boardSize.height - minHeight);
  }

  const rotation = derived.baseTilt + visual.extraRotate;
  const translateX = visual.translate.x;
  const translateY = visual.translate.y;

  const surfaceFilterParts: string[] = [];
  if (visual.wrinkleStrength > 0.05) {
    let tier: 0 | 1 | 2 = 0;
    if (visual.wrinkleStrength >= 0.65) tier = 2;
    else if (visual.wrinkleStrength >= 0.3) tier = 1;
    surfaceFilterParts.push(`url(#wrinkle-${derived.wrinkleFilterIndex}-${tier})`);
  }
  if (visual.sepia > 0.001) surfaceFilterParts.push(`sepia(${visual.sepia.toFixed(3)})`);
  if (visual.brightness < 0.999) surfaceFilterParts.push(`brightness(${visual.brightness.toFixed(3)})`);
  if (visual.saturate < 0.999) surfaceFilterParts.push(`saturate(${visual.saturate.toFixed(3)})`);
  const surfaceFilter = surfaceFilterParts.length ? surfaceFilterParts.join(' ') : undefined;

  const transformOrigin =
    !forcedVisual && derived.fallStyle === 1 ? 'top center' : 'center center';

  const transformParts = [
    'perspective(1100px)',
    `translate(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px)`,
    `rotate(${rotation.toFixed(2)}deg)`,
  ];
  if (Math.abs(visual.rotateX) > 0.01) {
    transformParts.push(`rotateX(${visual.rotateX.toFixed(2)}deg)`);
  }
  if (Math.abs(visual.scale - 1) > 0.001) {
    transformParts.push(`scale(${visual.scale.toFixed(3)})`);
  }

  const outerStyle: CSSVarProperties = {
    width,
    minHeight,
    left,
    top,
    transform: transformParts.join(' '),
    transformOrigin,
    opacity: visual.opacity,
    '--note-bg': noteBg,
    '--note-band': noteBand,
    '--curl': visual.curlStrength,
    '--curl-opacity': visual.curlStrength > 0.05 ? 1 : 0,
  };
  if (floating) {
    outerStyle.position = 'relative';
    outerStyle.left = undefined;
    outerStyle.top = undefined;
  }

  const surfaceStyle: CSSProperties = {
    filter: surfaceFilter,
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClick?.(note.id);
  };

  const fontSizeContent = Math.max(12, baseSize * scale * 0.078);
  const fontSizeName = Math.max(11, baseSize * scale * 0.065);
  const padding = Math.max(11, baseSize * scale * 0.075);

  return (
    <div className="gb-sticky-paper" style={outerStyle} onClick={handleClick}>
      <div className="gb-sticky-paper-surface" style={surfaceStyle}>
        <div className="gb-band" />
        <div className="gb-adhesive" />
        <div className="gb-curl" />
      </div>
      <div
        className="gb-sticky-paper-content flex flex-col"
        style={{
          padding,
          paddingTop: padding + 6,
          gap: padding * 0.4,
        }}
      >
        <div className="flex items-center gap-2">
          {note.avatarUrl ? (
            <img
              src={note.avatarUrl}
              alt=""
              className="rounded-full object-cover flex-shrink-0"
              style={{
                width: baseSize * scale * 0.12,
                height: baseSize * scale * 0.12,
                border: '1px solid var(--gb-note-avatar-border)',
              }}
            />
          ) : (
            <div
              className="font-sans flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: baseSize * scale * 0.12,
                height: baseSize * scale * 0.12,
                background: 'var(--gb-note-avatar-bg)',
                color: 'var(--gb-ink)',
                fontSize: baseSize * scale * 0.05,
                letterSpacing: '0.05em',
                border: '1px solid var(--gb-note-avatar-border)',
              }}
            >
              {derived.initials}
            </div>
          )}
          <span
            className="font-sans truncate"
            style={{
              fontSize: fontSizeName,
              color: 'var(--gb-ink)',
              letterSpacing: '0.04em',
              lineHeight: 1.2,
            }}
          >
            {note.userName}
          </span>
        </div>
        <div
          className="font-serif break-words"
          style={{
            fontSize: fontSizeContent,
            lineHeight: 1.55,
            color: 'var(--gb-ink-soft)',
          }}
        >
          {note.content}
        </div>
      </div>
    </div>
  );
}

export { getPristineVisual };
