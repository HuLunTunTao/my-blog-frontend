import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { GuestNote } from '@/lib/guestbook/types';
import { fetchGiscusNotes } from '@/lib/guestbook/giscus';
import { GuestMessageBoard } from '@/components/guestbook/MessageBoard';
import { NoteModal } from '@/components/guestbook/NoteModal';
import { GuestbookGiscus } from '@/components/guestbook/GuestbookGiscus';
import { useTheme } from '@/context/ThemeContext';

const BASE_LIFESPAN_DAYS = 30;
const BASE_LIFESPAN = BASE_LIFESPAN_DAYS * 86400;
const BASE_SIZE = 220;

export default function GuestbookPage() {
  const { resolvedTheme } = useTheme();
  const [notes, setNotes] = useState<GuestNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now() / 1000);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await fetchGiscusNotes();
      setNotes(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载留言失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const didFetchRef = useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 60_000);
    return () => clearInterval(id);
  }, []);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) ?? null,
    [notes, activeNoteId]
  );

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="space-y-0"
      >
        {/* Header */}
        <header className="space-y-4 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-xs font-sans uppercase tracking-widest text-subtle">Guestbook · 001</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-medium leading-tight">
            留言板
          </h1>
          <p className="text-sm text-muted font-serif leading-relaxed max-w-2xl">
            在下方 Giscus 区域登录 GitHub 后即可留言。
            每条留言会以便签形式出现在板上；随着时间推移，便签会慢慢老去 —— {BASE_LIFESPAN_DAYS} 天后它将脱落消失。
            点击便签可放大查看原始内容。
          </p>

          <div className="h-px bg-border" />

          <div className="flex items-center gap-4 text-[10px] font-sans uppercase tracking-widest text-subtle">
            <span>消失周期 · {BASE_LIFESPAN_DAYS} 天</span>
            <span>·</span>
            <span>便签数 · {notes.length}</span>
            {loading && <span>· 加载中...</span>}
            {error && <span className="text-red-500">· {error}</span>}
            <button
              type="button"
              className="ml-auto px-3 py-1 text-[10px] font-sans uppercase tracking-widest border border-border text-subtle hover:text-foreground hover:border-foreground transition-colors"
              onClick={loadNotes}
              disabled={loading}
            >
              刷新
            </button>
          </div>
        </header>

        {/* Board */}
        {loading && notes.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
            <Loader2 className="w-8 h-8 animate-spin text-stone-400 dark:text-stone-500" />
          </div>
        ) : notes.length > 0 ? (
          <GuestMessageBoard
            notes={notes}
            currentTime={now}
            baseSize={BASE_SIZE}
            baseLifespan={BASE_LIFESPAN}
            theme={resolvedTheme}
            onNoteClick={(id) => setActiveNoteId(id)}
            style={{ minHeight: '70vh' }}
          />
        ) : (
          <div
            className="gb-paper-field flex items-center justify-center"
            style={{ minHeight: 300 }}
          >
            <p className="font-serif text-subtle text-base">
              还没有人留言 —— 在下方成为第一个！
            </p>
          </div>
        )}

        {/* Giscus section */}
        <div className="pt-12 mt-12 border-t border-stone-200/50 dark:border-stone-800/50">
          <div className="max-w-3xl mx-auto">
            <div className="h-px bg-border mb-6" />
            <div className="text-[10px] font-sans uppercase tracking-widest text-subtle mb-4">
              发表留言
            </div>
            <GuestbookGiscus theme={resolvedTheme} onDiscussionUpdate={loadNotes} />
          </div>
        </div>

        {/* Modal */}
        {activeNote && (
          <NoteModal
            note={activeNote}
            baseSize={BASE_SIZE}
            theme={resolvedTheme}
            onClose={() => setActiveNoteId(null)}
          />
        )}
      </m.div>
    </LazyMotion>
  );
}
