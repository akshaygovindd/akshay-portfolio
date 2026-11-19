/**
 * Huge Anton title: drawn as an outline, then filled with solid colour (left to right) as
 * you scroll through it. The fill layer is the real text for assistive tech; the outline
 * layer is decorative. Animation lives in ScrollEffects (looks for [data-title]).
 */
export default function ScrollTitle({
  children,
  tight = false,
}: {
  children: string;
  /** Smaller gap under the title (used where the content below is short). */
  tight?: boolean;
}) {
  return (
    <h2 data-title className={tight ? "title-wrap title-wrap--tight" : "title-wrap"}>
      <span aria-hidden="true" className="title-outline">
        {children}
      </span>
      <span className="title-fill">{children}</span>
    </h2>
  );
}
