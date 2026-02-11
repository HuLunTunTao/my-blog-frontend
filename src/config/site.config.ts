
export interface SocialLink {
    platform: 'github' | 'twitter' | 'cnblogs' | 'other';
    url: string;
    label?: string;
}

export interface SiteConfig {
  author: {
    name: string;
    avatar: string; // URL
    bio: string;
    motto: string;
  };
  socialLinks: SocialLink[];
}

export const siteConfig: SiteConfig = {
  author: {
    name: "囫囵吞桃🍑",
    avatar: "https://avatars.githubusercontent.com/u/34204332?v=4", // Updated to a generic cnblogs placeholder or similar if the previous one was specific
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
