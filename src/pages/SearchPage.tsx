import { useSearchParams, Link } from "react-router-dom";
import { searchPosts, Post } from "@/lib/posts";
import { format, parseISO } from "date-fns";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toPostRoute } from "@/lib/postSlug";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return <>{text}</>;

  const regex = new RegExp(escapeRegExp(trimmedQuery), "gi");
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match = regex.exec(text);

  while (match) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      nodes.push(<span key={`plain-${lastIndex}`}>{text.slice(lastIndex, start)}</span>);
    }
    nodes.push(
      <mark key={`match-${start}`} className="bg-yellow-200 rounded-sm px-0.5">
        {text.slice(start, end)}
      </mark>,
    );
    lastIndex = end;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`plain-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <>{nodes}</>;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQueryRef = useRef(searchParams.get("q") || "");
  const [inputValue, setInputValue] = useState(initialQueryRef.current);
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const isComposingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const performSearch = useCallback(async (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      setResults([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await searchPosts(normalized);
      if (requestId === requestIdRef.current) {
        setResults(data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (initialQueryRef.current) {
      void performSearch(initialQueryRef.current);
    }
  }, [performSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const updateQueryParam = useCallback(
    (value: string) => {
      if (value) {
        setSearchParams({ q: value }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams],
  );

  const scheduleQueryUpdate = useCallback(
    (value: string) => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        updateQueryParam(value);
        void performSearch(value);
      }, 300);
    },
    [performSearch, updateQueryParam],
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (isComposingRef.current) {
      return;
    }
    scheduleQueryUpdate(value);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const value = e.currentTarget.value;
    setInputValue(value);
    scheduleQueryUpdate(value);
  };
  const query = inputValue.trim();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-8"
      >
        <div className="sticky top-16 bg-background pt-4 pb-4 z-10">
          <input
            type="text"
            value={inputValue}
            onChange={handleSearch}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Search posts..."
            className="w-full text-2xl font-serif border-b-2 border-border focus:border-black outline-none py-2 bg-transparent placeholder:text-neutral-300 transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        ) : (
          <div className="space-y-8">
            {query && results.length === 0 && (
            <p className="text-subtle text-center py-12">No results found for "{query}".</p>
            )}

            {results.map((post) => (
              <article key={post.slug} className="group relative p-6 transition-all duration-300 hover:translate-x-1">
                {/* Individual Paper Layer */}
                <div
                  className="absolute inset-0 bg-white/50 backdrop-blur-[2px] -z-10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] rounded-sm"
                  style={{
                    backgroundImage: `url("/assets/paperGrain-128.svg")`,
                  }}
                />

                <Link to={toPostRoute(post.slug)} className="block space-y-2">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-xl font-medium group-hover:underline decoration-1 underline-offset-4">
                      <Highlight text={post.title} query={query} />
                    </h2>
                    <span className="text-xs text-subtle font-sans">
                      {format(parseISO(post.date), "yyyy-MM-dd")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {post.tags.map(t => (
                      <span key={t} className="text-xs text-subtle bg-neutral-100 px-1.5 rounded">
                        <Highlight text={`#${t}`} query={query} />
                      </span>
                    ))}
                  </div>
                  {post.excerpt && (
                    <p className="text-subtle text-sm line-clamp-2">
                      <Highlight text={post.excerpt} query={query} />
                    </p>
                  )}
                </Link>
              </article>
            ))}
          </div>
        )}
      </m.div>
    </LazyMotion>
  );
}
