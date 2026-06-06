import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 select-none ${
      scrolled ? 'bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/[0.08] py-4' : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white font-bold text-lg group-hover:scale-105 transition-transform">
            D
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            DeepWork AI
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#demo" className="hover:text-white transition-colors">Product</a>
          <a href="#benefits" className="hover:text-white transition-colors">Benefits</a>
          <a href="#statistics" className="hover:text-white transition-colors">Impact</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            Sign In
          </Link>
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 font-bold text-sm transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95"
          >
            <Brain className="w-4 h-4" />
            <span>Get Started</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
