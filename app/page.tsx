import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Projects from "@/components/sections/Projects";
import Pipeline from "@/components/sections/Pipeline";
import Playground from "@/components/sections/Playground";
import Skills from "@/components/sections/Skills";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Projects />
        <Pipeline />
        <Playground />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
