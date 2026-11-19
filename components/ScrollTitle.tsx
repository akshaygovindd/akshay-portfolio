/**
 * Huge Anton title: drawn as an outline, then filled with solid colour (left to right) as
 * you scroll through it. The fill layer is the real text for assistive tech; the outline
 * layer is decorative. Animation lives in ScrollEffects (looks for [data-title]).
 */
export default function ScrollTitle({ children }: { children: string }) {
  return (
    <h2 data-title className="title-wrap">
      <span aria-hidden="true" className="title-outline">
        {children}
      </span>
      <span className="title-fill">{children}</span>
    </h2>
  );
}
