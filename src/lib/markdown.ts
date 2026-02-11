import { Post } from "@/data/mockData";
import { toPostRoute } from "./postSlug";

function maskCodeChunks(content: string): { masked: string; chunks: string[] } {
    const chunks: string[] = [];
    let out = "";
    let i = 0;

    const pushCodeChunk = (chunk: string) => {
        const token = `__CODE_CHUNK_${chunks.length}__`;
        chunks.push(chunk);
        out += token;
    };

    while (i < content.length) {
        const tickPos = content.indexOf("`", i);
        if (tickPos === -1) {
            out += content.slice(i);
            break;
        }

        out += content.slice(i, tickPos);

        let run = 0;
        while (content[tickPos + run] === "`") run++;

        const atLineStart = tickPos === 0 || content[tickPos - 1] === "\n";
        if (run >= 3 && atLineStart) {
            const fence = "`".repeat(run);
            let closeStart = -1;
            let searchFrom = tickPos + run;
            while (searchFrom < content.length) {
                const candidate = content.indexOf(`\n${fence}`, searchFrom);
                if (candidate === -1) break;

                let after = candidate + 1 + run;
                while (after < content.length && (content[after] === " " || content[after] === "\t")) after++;
                if (after >= content.length || content[after] === "\n") {
                    closeStart = candidate + 1;
                    break;
                }
                searchFrom = candidate + 1;
            }

            if (closeStart !== -1) {
                let closeEnd = closeStart + run;
                while (closeEnd < content.length && content[closeEnd] !== "\n") closeEnd++;
                if (closeEnd < content.length) closeEnd++;
                pushCodeChunk(content.slice(tickPos, closeEnd));
                i = closeEnd;
                continue;
            }
        }

        const delimiter = "`".repeat(run);
        const closePos = content.indexOf(delimiter, tickPos + run);
        if (closePos !== -1) {
            pushCodeChunk(content.slice(tickPos, closePos + run));
            i = closePos + run;
            continue;
        }

        out += content.slice(tickPos, tickPos + run);
        i = tickPos + run;
    }

    return { masked: out, chunks };
}

function replaceOutsideCode(content: string, replacer: (text: string) => string): string {
    const { masked, chunks } = maskCodeChunks(content);
    const transformed = replacer(masked);
    return transformed.replace(/__CODE_CHUNK_(\d+)__/g, (_, index) => {
        const i = Number(index);
        return chunks[i] ?? "";
    });
}

export function parseWikiLinks(content: string, posts: Post[]): string {
    return replaceOutsideCode(content, (text) => {
        // Regex matches [[Title]] or [[Title|Alias]]
        return text.replace(/\[\[(.*?)\]\]/g, (_, inner) => {
            const [target, alias] = inner.split('|');
            const title = target.trim();
            const display = (alias || title).trim();
            
            const post = posts.find(p => p.title.toLowerCase() === title.toLowerCase());
            
            if (post) {
                return `[${display}](${toPostRoute(post.slug)})`;
            }
            return display; // Fallback to text
        });
    });
}

export function parseHashTags(content: string): string {
    return replaceOutsideCode(content, (text) => {
        // Matches #Tag. Ensure it's not a header (##) and has boundaries.
        return text.replace(/(^|\s|>)#([a-zA-Z0-9\u4e00-\u9fa5]+)/g, (_, prefix, tag) => {
            return `${prefix}[#${tag}](/tags/${tag})`;
        });
    });
}
