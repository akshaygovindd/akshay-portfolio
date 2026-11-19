import Navbar from "@/components/Navbar";
import Companion from "@/components/Companion";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import Experience from "@/components/sections/Experience";
import Projects from "@/components/sections/Projects";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Demos from "@/components/sections/Demos";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <Companion />
      <main>
        <Hero />
        <Experience />
        <Projects />
        <About />
        <Skills />
        <Demos />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
