
export interface SocialLink {
    platform: 'github' | 'twitter' | 'cnblogs' | 'other';
    url: string;
    label?: string;
}

export interface SiteConfig {
  title: string;
  logo: string;
  apiBaseUrl: string; // 后端 API 地址
  author: {
    name: string;
    avatar: string; // URL
    bio: string;
    motto: string;
  };
  socialLinks: SocialLink[];
}

export const siteConfig: SiteConfig = {
  title: "囫囵吞桃的个人博客",
  logo: "🍑",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  author: {
    name: "囫囵吞桃🍑",
    avatar: "https://avatars.githubusercontent.com/u/34204332?v=4", 
    bio: "Developer & Designer. Writing about code, art, and life.",
    motto: "Nulla dies sine linea." // No day without a line
  },
  socialLinks: [
    {
      platform: "github",
      url: "https://github.com/hltt",
      label: "GitHub"
    },
    {
      platform: "twitter",
      url: "https://x.com/HulunSi",
      label: "Twitter"
    },
    {
      platform: "cnblogs",
      url: "https://www.cnblogs.com/hulun",
      label: "Blog Garden"
    }
  ]
};
