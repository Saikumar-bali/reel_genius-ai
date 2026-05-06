
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
          <i className="fa-solid fa-bolt-lightning text-white text-xl"></i>
        </div>
        <h1 className="text-xl font-bold tracking-tight">
          Reel<span className="text-pink-500 font-black">Genius</span>
        </h1>
      </div>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <a href="#" className="hover:text-white transition-colors">Templates</a>
        <a href="#" className="hover:text-white transition-colors">Elements</a>
        <a href="#" className="hover:text-white transition-colors">Tutorials</a>
        <div className="h-4 w-[1px] bg-slate-700" />
        <button className="px-4 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-600/30 hover:bg-indigo-600/20 transition-all">
          Pro Plan
        </button>
      </div>
    </header>
  );
};

export default Header;
