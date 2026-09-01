import { buildFolderTree, FolderNode } from "@/lib/posts";
import FolderTree from "@/components/FolderTree";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { usePageMeta } from "@/lib/pageMeta";

export default function FoldersPage() {
  usePageMeta({
    title: "文件夹",
    description: "按文件夹层次浏览囫囵吞桃个人博客的文章。",
    canonicalPath: "/folders",
  });
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTree() {
      try {
        const tree = await buildFolderTree();
        setFolderTree(tree);
      } catch (error) {
        console.error("Failed to load folder tree:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTree();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400 dark:text-stone-500" />
      </div>
    );
  }

  if (!folderTree) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-stone-500 dark:text-stone-400">
        加载文件夹树失败。
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="max-w-4xl mx-auto">
        <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.13 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-serif mb-4 text-foreground">文件夹</h1>
        <p className="text-stone-600 dark:text-stone-400">
          按文件夹层次浏览文章，探索不同主题的内容。
        </p>
        </m.div>

        <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07, duration: 0.13 }}
        className="bg-white/50 dark:bg-stone-900/40 rounded-none border border-stone-200/60 dark:border-stone-700/60 p-6"
      >
        <FolderTree root={folderTree} />
        </m.div>

        {/* Stats */}
        <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13, duration: 0.13 }}
        className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        <div className="p-4 bg-stone-50/50 dark:bg-stone-900/30 rounded-none border border-stone-200/40 dark:border-stone-700/40">
          <div className="text-2xl font-serif text-foreground mb-1">
            {countFolders(folderTree)}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            文件夹数量
          </div>
        </div>
        <div className="p-4 bg-stone-50/50 dark:bg-stone-900/30 rounded-none border border-stone-200/40 dark:border-stone-700/40">
          <div className="text-2xl font-serif text-foreground mb-1">
            {folderTree.postCount ?? 0}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            文章总数
          </div>
        </div>
        <div className="p-4 bg-stone-50/50 dark:bg-stone-900/30 rounded-none border border-stone-200/40 dark:border-stone-700/40 col-span-2 md:col-span-1">
          <div className="text-2xl font-serif text-foreground mb-1">
            {getMaxDepth(folderTree)}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            最大层级
          </div>
        </div>
        </m.div>
      </div>
    </LazyMotion>
  );
}

// Helper functions
function countFolders(node: FolderNode): number {
  if (!node || !node.children) return 0;
  let count = node.children.length;
  node.children.forEach((child) => {
    count += countFolders(child);
  });
  return count;
}

function getMaxDepth(node: FolderNode, currentDepth: number = 0): number {
  if (!node || !node.children || node.children.length === 0) {
    return currentDepth;
  }
  const depths = node.children.map((child) => 
    getMaxDepth(child, currentDepth + 1)
  );
  return Math.max(...depths);
}
