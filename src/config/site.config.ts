interface SocialLink {
  platform: 'github' | 'twitter' | 'cnblogs' | 'xiaohongshu' | 'other';
  url: string;
  label?: string;
}

interface SiteConfig {
  title: string;
  logo: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
    motto: string;
  };
  socialLinks: SocialLink[];
}

function parseSocialLinks(raw?: string): SocialLink[] {
  const defaults: SocialLink[] = [
    { platform: "github", url: "https://github.com/HuLunTunTao", label: "GitHub" },
    { platform: "twitter", url: "https://x.com/HulunSi", label: "Twitter" },
    { platform: "xiaohongshu", url: "https://www.xiaohongshu.com/user/profile/5e42316e000000000100251a", label: "Red Note" },
    { platform: "cnblogs", url: "https://www.cnblogs.com/hulun", label: "CNBLOGS" },
  ];
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw) as unknown[];
    const links = parsed.filter((item): item is SocialLink =>
      typeof item === "object" &&
      item !== null &&
      "platform" in item &&
      "url" in item &&
      typeof (item as Record<string, unknown>).platform === "string" &&
      typeof (item as Record<string, unknown>).url === "string"
    );
    return links.length > 0 ? links : defaults;
  } catch {
    console.warn("[site.config] Failed to parse VITE_SOCIAL_LINKS, using defaults");
    return defaults;
  }
}

const env = import.meta.env;

export const siteConfig: SiteConfig = {
  title: env.VITE_SITE_TITLE ?? "囫囵吞桃的个人博客",
  logo: env.VITE_SITE_LOGO ?? "🍑",
  author: {
    name: env.VITE_AUTHOR_NAME ?? "囫囵吞桃🍑",
    avatar: env.VITE_AUTHOR_AVATAR ?? "/assets/avatar-20260723.jpg",
    bio: env.VITE_AUTHOR_BIO ?? "Undergraduate majoring in Computer Science.",
    motto: env.VITE_AUTHOR_MOTTO ?? "爱人者，人恒爱之。",
  },
  socialLinks: parseSocialLinks(env.VITE_SOCIAL_LINKS),
};
