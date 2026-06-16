import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/settings/", "/lobby/"],
    },
    sitemap: "https://r6hub.yourdomain.com/sitemap.xml",
  };
}
