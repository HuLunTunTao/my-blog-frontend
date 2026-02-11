import { Link } from "react-router-dom";
import { getVisiblePosts } from "@/lib/posts";
import { motion } from "framer-motion";

export default function AllTagsPage() {
  const posts = getVisiblePosts();
  const tagCounts: Record<string, number> = {};

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const tags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

  return (
    <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-8"
    >
      <h2 className="text-xl font-serif">All Tags</h2>
      <div className="flex flex-wrap gap-4">
        {tags.map((tag) => (
          <Link
            key={tag}
            to={`/tags/${tag}`}
            className="group flex items-center gap-2 border border-border px-3 py-2 rounded hover:border-black transition-colors"
          >
            <span className="font-sans font-medium">#{tag}</span>
            <span className="bg-neutral-100 text-subtle text-xs px-1.5 py-0.5 rounded group-hover:bg-neutral-200">
              {tagCounts[tag]}
            </span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
