import { Post } from "@/data/mockData";

export function parseWikiLinks(content: string, posts: Post[]): string {
    // Regex matches [[Title]] or [[Title|Alias]]
    return content.replace(/\[\[(.*?)\]\]/g, (match, inner) => {
        const [target, alias] = inner.split('|');
        const title = target.trim();
        const display = (alias || title).trim();
        
        const post = posts.find(p => p.title.toLowerCase() === title.toLowerCase());
        
        if (post) {
            return `[${display}](/posts/${post.slug})`;
        }
        return display; // Fallback to text
    });
}

export function parseHashTags(content: string): string {
    // Matches #Tag. Ensure it's not a header (##) and has boundaries.
    return content.replace(/(^|\s|>)#([a-zA-Z0-9\u4e00-\u9fa5]+)/g, (match, prefix, tag) => {
        return `${prefix}[#${tag}](/tags/${tag})`;
    });
}
