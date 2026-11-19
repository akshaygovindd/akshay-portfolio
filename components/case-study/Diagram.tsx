import ArchDiagram from "@/components/case-study/ArchDiagram";
import PipelineDiagram from "@/components/interactive/PipelineDiagram";
import type { diagrams } from "@/config/diagrams";

/**
 * Used inside the MDX case studies as <Diagram id="..." />.
 * FoodLens reuses the interactive pipeline component from the Demos section; the others are SVG.
 */
export default function Diagram({ id, caption }: { id: "pipeline" | keyof typeof diagrams; caption?: string }) {
  if (id === "pipeline") {
    return (
      <figure className="my-8">
        <PipelineDiagram />
        {caption && <figcaption className="mt-3 text-sm text-muted">{caption}</figcaption>}
      </figure>
    );
  }
  return (
    <>
      <ArchDiagram id={id} />
      {caption && <p className="-mt-5 mb-8 text-sm text-muted">{caption}</p>}
    </>
  );
}
