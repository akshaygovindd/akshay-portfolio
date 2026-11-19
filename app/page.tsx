import Navbar from "@/components/Navbar";
import Companion from "@/components/Companion";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import ScrollEffects from "@/components/ScrollEffects";
import Tools from "@/components/sections/Tools";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Demos from "@/components/sections/Demos";
import Contact from "@/components/sections/Contact";
import PersonJsonLd from "@/components/PersonJsonLd";

export default function Home() {
  return (
    <>
      {/* First focusable element on the page; visible only while focused */}
      <a href="#projects" className="skip-link">
        Skip to projects
      </a>
      <PersonJsonLd />
      <Navbar />
      <Companion />
      <ScrollEffects />
      <main>
        <Hero />
        <Tools />
        <Experience />
        <Projects />
        <Demos />
        <Skills />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
