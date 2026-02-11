export interface Post {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  visibility: "public" | "private" | "encrypted";
  masked: boolean;
  excerpt: string;
  content: string;
  encryptedPassword?: string;
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
    `
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

`
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
    `
  },
  {
    slug: "the-meaning-of-life",
    title: "The Meaning of Life",
    date: "2024-02-28",
    tags: ["Philosophy"],
    visibility: "public",
    masked: false,
    excerpt: "Exploring the depths.",
    content: "The answer is 42. See also [[Deep Thought]]."
  },
  {
    slug: "deep-thought",
    title: "Deep Thought",
    date: "2024-02-27",
    tags: ["SciFi", "Philosophy"],
    visibility: "public",
    masked: false,
    excerpt: "Computers thinking deep thoughts.",
    content: "Calculating... Please wait."
  },
  {
    slug: "secret-diary",
    title: "Secret Diary",
    date: "2024-02-20",
    tags: ["Private"],
    visibility: "private",
    masked: false,
    excerpt: "You shouldn't see this.",
    content: "This is top secret."
  },
  {
    slug: "masked-thoughts",
    title: "Masked Thoughts",
    date: "2024-02-15",
    tags: ["Thoughts"],
    visibility: "public",
    masked: true,
    excerpt: "Hidden behind a mask.",
    content: "You cannot see me on the timeline easily."
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
    encryptedPassword: "123"
  },
  {
    slug: "obsidian-workflow",
    title: "Obsidian Workflow",
    date: "2023-12-25",
    tags: ["Productivity", "Tech"],
    visibility: "public",
    masked: false,
    excerpt: "How I use Obsidian.",
    content: "I use [[Double Brackets]] for linking and #Tags for organizing."
  },
  {
    slug: "zen-mode",
    title: "Zen Mode",
    date: "2023-11-11",
    tags: ["Life"],
    visibility: "public",
    masked: false,
    excerpt: "Achieving peace.",
    content: "Just breathe. And maybe read [[Hello World|my first post]]."
  },
  {
    slug: "_tag_philosophy",
    title: "Philosophy Tag Intro",
    date: "2023-01-01",
    tags: [],
    visibility: "private", // Helper post
    masked: true,
    excerpt: "",
    content: "Philosophy is the study of general and fundamental questions, such as those about existence, reason, knowledge, values, mind, and language."
  },
  {
    slug: "another-brick-in-the-wall",
    title: "Another Brick in the Wall",
    date: "2023-10-01",
    tags: ["Music", "Life"],
    visibility: "public",
    masked: false,
    excerpt: "We don't need no education.",
    content: "Pink Floyd is great."
  }
];
