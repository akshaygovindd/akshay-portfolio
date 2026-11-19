import PipelineDiagram from "@/components/interactive/PipelineDiagram";

export default function Pipeline() {
  return (
    <section id="pipeline" className="section">
      <h2 className="section-title">FoodLens Pipeline</h2>
      <p className="mb-6 max-w-2xl text-muted">
        How data moves through the FoodLens ELT pipeline. Click a stage to see what it does.
      </p>
      <PipelineDiagram />
    </section>
  );
}
