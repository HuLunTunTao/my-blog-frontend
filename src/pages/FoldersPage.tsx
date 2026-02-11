import { buildFolderTree } from "@/lib/posts";
import FolderTree from "@/components/FolderTree";
import { motion } from "framer-motion";

export default function FoldersPage() {
  const folderTree = buildFolderTree();

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.13 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-serif mb-4 text-foreground">文件夹</h1>
        <p className="text-stone-600">
          按文件夹层次浏览文章，探索不同主题的内容。
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07, duration: 0.13 }}
        className="bg-white/50 rounded-lg border border-stone-200/60 p-6"
      >
        <FolderTree root={folderTree} />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13, duration: 0.13 }}
        className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        <div className="p-4 bg-stone-50/50 rounded-lg border border-stone-200/40">
          <div className="text-2xl font-serif text-foreground mb-1">
            {countFolders(folderTree)}
          </div>
          <div className="text-xs text-stone-500 uppercase tracking-wider">
            文件夹数量
          </div>
        </div>
        <div className="p-4 bg-stone-50/50 rounded-lg border border-stone-200/40">
          <div className="text-2xl font-serif text-foreground mb-1">
            {countPosts(folderTree)}
          </div>
          <div className="text-xs text-stone-500 uppercase tracking-wider">
            文章总数
          </div>
        </div>
        <div className="p-4 bg-stone-50/50 rounded-lg border border-stone-200/40 col-span-2 md:col-span-1">
          <div className="text-2xl font-serif text-foreground mb-1">
            {getMaxDepth(folderTree)}
          </div>
          <div className="text-xs text-stone-500 uppercase tracking-wider">
            最大层级
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Helper functions
function countFolders(node: any): number {
  let count = node.children.length;
  node.children.forEach((child: any) => {
    count += countFolders(child);
  });
  return count;
}

function countPosts(node: any): number {
  let count = node.posts.length;
  node.children.forEach((child: any) => {
    count += countPosts(child);
  });
  return count;
}

function getMaxDepth(node: any, currentDepth: number = 0): number {
  if (node.children.length === 0) {
    return currentDepth;
  }
  const depths = node.children.map((child: any) => 
    getMaxDepth(child, currentDepth + 1)
  );
  return Math.max(...depths);
}
