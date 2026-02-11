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
