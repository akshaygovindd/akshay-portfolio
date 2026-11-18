import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "#about", label: "about" },
  { href: "#projects", label: "projects" },
  { href: "#skills", label: "skills" },
  { href: "#contact", label: "contact" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="font-mono text-sm font-semibold">
          <span className="text-accent">~/</span>akshay
        </a>
        <div className="flex items-center gap-4 sm:gap-6">
          <ul className="flex items-center gap-3 font-mono text-xs sm:gap-6 sm:text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-muted transition-colors hover:text-accent">
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
