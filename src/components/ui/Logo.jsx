import React from 'react';

export default function Logo({ size = 'default', showText = true }) {
  const dimensions = {
    small: { width: 32, height: 32, textClass: 'text-lg', gap: 'gap-1' },
    default: { width: 40, height: 40, textClass: 'text-2xl', gap: 'gap-2' },
    large: { width: 56, height: 56, textClass: 'text-4xl', gap: 'gap-3' },
  };

  const { width, height, textClass, gap } = dimensions[size] || dimensions.default;

  return (
    <div className={`flex items-center ${gap}`}>
      {/* Stylized cattle head SVG */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Horns */}
        <path
          d="M8 18C4 10 2 6 6 4C10 2 14 8 16 14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-500"
        />
        <path
          d="M40 18C44 10 46 6 42 4C38 2 34 8 32 14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-500"
        />
        {/* Face */}
        <ellipse cx="24" cy="28" rx="14" ry="13" className="text-amber-600" fill="currentColor" />
        {/* Muzzle */}
        <ellipse cx="24" cy="35" rx="7" ry="5" className="text-amber-500" fill="currentColor" />
        {/* Nostrils */}
        <ellipse cx="21" cy="35.5" rx="1.2" ry="0.8" className="text-amber-800" fill="currentColor" />
        <ellipse cx="27" cy="35.5" rx="1.2" ry="0.8" className="text-amber-800" fill="currentColor" />
        {/* Eyes */}
        <circle cx="18" cy="26" r="1.8" className="text-white" fill="currentColor" />
        <circle cx="30" cy="26" r="1.8" className="text-white" fill="currentColor" />
        <circle cx="18" cy="26" r="0.9" className="text-amber-900" fill="currentColor" />
        <circle cx="30" cy="26" r="0.9" className="text-amber-900" fill="currentColor" />
        {/* Ear hints */}
        <ellipse cx="12" cy="22" rx="4" ry="2.5" className="text-amber-600" fill="currentColor" transform="rotate(-30 12 22)" />
        <ellipse cx="36" cy="22" rx="4" ry="2.5" className="text-amber-600" fill="currentColor" transform="rotate(30 36 22)" />
      </svg>

      {showText && (
        <span className={`font-bold ${textClass} text-foreground tracking-tight`}>
          iBreedr
        </span>
      )}
    </div>
  );
}