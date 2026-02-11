import { Link } from "react-router-dom";
import { getAllTags, Tag } from "@/lib/posts";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AllTagsPage() {
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
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <motion.div 
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
            className="group flex flex-col p-4 border border-stone-200/60 rounded-lg hover:border-stone-300 hover:shadow-sm transition-all bg-white/50"
          >
            <div className="flex items-center justify-between mb-2">
                <span className="font-serif font-medium text-lg">#{tag.name}</span>
                <span className="bg-neutral-100 text-subtle text-xs px-2 py-1 rounded-full group-hover:bg-neutral-200 transition-colors">
                {tag.count}
                </span>
            </div>
            {tag.description && (
                <p className="text-sm text-stone-500 line-clamp-2">
                    {tag.description}
                </p>
            )}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
