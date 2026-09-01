import { Link } from "react-router-dom";
import { getAllTags, Tag } from "@/lib/posts";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { usePageMeta } from "@/lib/pageMeta";

export default function AllTagsPage() {
  usePageMeta({
    title: "标签",
    description: "浏览囫囵吞桃个人博客的全部标签索引。",
    canonicalPath: "/tags",
  });
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await getAllTags();
      setTags(data.sort((a, b) => b.count - a.count));
    } catch (error) {
      console.error("Failed to load tags:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        className="space-y-8"
      >
        <h2 className="text-xl font-serif">All Tags</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              to={`/tags/${tag.name}`}
              className="group flex h-22 flex-col p-4 border border-stone-200/60 dark:border-stone-700/60 rounded-none hover:border-stone-300 dark:hover:border-stone-600 hover:shadow-sm transition-all bg-white/50 dark:bg-stone-900/40"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif font-medium text-lg line-clamp-1">#{tag.name}</span>
                <span className="bg-neutral-100 dark:bg-stone-800 text-subtle text-xs px-2 py-1 rounded-none group-hover:bg-neutral-200 dark:group-hover:bg-stone-700 transition-colors">
                  {tag.count}
                </span>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 min-h-[2.75rem]">
                {tag.description || ""}
              </p>
            </Link>
          ))}
        </div>
      </m.div>
    </LazyMotion>
  );
}
