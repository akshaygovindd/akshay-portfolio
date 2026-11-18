import { Download, Github, Linkedin, Mail } from "lucide-react";
import { site } from "@/config/site";

export default function Hero() {
  const { links } = site;
  return (
    <section id="top" className="section pt-24 sm:pt-32">
      <p className="mb-4 font-mono text-sm text-accent">$ whoami</p>
      <h1 className="font-mono text-4xl font-bold tracking-tight sm:text-6xl">{site.name}</h1>
      <h2 className="mt-3 font-mono text-lg text-muted sm:text-2xl">
        {site.title}
        <span className="ml-1 inline-block h-[1em] w-2 translate-y-0.5 animate-pulse bg-accent align-middle" />
      </h2>
      <p className="mt-6 max-w-2xl text-base text-muted sm:text-lg">{site.pitch}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <a href={links.resume} download className="btn btn-primary">
          <Download size={16} /> Resume
        </a>
        <a href={links.github} target="_blank" rel="noopener noreferrer" className="btn">
          <Github size={16} /> GitHub
        </a>
        <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="btn">
          <Linkedin size={16} /> LinkedIn
        </a>
        <a href={`mailto:${links.email}`} className="btn">
          <Mail size={16} /> Email
        </a>
      </div>
    </section>
  );
}
