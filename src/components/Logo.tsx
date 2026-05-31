import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textPosition?: 'right' | 'bottom';
  className?: string;
  lightText?: boolean;
}

export default function Logo({
  size = 'md',
  showText = true,
  textPosition = 'right',
  className = '',
  lightText = false
}: LogoProps) {
  // Determine dimensions
  const dimensions = {
    sm: { box: 'w-8 h-8', fontTitle: 'text-base', fontSub: 'text-[7px]' },
    md: { box: 'w-10 h-10', fontTitle: 'text-xl', fontSub: 'text-[9px]' },
    lg: { box: 'w-12 h-12', fontTitle: 'text-2xl', fontSub: 'text-[10px]' },
    xl: { box: 'w-16 h-16', fontTitle: 'text-3xl', fontSub: 'text-xs' }
  }[size];

  const svgContent = (
    <svg 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full select-none"
    >
      {/* Left Teal Triangle pointing to the center */}
      <path d="M8 6V34L20 20L8 6Z" fill="#0d9488" />
      {/* Right Orange Triangle pointing to the center */}
      <path d="M32 6V34L20 20L32 6Z" fill="#f97316" />
      {/* Center Dark Circle with white stroke for high-fidelity separation */}
      <circle cx="20" cy="20" r="3.5" fill="#0f172a" stroke="#ffffff" strokeWidth="1.8" />
    </svg>
  );

  if (!showText) {
    return (
      <div className={`${dimensions.box} ${className} shrink-0`}>
        {svgContent}
      </div>
    );
  }

  if (textPosition === 'bottom') {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <div className={`${dimensions.box} shrink-0`}>
          {svgContent}
        </div>
        <div>
          <h2 className={`font-black tracking-tight leading-none ${dimensions.fontTitle} ${lightText ? 'text-white' : 'text-slate-800'}`}>
            PRVASIQ
          </h2>
          <span className={`font-black uppercase tracking-widest block leading-none mt-1.5 ${dimensions.fontSub} ${lightText ? 'text-orange-400' : 'text-orange-600'}`}>
            TRAVEL MARKETPLACE & DISPATCH
          </span>
        </div>
      </div>
    );
  }

  // Default: horizontal alignment
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${dimensions.box} shrink-0`}>
        {svgContent}
      </div>
      <div>
        <h2 className={`font-black tracking-tight leading-none ${dimensions.fontTitle} ${lightText ? 'text-white' : 'text-slate-800'}`}>
          PRVASIQ
        </h2>
        <span className={`font-black uppercase tracking-widest block leading-none mt-1.5 ${dimensions.fontSub} ${lightText ? 'text-orange-300' : 'text-orange-500'}`}>
          TRAVEL MARKETPLACE & DISPATCH
        </span>
      </div>
    </div>
  );
}
