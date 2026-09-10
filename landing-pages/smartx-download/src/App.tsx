import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { DownloadSection } from './components/sections/DownloadSection';
import { Features } from './components/sections/Features';
import { Manuals } from './components/sections/Manuals';
import { Showcase } from './components/sections/Showcase';
import { TechStackStrip } from './components/sections/TechStackStrip';
import { Requirements } from './components/sections/Requirements';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <DownloadSection />
        <Features />
        <Manuals />
        <Showcase />
        <TechStackStrip />
        <Requirements />
      </main>
      <Footer />
    </>
  );
}
