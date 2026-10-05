import React from 'react';

export interface ThariBackgroundProps {
  children?: React.ReactNode;
  src?: string;
  intensity?: 'subtle' | 'default' | 'login' | 'dense';
  className?: string;
}

export const ThariBackground: React.FC<ThariBackgroundProps> = ({
  children,
  src = '/images/thari-background.webp',
  intensity = 'default',
  className = ''
}) => {
  // Intensity presets for different page types (calibrated for 20-30% enhanced visibility while maintaining light/clean aesthetic)
  const opacityConfig = {
    subtle: 'opacity-[0.08] sm:opacity-[0.10] lg:opacity-[0.12]',
    default: 'opacity-[0.10] sm:opacity-[0.12] lg:opacity-[0.15]',
    login: 'opacity-[0.11] sm:opacity-[0.14] lg:opacity-[0.16]',
    dense: 'opacity-[0.07] sm:opacity-[0.09] lg:opacity-[0.11]'
  }[intensity];

  return (
    <div className={`relative min-h-screen w-full bg-[#faf9f6] text-stone-900 ${className}`}>
      {/* Fixed Full-Page Thari Background Visual Layer */}
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        {/* Real High-Resolution Handloom Workshop Image */}
        <img
          src={src}
          alt=""
          loading="eager"
          className={`w-full h-full object-cover object-center ${opacityConfig} transition-opacity duration-700 filter saturate-[0.90] contrast-[1.02]`}
          onError={(e) => {
            // Fallback to direct root path if subpath fails
            const target = e.currentTarget;
            if (target.src !== `${window.location.origin}/thari-background.webp`) {
              target.src = '/thari-background.webp';
            }
          }}
        />

        {/* Soft Warm-White Protective Overlay with balanced translucency */}
        <div className="absolute inset-0 bg-[#faf9f6]/72 backdrop-blur-[0.2px]" />

        {/* Subtle Radial Gradient for Central Content Clarity & Vignette */}
        <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-stone-100/30" />

        {/* Micro Warp-Weft Texture Sheen */}
        <div className="absolute inset-0 bg-loom-pattern opacity-35 mix-blend-multiply" />
      </div>

      {/* Application Content Layer */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
};
