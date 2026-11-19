import { diagrams, type DEdge, type DiagramSpec, type Side } from "@/config/diagrams";

type Box = { x: number; y: number; w: number; h: number };

function anchor(b: Box, side: Side, f = 0.5): [number, number] {
  if (side === "t") return [b.x + b.w * f, b.y];
  if (side === "b") return [b.x + b.w * f, b.y + b.h];
  if (side === "l") return [b.x, b.y + b.h * f];
  return [b.x + b.w, b.y + b.h * f];
}

/** Straight line when the ends line up, otherwise one elbow halfway between them. */
function route(e: DEdge, from: Box, to: Box) {
  const [x1, y1] = anchor(from, e.fs, e.fa);
  const [x2, y2] = anchor(to, e.ts, e.ta);
  const vertical = e.fs === "t" || e.fs === "b";
  let d: string;
  let mx: number;
  let my: number;
  if (vertical) {
    const m = (y1 + y2) / 2;
    d = x1 === x2 ? `M${x1} ${y1}V${y2}` : `M${x1} ${y1}V${m}H${x2}V${y2}`;
    mx = (x1 + x2) / 2;
    my = m;
  } else {
    const m = (x1 + x2) / 2;
    d = y1 === y2 ? `M${x1} ${y1}H${x2}` : `M${x1} ${y1}H${m}V${y2}H${x2}`;
    mx = m;
    my = (y1 + y2) / 2;
  }
  return { d, mx, my };
}

/**
 * Static SVG architecture diagram in the site palette (colours come from the theme CSS
 * variables, so it follows light and dark). It is a picture of the "Architecture" list above it,
 * so it has a text description for screen readers.
 */
export default function ArchDiagram({ id }: { id: keyof typeof diagrams }) {
  const spec: DiagramSpec = diagrams[id];
  const boxes = new Map<string, Box>();
  spec.groups?.forEach((g) => boxes.set(g.id, g));
  spec.nodes.forEach((n) => boxes.set(n.id, n));
  const uid = `arch-${id}`;

  return (
    <figure className="my-8">
      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${spec.w} ${spec.h}`}
          role="img"
          aria-labelledby={`${uid}-t ${uid}-d`}
          className="mx-auto block h-auto w-full max-w-[34rem]"
        >
          <title id={`${uid}-t`}>{spec.title}</title>
          <desc id={`${uid}-d`}>{spec.desc}</desc>
          <defs>
            <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0L10 5L0 10z" className="fill-muted" />
            </marker>
          </defs>

          {spec.groups?.map((g) => (
            <g key={g.id}>
              <rect x={g.x + 1} y={g.y} width={g.w - 2} height={g.h} rx={16} className="fill-bg stroke-border" strokeWidth={1.5} strokeDasharray="5 5" />
              <text x={g.x + g.w - 16} y={g.y + 20} textAnchor="end" className="fill-accent font-mono" fontSize={11} letterSpacing={0.8} style={{ textTransform: "uppercase" }}>
                {g.label}
              </text>
            </g>
          ))}

          {spec.edges.map((e, i) => {
            const a = boxes.get(e.from);
            const b = boxes.get(e.to);
            if (!a || !b) return null;
            const { d, mx, my } = route(e, a, b);
            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  className="stroke-muted"
                  strokeWidth={1.5}
                  strokeDasharray={e.dashed ? "5 4" : undefined}
                  markerEnd={`url(#${uid}-arrow)`}
                />
                {e.label && (
                  <text
                    x={mx + 8}
                    y={my + 4}
                    className="fill-muted font-sans"
                    fontSize={12.5}
                    stroke="rgb(var(--bg))"
                    strokeWidth={4}
                    paintOrder="stroke"
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {spec.nodes.map((n) => {
            const subs = n.sub === undefined ? [] : Array.isArray(n.sub) ? n.sub : [n.sub];
            const cx = n.x + n.w / 2;
            // vertically centre the text block inside the box
            const block = 16 + subs.length * 16;
            const top = n.y + (n.h - block) / 2;
            return (
              <g key={n.id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={12}
                  className={n.tone === "accent" ? "fill-accent/10 stroke-accent" : "fill-bg stroke-border"}
                  strokeWidth={n.tone === "accent" ? 2 : 1.5}
                />
                <text x={cx} y={top + 13} textAnchor="middle" className="fill-fg font-sans" fontSize={15} fontWeight={600}>
                  {n.title}
                </text>
                {subs.map((s, i) => (
                  <text key={i} x={cx} y={top + 13 + 17 * (i + 1)} textAnchor="middle" className="fill-muted font-sans" fontSize={12.5}>
                    {s}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
