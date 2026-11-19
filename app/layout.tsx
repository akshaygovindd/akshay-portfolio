import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { site } from "@/config/site";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const TITLE = `${site.name} | ${site.title}`;
const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: `${site.name}, ${site.title}` };

export const metadata: Metadata = {
  // Every relative URL below (canonical, og:image, ...) resolves against this.
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: TITLE,
    description: site.description,
    siteName: site.name,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: site.description,
    images: [OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
};

// Vercel Analytics / Speed Insights only exist on Vercel (their scripts are served from
// /_vercel/...), so they are rendered only in Vercel builds. VERCEL=1 is set during the build.
const onVercel = process.env.VERCEL === "1";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body>
        {/* First focusable element on the page; visible only while focused */}
        <a href="#projects" className="skip-link">
          Skip to projects
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
        {onVercel && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
