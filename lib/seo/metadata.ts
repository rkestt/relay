import { Metadata } from "next";

interface MetadataProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://r6hub.yourdomain.com";

export function generateMetadata({
  title,
  description,
  image = "/og-default.png",
  url = "",
  type = "website",
}: MetadataProps): Metadata {
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const fullImageUrl = image.startsWith("http")
    ? image
    : `${baseUrl}${image}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: "r6hub",
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "it_IT",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}
