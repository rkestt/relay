import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://Relay.yourdomain.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/settings/", "/lobby/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
