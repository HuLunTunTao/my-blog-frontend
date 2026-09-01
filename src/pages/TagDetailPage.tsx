import { useParams, Link } from "react-router-dom";
import { getPostsByTag, getAllTags, Post, Tag } from "@/lib/posts";
import { format, parseISO } from "date-fns";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useReducer, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toPostRoute } from "@/lib/postSlug";
import { usePageMeta } from "@/lib/pageMeta";

type State = {
  posts: Post[];
  tagInfo: Tag | null;
  loading: boolean;
  page: number;
  totalPages: number;
};

type Action =
  | { type: "set_page"; page: number }
  | { type: "start_loading" }
  | { type: "loaded"; posts: Post[]; totalPages: number; tagInfo: Tag | null };

const initialState: State = {
  posts: [],
  tagInfo: null,
  loading: true,
  page: 1,
  totalPages: 1,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set_page":
      return { ...state, page: action.page };
    case "start_loading":
      return { ...state, loading: true };
    case "loaded":
      return {
        ...state,
        posts: action.posts,
        totalPages: action.totalPages,
        tagInfo: action.tagInfo,
        loading: false,
      };
    default:
      return state;
  }
}

export default function TagDetailPage() {
  const { tag } = useParams();
  const [state, dispatch] = useReducer(reducer, initialState);

  usePageMeta({
    title: tag ? `标签：${tag}` : "标签",
    description: state.tagInfo?.description || `浏览标签「${tag ?? ""}」下的文章。`,
    canonicalPath: tag ? `/tags/${encodeURIComponent(tag)}` : "/tags",
  });

  const loadData = useCallback(async () => {
    if (!tag) {
      dispatch({ type: "loaded", posts: [], totalPages: 1, tagInfo: null });
      return;
    }

    dispatch({ type: "start_loading" });
    try {
      const [postsResponse, tagsResponse] = await Promise.all([
        getPostsByTag(tag, state.page, 20),
        getAllTags(),
      ]);
      const currentTag = tagsResponse.find((item) => item.name === tag) || null;
      dispatch({
        type: "loaded",
        posts: postsResponse.posts,
        totalPages: postsResponse.totalPages,
        tagInfo: currentTag,
      });
    } catch (error) {
      console.error("Failed to load data:", error);
      dispatch({ type: "loaded", posts: [], totalPages: 1, tagInfo: null });
    }
  }, [tag, state.page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!tag) return null;

  if (state.loading && state.posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400 dark:text-stone-500" />
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-12"
      >
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-subtle">Tag</span>
          <h1 className="text-3xl font-serif">#{tag}</h1>
          {state.tagInfo?.description && <p className="text-stone-500 dark:text-stone-400 font-serif leading-relaxed">{state.tagInfo.description}</p>}
        </header>

        <div className="space-y-8">
          {state.posts.map((post) => (
            <article key={post.slug} className="group relative py-6 px-8">
              <div className="paper-texture absolute inset-0 bg-white/60 dark:bg-stone-900/55 -z-10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.4)] rounded-none" />

              <Link to={toPostRoute(post)} className="block">
                <div className="flex justify-between items-baseline mb-2">
                  <h2 className="text-xl font-medium decoration-1 underline-offset-4 hover:underline tracking-tight transition-colors">{post.title}</h2>
                  <span className="text-xs text-subtle font-sans opacity-70">{format(parseISO(post.date), "yyyy-MM-dd")}</span>
                </div>
                {post.excerpt && <p className="text-stone-500 dark:text-stone-400 font-serif text-sm line-clamp-2 leading-relaxed">{post.excerpt}</p>}
              </Link>
            </article>
          ))}
          {state.posts.length === 0 && <p className="text-center text-subtle">No posts found with this tag.</p>}
        </div>

        {state.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              type="button"
              onClick={() => dispatch({ type: "set_page", page: Math.max(1, state.page - 1) })}
              disabled={state.page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {state.page} of {state.totalPages}
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: "set_page", page: Math.min(state.totalPages, state.page + 1) })}
              disabled={state.page === state.totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </m.div>
    </LazyMotion>
  );
}
