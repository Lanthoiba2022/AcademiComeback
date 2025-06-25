"use client";
import React from "react";
import { SparklesCore } from "./sparkles";
import { Trophy, Star, Award, Zap } from "lucide-react";

// Reusable BrandTitle component for AcademiComeback with sparkles and underline
export const BrandTitle = ({ size, noGlow }: { size?: 'sm' | 'xs' | 'xxs', noGlow?: boolean }) => {
  let fontSize = 'text-4xl md:text-6xl';
  let height = 'h-16';
  let underlineTop = 'top-[2.8rem] md:top-[3.7rem]';
  let underlineHeight = 'h-[6px] md:h-[8px]';
  let underlineLine = 'h-[2px]';
  let particleDensity = 600;
  let minSize = 0.4;
  let maxSize = 1;
  if (size === 'sm') {
    fontSize = 'text-xl md:text-2xl';
    height = 'h-8';
    underlineTop = 'top-[1.5rem] md:top-[1.7rem]';
    underlineHeight = 'h-[3px] md:h-[4px]';
    underlineLine = 'h-[1px]';
    particleDensity = 200;
    minSize = 0.2;
    maxSize = 0.5;
  } else if (size === 'xs') {
    fontSize = 'text-base md:text-lg';
    height = 'h-6';
    underlineTop = 'top-[1.1rem] md:top-[1.2rem]';
    underlineHeight = 'h-[2px]';
    underlineLine = 'h-[1px]';
    particleDensity = 80;
    minSize = 0.1;
    maxSize = 0.3;
  } else if (size === 'xxs') {
    fontSize = 'text-xs md:text-sm';
    height = 'h-5';
    underlineTop = 'top-[0.9rem] md:top-[1.1rem]';
    underlineHeight = 'h-[1px]';
    underlineLine = 'h-[0.5px]';
    particleDensity = 30;
    minSize = 0.05;
    maxSize = 0.15;
  }
  return (
    <div className={`relative flex flex-col items-center justify-center w-fit ${height}`}>
      <span
        className={`relative z-20 block ${fontSize} font-extrabold text-center font-sans text-white tracking-tight`}
        style={{
          letterSpacing: '0.01em',
          ...(noGlow ? {} : { textShadow: '0 0 16px #3b82f6, 0 0 2px #fff' })
        }}
      >
        AcademiComeback
      </span>
      <div className={`absolute left-0 right-0 ${underlineTop} ${underlineHeight} flex items-center justify-center pointer-events-none`}>
        <div className="w-full h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-sm opacity-80" />
        <div className={`w-full ${underlineLine} bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-90 absolute top-1/2`} />
      </div>
      <SparklesCore
        background="transparent"
        minSize={minSize}
        maxSize={maxSize}
        particleDensity={particleDensity}
        className="w-full h-full absolute inset-0 z-10 pointer-events-none"
        particleColor="#FFFFFF"
      />
    </div>
  );
};

export const Footer = () => {
  return (
    <footer className="w-full bg-dark-900 border-t border-dark-800 px-2 md:px-8 py-4 md:py-3 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 text-dark-200 md:pl-28">
      {/* Left: (empty or can add something else later) */}
      <div className="flex flex-row items-center gap-2 md:gap-3 min-w-0" />
      {/* Center: Brand, Built with Bolt, and Icons */}
      <div className="flex flex-col md:flex-row items-center justify-center flex-1 min-w-0 w-full md:w-auto gap-2 md:gap-2">
        <img
          src="/11.png"
          alt="AcademiComeback Logo"
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg object-contain shadow-md"
        />
        <BrandTitle size="sm" />
        <span className="text-xs md:text-sm text-dark-400 font-medium mx-0 md:mx-8">Built with</span>
        <a href="https://bolt.new/" target="_blank" rel="noopener noreferrer" className="block">
          <img
            src="/bolt_powered.png"
            alt="Powered by Bolt"
            className="w-16 sm:w-20 md:w-28 h-auto mx-auto opacity-90 hover:opacity-100 transition-opacity"
            style={{ maxWidth: '120px' }}
          />
        </a>
        <div className="flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 ml-0 md:ml-8">
          <a href="https://www.netlify.com/" target="_blank" rel="noopener noreferrer">
            <img src="/Netlify_Logo_1.png" alt="Netlify" className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain rounded hover:scale-110 transition-transform" />
          </a>
          <a href="https://www.revenuecat.com/" target="_blank" rel="noopener noreferrer">
            <img src="/RevenueCat.png" alt="RevenueCat" className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain rounded hover:scale-110 transition-transform" />
          </a>
          <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer">
            <img src="/supabase-dark.png" alt="Supabase" className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain rounded hover:scale-110 transition-transform" />
          </a>
          <a href="https://21st.dev/" target="_blank" rel="noopener noreferrer">
            <img src="/21st.png" alt="21st" className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain rounded hover:scale-110 transition-transform" />
          </a>
          <a href="https://www.entri.com/" target="_blank" rel="noopener noreferrer">
            <img src="/entri.jpg" alt="21st" className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain rounded hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>
      {/* Right: Copyright, vertically centered */}
      <div className="flex items-center h-full mt-2 md:mt-0">
        <span className="text-xs text-dark-500 opacity-80 select-none whitespace-nowrap">© {new Date().getFullYear()} AcademiComeback</span>
      </div>
    </footer>
  );
};

export default Footer; 