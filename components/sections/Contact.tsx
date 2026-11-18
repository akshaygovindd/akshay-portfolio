import { Github, Linkedin, Mail } from "lucide-react";
import { site } from "@/config/site";

export default function Contact() {
  const { links, about } = site;
  return (
    <section id="contact" className="section">
      <h2 className="section-title">contact</h2>
      <p className="max-w-xl text-muted">
        {about.seeking} If you have an opportunity or just want to talk data, reach out.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={`mailto:${links.email}`} className="btn btn-primary">
          <Mail size={16} /> {links.email}
        </a>
        <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="btn">
          <Linkedin size={16} /> LinkedIn
        </a>
        <a href={links.github} target="_blank" rel="noopener noreferrer" className="btn">
          <Github size={16} /> GitHub
        </a>
      </div>
    </section>
  );
}
