import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import DemoSection from '../components/landing/DemoSection';
import Benefits from '../components/landing/Benefits';
import Statistics from '../components/landing/Statistics';
import Testimonials from '../components/landing/Testimonials';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-white/20 overflow-x-hidden">
      <Navbar />
      <Hero />
      <DemoSection />
      <Benefits />
      <Statistics />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
