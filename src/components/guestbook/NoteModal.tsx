import type { MouseEvent } from 'react';
import type { GuestNote } from '@/lib/guestbook/types';
import { StickyNote, getPristineVisual } from './StickyNote';
import type { ResolvedTheme } from '@/context/ThemeContext';

interface NoteModalProps {
  note: GuestNote;
  baseSize: number;
  theme: ResolvedTheme;
  onClose: () => void;
}

export function NoteModal(props: NoteModalProps) {
  const { note, baseSize, theme, onClose } = props;

  const stop = (e: MouseEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div
      className="gb-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="gb-modal-note-wrapper" onClick={stop}>
        <StickyNote
          note={note}
          currentTime={note.createdAt}
          baseSize={baseSize}
          baseLifespan={1}
          theme={theme}
          floating
          scale={1.75}
          forcedVisual={getPristineVisual()}
        />
      </div>
      <button
        type="button"
        className="absolute top-6 right-6 px-4 py-2 text-xs font-sans uppercase tracking-widest border border-border bg-background text-foreground hover:bg-foreground hover:text-background transition-colors"
        onClick={onClose}
      >
        Close
      </button>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-subtle font-sans">
        点击便签外区域或右上按钮关闭
      </div>
    </div>
  );
}
