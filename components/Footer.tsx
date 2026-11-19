import { site } from "@/config/site";
import FitLine from "@/components/FitLine";

const P = "#9B7AFF";
const O = "#FF9B55";
const W = "#F3F1F7";

/** Bold geometric shapes, purple / orange / off-white. Purely decorative. */
const shapes: React.CSSProperties[] = [
  { background: P, borderRadius: "9999px" }, // circle
  { background: O, borderRadius: "9999px 9999px 0 0", height: "50%" }, // half circle
  { background: W, borderRadius: "18%" }, // rounded square
  { background: P, clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }, // triangle
  { background: O, borderRadius: "100% 0 0 0" }, // quarter circle
  { background: W, borderRadius: "9999px", height: "55%" }, // pill
  { background: P, transform: "rotate(45deg) scale(.72)" }, // diamond
  { border: `10px solid ${O}`, borderRadius: "9999px" }, // ring
];

export default function Footer() {
  return (
    <footer className="bg-ink text-ink-fg">
      <div className="gutter mx-auto max-w-6xl px-5 pb-8 pt-16 sm:px-8 sm:pt-24">
        <FitLine ratio={0.1854}>{site.name.toUpperCase()}</FitLine>

        <div aria-hidden="true" className="mt-10 flex items-end justify-between gap-2">
          {shapes.map((style, i) => (
            <div key={i} className="relative h-10 w-10 sm:h-16 sm:w-16">
              <div
                className="absolute bottom-0 left-0 h-full w-full"
                style={style}
              />
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-ink-border pt-6 text-xs text-ink-muted sm:flex-row">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <span>Built with Next.js, Tailwind &amp; GSAP</span>
        </div>
      </div>
    </footer>
  );
}
