type Shape = {
  kind: "sphere" | "ring" | "cube";
  /** CSS size + position, e.g. "right-[8%] top-28 h-28 w-28" */
  className: string;
  /** Parallax travel in px across the section (negative = drifts up). */
  speed: number;
  rotate?: number;
};

/**
 * Decorative CSS shapes standing in for 3D objects (no obj-*.png supplied).
 * Hidden on phones. Parallax is driven by ScrollEffects via [data-parallax].
 */
export default function FloatingShapes({ shapes }: { shapes: Shape[] }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden sm:block"
    >
      {shapes.map((s, i) => (
        <span
          key={i}
          data-parallax
          data-speed={s.speed}
          data-rotate={s.rotate ?? 0}
          className={`shape shape-${s.kind} ${s.className}`}
        />
      ))}
    </div>
  );
}
