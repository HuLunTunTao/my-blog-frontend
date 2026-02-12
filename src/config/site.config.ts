
export interface SocialLink {
  platform: 'github' | 'twitter' | 'cnblogs' | 'xiaohongshu' | 'other';
    url: string;
    label?: string;
}

export interface SiteConfig {
  title: string;
  logo: string;
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
  author: {
    name: "囫囵吞桃🍑",
    avatar: "https://avatars.githubusercontent.com/u/34204332?v=4", 
    bio: "Undergraduate majoring in Computer Science.",
    motto: "爱人者，人恒爱之。" // No day without a line
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
      platform: "xiaohongshu",
      url: "https://www.xiaohongshu.com/user/profile/5e42316e000000000100251a",
      label: "Red Note"
    },
    {
      platform: "cnblogs",
      url: "https://www.cnblogs.com/hulun",
      label: "CNBLOGS"
    }
  ]
};
