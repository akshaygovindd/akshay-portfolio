import { Download, Github, Linkedin, Mail } from "lucide-react";
import { site } from "@/config/site";
import ScrollTitle from "@/components/ScrollTitle";
import FloatingShapes from "@/components/FloatingShapes";

/**
 * Flat panel (inverse palette) that continues the About panel above it: the two form one
 * light region between the dark Skills section and the dark footer, so Contact gets no
 * curtain of its own. Buttons for anything not set in config are hidden.
 */
export default function Contact() {
  const { links, about } = site;
  return (
    <section id="contact" className="panel panel-flat relative">
      <FloatingShapes
        shapes={[
          { kind: "sphere", className: "right-[8%] top-20 h-28 w-28", speed: -110 },
          { kind: "cube", className: "right-[12%] top-60 h-16 w-16", speed: -60, rotate: -14 },
        ]}
      />
      <div className="section relative z-10 !pt-14 pb-24 sm:!pt-20 sm:pb-32">
        <ScrollTitle>Let&apos;s get in touch</ScrollTitle>
        <p className="max-w-xl text-lg text-muted">
          {about.seeking} If you have an opportunity or just want to talk data, reach out.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {links.email && (
            <a href={`mailto:${links.email}`} className="btn btn-primary">
              <Mail size={16} /> {links.email}
            </a>
          )}
          {links.linkedin && (
            <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="btn">
              <Linkedin size={16} /> LinkedIn
            </a>
          )}
          <a href={links.github} target="_blank" rel="noopener noreferrer" className="btn">
            <Github size={16} /> GitHub
          </a>
          {links.resume && (
            <a href={links.resume} download className="btn">
              <Download size={16} /> Resume
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
