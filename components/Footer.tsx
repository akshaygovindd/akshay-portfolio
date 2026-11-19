import { site } from "@/config/site";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-8 text-xs text-muted sm:flex-row sm:px-8 sm:pr-48">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>Built with Next.js, Tailwind, GSAP &amp; Recharts</span>
      </div>
    </footer>
  );
}
