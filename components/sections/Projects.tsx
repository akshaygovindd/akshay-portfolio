import { site } from "@/config/site";
import ProjectCard from "@/components/ProjectCard";
import ScrollTitle from "@/components/ScrollTitle";
import FloatingShapes from "@/components/FloatingShapes";

export default function Projects() {
  return (
    <section id="projects" className="relative">
      <FloatingShapes
        shapes={[
          { kind: "cube", className: "right-[10%] top-20 h-28 w-28", speed: -120, rotate: 18 },
          { kind: "sphere", className: "right-[27%] top-56 h-16 w-16", speed: -60 },
        ]}
      />
      <div className="section relative z-10">
        <ScrollTitle>Projects</ScrollTitle>
        <div>
          {site.projects.map((p, i) => (
            <ProjectCard key={p.title} project={p} index={i} last={i === site.projects.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
