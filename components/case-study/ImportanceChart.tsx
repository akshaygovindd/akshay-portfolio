import { wildfireImportance } from "@/config/charts";

const ROW = 30;
const LABEL_W = 148;
const BAR_MAX = 300;
const W = 560;
const TOP = 6;

/**
 * Horizontal bar chart of the tuned Random Forest's top 10 feature importances (values printed in
 * the notebook's saved output). Colours come from the theme CSS variables, so it follows light and
 * dark. The data is also given as a screen-reader list, so the picture is not the only source.
 */
export default function ImportanceChart() {
  const rows = wildfireImportance;
  const max = rows[0].value;
  const h = TOP + rows.length * ROW + 4;
  const desc = rows.map((r) => `${r.label} ${r.value.toFixed(4)}`).join(", ");

  return (
    <figure className="my-8">
      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-5">
        <svg viewBox={`0 0 ${W} ${h}`} role="img" aria-labelledby="fi-t fi-d" className="mx-auto block h-auto w-full max-w-[34rem]">
          <title id="fi-t">Tuned Random Forest feature importance, top 10</title>
          <desc id="fi-d">{`Horizontal bars, largest first: ${desc}.`}</desc>
          {rows.map((r, i) => {
            const y = TOP + i * ROW;
            const w = (r.value / max) * BAR_MAX;
            return (
              <g key={r.label}>
                <text x={LABEL_W - 10} y={y + 18} textAnchor="end" className="fill-muted font-mono" fontSize={12}>
                  {r.label}
                </text>
                <rect x={LABEL_W} y={y + 5} width={w} height={ROW - 12} rx={4} className="fill-accent" />
                <text x={LABEL_W + w + 8} y={y + 18} className="fill-fg font-mono" fontSize={12}>
                  {r.value.toFixed(3)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Random Forest feature importance (tuned model, top 10 of 12 features), from the notebook&apos;s saved output.
      </figcaption>
    </figure>
  );
}
