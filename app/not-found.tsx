import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Next answers unmatched URLs and notFound() calls with a real 404 status and adds <meta name="robots" content="noindex">;
// it is set here as well so the intent is in the code. The home page's canonical, Open Graph and Twitter tags are
// cleared: they would point search engines and link previews at "/" from a page that is not the home page.
export const metadata: Metadata = {
  title: `Page not found | ${site.name}`,
  robots: { index: false, follow: false },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

/**
 * 404: a reading page like the case studies, so no corner avatar. The pool pose is a normal image in the page
 * (with width and height, so nothing shifts); there is no animation, so there is nothing for reduced motion to turn off.
 */
export default function NotFound() {
  const { notFound } = site;
  // The image sits inside <picture> on purpose. React adds a <link rel="preload"> to the document head for every normal <img> it
  // renders (not for lazy ones, low-priority ones, or ones inside <picture>), and Next includes this component in every
  // page, so a bare <img> here made the home page download the pool pose for nothing (and WebKit warned about the unused
  // preload). <picture> avoids that, so fetchPriority="high" below only raises the image's priority in the browser (it is this page's
  // main content and its largest paint) and adds no preload link.
  // min-h-[100svh]: the footer's own text re-wraps by a few pixels when the web fonts swap in, on every page. Here the page is
  // short, so a smaller main would leave the footer in the first screen and that small shift would count. Filling the screen keeps it below the fold.
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar home="/" />
      <main id="main" className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-5 pb-12 pt-24 sm:px-8 sm:pt-28">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          {/* The column is a size container, so the heading below can be sized from its width (cqw) */}
          <div className="min-w-0" style={{ containerType: "inline-size" }}>
            <p className="font-mono text-xs uppercase tracking-wider text-muted">Error 404</p>
            {/* Always two lines, never wrapped, so the web font arriving late cannot change the height and move anything.
                Anton is a condensed face and its fallback (Arial, size-adjusted by next/font) is about 29% wider for capitals, so
                both lines are sized from the container with the FALLBACK's width (4.57 em and 13.95 em) and fit in either font,
                down to a 320px screen (a 280px container). */}
            <h1 className="mt-3 font-display uppercase" style={{ lineHeight: 1.02 }}>
              <span className="block whitespace-nowrap" style={{ fontSize: "clamp(2.5rem, calc(100cqw / 4.8), 7rem)" }}>
                {notFound.heading[0]}
              </span>{" "}
              <span className="mt-1 block whitespace-nowrap" style={{ fontSize: "clamp(1.125rem, calc(100cqw / 14.2), 3rem)" }}>
                {notFound.heading[1]}
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">{notFound.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="btn btn-primary">
                Home
              </Link>
              <Link href="/#projects" className="btn">
                Projects
              </Link>
            </div>
          </div>
          {/* block + the size classes on <picture> itself: a bare inline <picture> has no box of its own until the image arrives (a layout shift) */}
          <picture className="mx-auto block w-full max-w-[22rem] md:max-w-[28rem]">
            <img
              src="/avatar/desk-pool.webp"
              alt={notFound.imageAlt}
              width={600}
              height={448}
              fetchPriority="high"
              draggable={false}
              className="h-auto w-full select-none"
            />
          </picture>
        </div>
      </main>
      <Footer companion={false} />
    </>
  );
}
