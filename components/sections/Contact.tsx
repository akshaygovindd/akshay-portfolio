import { Download, Github, Linkedin, Mail } from "lucide-react";
import { site } from "@/config/site";

export default function Contact() {
  const { links, about } = site;
  return (
    <section id="contact" className="section pb-40">
      <h2 className="section-title">Contact</h2>
      <p className="font-display text-4xl uppercase leading-tight sm:text-6xl">
        Let&apos;s turn <span className="text-accent">data</span> into decisions.
      </p>
      <p className="mt-6 max-w-xl text-lg text-muted">
        {about.seeking} If you have an opportunity or just want to talk data, reach out.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {links.email && (
          <a href={`mailto:${links.email}`} className="btn btn-primary">
            <Mail size={16} /> {links.email}
          </a>
        )}
        {links.resume && (
          <a href={links.resume} download className="btn">
            <Download size={16} /> Resume
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
      </div>
    </section>
  );
}
