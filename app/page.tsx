import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CreativeOS from "@/components/CreativeOS";
import Products from "@/components/Products";
import Projects from "@/components/Projects";
import Process from "@/components/Process";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ServiceProvider from "@/components/ServiceProvider";
import Reveal from "@/components/Reveal";

export default function Home() {
  return <ServiceProvider><a className="skip-link" href="#main">Перейти к содержимому</a><Header />
    <main id="main"><Hero /><CreativeOS /><Products /><Projects /><Process /><About /><Contact /></main>
    <Footer /><Reveal />
  </ServiceProvider>;
}
