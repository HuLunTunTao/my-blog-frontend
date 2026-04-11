import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { GuestNote } from '@/lib/guestbook/types';
import { StickyNote } from './StickyNote';
import { WRINKLE_FILTER_COUNT } from '@/lib/guestbook/derive';
import type { ResolvedTheme } from '@/context/ThemeContext';

interface MessageBoardProps {
  notes: GuestNote[];
  currentTime: number;
  baseSize: number;
  baseLifespan: number;
  theme: ResolvedTheme;
  onNoteClick: (noteId: string) => void;
  style?: CSSProperties;
}

const TIER_SCALES = [2.5, 4.5, 7];
const SEED_FREQUENCIES = [0.85, 0.6, 1.1, 0.75, 0.95, 0.55, 0.8, 1.2];

export function GuestMessageBoard(props: MessageBoardProps) {
  const { notes, currentTime, baseSize, baseLifespan, theme, onNoteClick, style } = props;
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const update = () => {
      setBoardSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boardRef} className="gb-paper-field relative flex-1 w-full overflow-hidden" style={style}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          {Array.from({ length: WRINKLE_FILTER_COUNT }).flatMap((_, seedIdx) =>
            TIER_SCALES.map((scale, tierIdx) => {
              const baseFreq = SEED_FREQUENCIES[seedIdx % SEED_FREQUENCIES.length];
              const id = `wrinkle-${seedIdx}-${tierIdx}`;
              return (
                <filter key={id} id={id} x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency={baseFreq}
                    numOctaves={2}
                    seed={seedIdx * 7 + 3}
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale={scale}
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              );
            })
          )}
        </defs>
      </svg>

      {notes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          currentTime={currentTime}
          baseSize={baseSize}
          baseLifespan={baseLifespan}
          theme={theme}
          boardSize={boardSize}
          onClick={onNoteClick}
        />
      ))}
    </div>
  );
}
