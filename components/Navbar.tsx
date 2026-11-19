import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#demos", label: "Demos" },
  { href: "#skills", label: "Skills" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

/** Always dark: sits over the hero and stays legible on both themes. */
export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink-border bg-ink/95 text-ink-fg backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 min-[430px]:px-4 sm:gap-3 sm:px-8">
        <a
          href="#top"
          className="hidden shrink-0 font-display text-xl uppercase tracking-wide sm:block"
        >
          Akshay
        </a>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:gap-7">
          <ul className="flex min-w-0 items-center gap-2.5 overflow-x-auto whitespace-nowrap text-[11px] font-medium uppercase tracking-normal [scrollbar-width:none] max-[429px]:gap-1.5 max-[429px]:text-[10px] sm:gap-4 sm:overflow-visible sm:text-xs sm:tracking-wider md:gap-6 md:text-sm [&::-webkit-scrollbar]:hidden">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-ink-muted transition-colors hover:text-ink-fg">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
