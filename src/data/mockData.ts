export interface Post {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  visibility: "public" | "masked" | "encrypted";
  masked: boolean;
  excerpt: string;
  content: string;
  encryptedPassword?: string;
  path?: string; // Folder path, e.g., "tech/frontend" or "" for root
}

// Folder structure to represent directory hierarchy
export interface FolderNode {
  name: string; // Folder name
  path: string; // Full path, e.g., "tech/frontend"
  description?: string; // Optional description content from a special file
  children: FolderNode[]; // Sub-folders
  posts: Post[]; // Posts directly in this folder
}

export const mockPosts: Post[] = [
  {
    slug: "code-and-poetry",
    title: "代码与诗歌的边界",
    date: "2024-03-05",
    tags: ["Tech", "Art", "随笔"],
    visibility: "public",
    masked: false,
    excerpt: "当算法遇上韵律，数字世界里的墨色晕染。",
    content: `
# 代码与诗歌的边界

在这个 **数字化** 的时代，可以认为代码是现代的文房四宝。

## 01. 递归之美 (The Beauty of Recursion)

代码逻辑中的递归，像极了古诗中的回文。

\`\`\`javascript
function inkWash(depth) {
    if (depth <= 0) return "归于虚无";
    return "墨" + inkWash(depth - 1);
}

console.log(inkWash(3)); 
// 输出: 墨墨墨归于虚无
\`\`\`

> "程序是写给人看的，只是偶尔让机器运行一下。" -- Don Knuth

![可爱的猫](https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800)

## 02. 多级标签与结构

我们尝试在这里展示一些复杂的层级：

### 墨色 (Ink Colors)
- 焦 (Scorched)
- 浓 (Thick)
- 重 (Heavy)
- 淡 (Light)
  - 微淡
  - 极淡
- 清 (Clear)

这也正是 [[Markdown 渲染测试]] 所需要展示的能力。
    `,
    path: ""
  },
  {
    slug: "markdown-test",
    title: "Markdown 渲染测试",
    date: "2024-03-02",
    tags: ["Test", "Markdown"],
    visibility: "public",
    masked: false,
    excerpt: "全面测试 Markdown 渲染器的能力：图片、代码、引用、列表。",
    content: `
# Markdown 渲染全面测试

这是一篇用于测试 **React Markdown** 组件渲染能力的示例文章。

## 图片测试 (Images)

一张来自 Unsplash 的随机风景图：

![Mountain View](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000)

## 代码高亮 (Code Highlighting)

支持多种语言的语法高亮：

**Python Data Analysis**
\`\`\`python
import pandas as pd
import numpy as np

def analyze_trend(data):
    """
    这是一个简单的分析函数
    """
    return data.mean() * np.pi
\`\`\`

**Rust System Programming**
\`\`\`rust
fn main() {
    let greeting = "你好，世界";
    println!("{}", greeting);
}
\`\`\`

## 列表嵌套 (Nested Lists)

1. 第一层有序列表
2. 第二项
   - 第二层无序列表
   - 包含 **加粗** 和 *斜体*
     1. 第三层有序列表
     2. 深度测试

## 引用块 (Blockquotes)

> 这是一个一级引用块。
>
> > 这是一个嵌套的二级引用块。
> > 可以用来展示对话或备注。

---

## 链接测试 (Links)

- 外部链接: [GitHub](https://github.com)
- 内部Wiki链接: [[Hello World]] (指向第一篇文章)
- 标签链接: #Tech #Test

`,
    path: ""
  },
  {
    slug: "hello-world",
    title: "Hello World",
    date: "2024-03-01",
    tags: ["Life", "Tech"],
    visibility: "public",
    masked: false,
    excerpt: "The start of something new.",
    content: `
# Hello World

This is the first post. It links to [[The Meaning of Life]] and mentions #Philosophy.

> This is a blockquote.
> It should have a thin black line on the left.

Here is some code:

\`\`\`typescript
console.log("Hello World");
\`\`\`
    `,
    path: ""
  },
  {
    slug: "the-meaning-of-life",
    title: "The Meaning of Life",
    date: "2024-02-28",
    tags: ["Philosophy"],
    visibility: "public",
    masked: false,
    excerpt: "Exploring the depths.",
    content: "The answer is 42. See also [[Deep Thought]].",
    path: ""
  },
  {
    slug: "deep-thought",
    title: "Deep Thought",
    date: "2024-02-27",
    tags: ["SciFi", "Philosophy"],
    visibility: "public",
    masked: false,
    excerpt: "Computers thinking deep thoughts.",
    content: "Calculating... Please wait.",
    path: ""
  },
  {
    slug: "secret-diary",
    title: "Secret Diary",
    date: "2024-02-20",
    tags: ["Private"],
    visibility: "encrypted",
    masked: false,
    excerpt: "You shouldn't see this.",
    content: "This is top secret.",
    path: ""
  },
  {
    slug: "masked-thoughts",
    title: "Masked Thoughts",
    date: "2024-02-15",
    tags: ["Thoughts"],
    visibility: "public",
    masked: true,
    excerpt: "Hidden behind a mask.",
    content: "You cannot see me on the timeline easily.",
    path: ""
  },
  {
    slug: "encrypted-note",
    title: "Encrypted Note",
    date: "2024-01-10",
    tags: ["Security"],
    visibility: "encrypted",
    masked: false,
    excerpt: "Password required.",
    content: "The secret code is: BANANA",
    encryptedPassword: "123",
    path: ""
  },
  {
    slug: "obsidian-workflow",
    title: "Obsidian Workflow",
    date: "2023-12-25",
    tags: ["Productivity", "Tech"],
    visibility: "public",
    masked: false,
    excerpt: "How I use Obsidian.",
    content: "I use [[Double Brackets]] for linking and #Tags for organizing.",
    path: ""
  },
  {
    slug: "zen-mode",
    title: "Zen Mode",
    date: "2023-11-11",
    tags: ["Life"],
    visibility: "public",
    masked: false,
    excerpt: "Achieving peace.",
    content: "Just breathe. And maybe read [[Hello World|my first post]].",
    path: ""
  },
  {
    slug: "_tag_philosophy",
    title: "Philosophy Tag Intro",
    date: "2023-01-01",
    tags: [],
    visibility: "masked", // Helper post
    masked: true,
    excerpt: "",
    content: "Philosophy is the study of general and fundamental questions, such as those about existence, reason, knowledge, values, mind, and language.",
    path: ""
  },
  {
    slug: "another-brick-in-the-wall",
    title: "Another Brick in the Wall",
    date: "2023-10-01",
    tags: ["Music", "Life"],
    visibility: "public",
    masked: false,
    excerpt: "We don't need no education.",
    content: "Pink Floyd is great.",
    path: ""
  },
  // Folder-structured posts
  {
    slug: "_folder_tech",
    title: "技术文件夹",
    date: "2024-01-01",
    tags: [],
    visibility: "public",
    masked: false,
    excerpt: "技术相关文章的集合",
    content: `# 技术专栏

这里收录了我在技术领域的思考和实践。

包括前端开发、后端架构、数据库设计等多个方向的文章。`,
    path: "tech"
  },
  {
    slug: "react-hooks-guide",
    title: "React Hooks 完全指南",
    date: "2024-02-10",
    tags: ["Tech", "React"],
    visibility: "public",
    masked: false,
    excerpt: "深入理解 React Hooks 的原理和最佳实践",
    content: `# React Hooks 完全指南

## useState 的妙用

\`\`\`typescript
const [count, setCount] = useState(0);
\`\`\`

Hooks 让函数组件拥有了状态管理的能力。`,
    path: "tech/frontend"
  },
  {
    slug: "_folder_tech_frontend",
    title: "前端开发",
    date: "2024-01-15",
    tags: [],
    visibility: "public",
    masked: false,
    excerpt: "前端技术专题",
    content: `# 前端开发专栏

关于现代前端开发的技术分享，包括：
- React/Vue 框架
- TypeScript
- 性能优化
- 工程化实践`,
    path: "tech/frontend"
  },
  {
    slug: "typescript-advanced",
    title: "TypeScript 高级类型",
    date: "2024-02-05",
    tags: ["Tech", "TypeScript"],
    visibility: "public",
    masked: false,
    excerpt: "掌握 TypeScript 的高级类型系统",
    content: `# TypeScript 高级类型

## 泛型约束

\`\`\`typescript
function getProperty<T, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}
\`\`\``,
    path: "tech/frontend"
  },
  {
    slug: "nodejs-best-practices",
    title: "Node.js 最佳实践",
    date: "2024-01-20",
    tags: ["Tech", "Node.js"],
    visibility: "public",
    masked: false,
    excerpt: "构建可靠的 Node.js 应用",
    content: `# Node.js 最佳实践

## 错误处理

始终使用 try-catch 包裹异步操作。`,
    path: "tech/backend"
  },
  {
    slug: "_folder_tech_backend",
    title: "后端开发",
    date: "2024-01-10",
    tags: [],
    visibility: "public",
    masked: false,
    excerpt: "后端技术专题",
    content: `# 后端开发专栏

服务端开发的技术要点：
- API 设计
- 数据库优化
- 微服务架构
- 性能调优`,
    path: "tech/backend"
  },
  {
    slug: "database-indexing",
    title: "数据库索引优化",
    date: "2024-01-18",
    tags: ["Tech", "Database"],
    visibility: "public",
    masked: false,
    excerpt: "理解索引原理，提升查询性能",
    content: `# 数据库索引优化

正确使用索引可以大幅提升查询性能。

## B-Tree 索引

最常用的索引类型。`,
    path: "tech/backend"
  },
  {
    slug: "_folder_life",
    title: "生活随笔",
    date: "2024-01-01",
    tags: [],
    visibility: "public",
    masked: false,
    excerpt: "记录生活的点滴",
    content: `# 生活随笔

这里是我的生活记录，包括旅行、阅读、思考等内容。`,
    path: "life"
  },
  {
    slug: "travel-kyoto",
    title: "京都之旅",
    date: "2023-12-20",
    tags: ["Life", "Travel"],
    visibility: "public",
    masked: false,
    excerpt: "在古都感受时光的沉淀",
    content: `# 京都之旅

漫步在清水寺，感受千年古都的韵味。

![京都街景](https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=1000)`,
    path: "life/travel"
  },
  {
    slug: "_folder_life_travel",
    title: "旅行记录",
    date: "2023-12-01",
    tags: [],
    visibility: "public",
    masked: false,
    excerpt: "世界那么大",
    content: `# 旅行记录

记录在路上的所见所闻，分享旅行的故事和感悟。`,
    path: "life/travel"
  },
  {
    slug: "book-review-sapiens",
    title: "《人类简史》读后感",
    date: "2023-11-15",
    tags: ["Life", "Book"],
    visibility: "public",
    masked: false,
    excerpt: "重新认识人类的历史",
    content: `# 《人类简史》读后感

尤瓦尔·赫拉利用独特的视角解读人类历史。

## 认知革命

虚构的故事让智人能够大规模协作。`,
    path: "life/reading"
  }
];
