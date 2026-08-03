import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";

import { siteConfig } from "@/config/site";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { GoogleAnalytics } from "@next/third-parties/google";

import "./globals.css";

import {
  getOrganizationSchema,
  getWebsiteSchema,
  serializeJsonLd,
} from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Website Development",
    "Local SEO",
    "AI Automation",
    "Google Business Profile Optimization",
    "Digital Marketing",
    "Web Design",
    "Business Automation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = [
    getOrganizationSchema(),
    getWebsiteSchema(),
  ];

  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(structuredData),
          }}
        />

        <div className="flex min-h-screen flex-col">
          <SiteHeader />

          <main className="flex-1">{children}</main>

          <SiteFooter />
        </div>
        <GoogleAnalytics
          gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!}
        />
      </body>
    </html>
  );
}