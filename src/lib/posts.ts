import { Post, mockPosts } from "@/data/mockData";
import { compareDesc, format, parseISO } from "date-fns";

export function getAllPosts(): Post[] {
  return mockPosts.sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));
}

export function getVisiblePosts(): Post[] {
  return getAllPosts().filter(
    (post) =>
      post.visibility === "public" ||
      post.visibility === "encrypted" ||
      (post.masked && post.visibility !== "private")
  ).filter(post => !post.masked); // Timeline usually hides masked posts unless specifically asked, but guide says "public + encrypted + masked visible"
  // Guide says: "public + encrypted + masked visible". Wait.
  // "3️⃣ Timeline Grouping: public + encrypted + masked visible; private invisible"
  // So I should return all except private.
}

export function getTimelinePosts(): Post[] { 
    return getAllPosts().filter(p => p.visibility !== 'private');
}

export function getPostBySlug(slug: string): Post | undefined {
  return mockPosts.find((p) => p.slug === slug);
}

export function getTagIntro(tag: string): string | undefined {
  const introSlug = `_tag_${tag.toLowerCase()}`;
  const post = mockPosts.find((p) => p.slug === introSlug);
  return post ? post.content.slice(0, 200) : undefined;
}

export function getPostsByTag(tag: string): Post[] {
  return getVisiblePosts().filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function searchPosts(query: string): Post[] {
  const lowerQuery = query.toLowerCase();
  return getVisiblePosts().filter(
    (p) =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}

export function groupPostsByYearMonth(posts: Post[]) {
  const groups: Record<string, Record<string, Post[]>> = {};

  posts.forEach((post) => {
    const date = parseISO(post.date);
    const year = format(date, "yyyy");
    const month = format(date, "MM");

    if (!groups[year]) groups[year] = {};
    if (!groups[year][month]) groups[year][month] = [];

    groups[year][month].push(post);
  });

  return groups;
}

export function getRelatedPostsByTags(currentSlug: string, tags: string[]): Post[] {
    return getVisiblePosts()
        .filter(p => p.slug !== currentSlug && p.tags.some(t => tags.includes(t)))
        .slice(0, 5);
}

export function getPrevNextPost(currentSlug: string): { prev?: Post; next?: Post } {
    const posts = getVisiblePosts();
    const index = posts.findIndex(p => p.slug === currentSlug);
    
    if (index === -1) return {};
    
    return {
        prev: posts[index + 1], // Older post
        next: posts[index - 1], // Newer post
    };
}
