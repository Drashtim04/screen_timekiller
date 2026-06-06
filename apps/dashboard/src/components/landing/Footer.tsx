import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="py-12 border-t border-white/[0.08] bg-[#0A0A0B] text-slate-500 text-xs select-none">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            D
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-300">
            DeepWork AI
          </span>
        </div>

        <div className="flex items-center gap-6 font-medium">
          <a href="#demo" className="hover:text-slate-300 transition-colors">Product</a>
          <a href="#benefits" className="hover:text-slate-300 transition-colors">Benefits</a>
          <a href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</a>
          <Link to="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
        </div>

        <div>
          <span>© {new Date().getFullYear()} DeepWork AI Inc. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
