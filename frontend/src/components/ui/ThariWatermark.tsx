import React from 'react';

export type ThariVariant = 'loom-watermark' | 'shuttle-threads' | 'jacquard-harness' | 'craft-seal' | 'corner-motif';
export type ThariPosition = 'top-right' | 'bottom-right' | 'bottom-left' | 'side-panel' | 'background-center' | 'header-right' | 'custom';

interface ThariWatermarkProps {
  variant?: ThariVariant;
  position?: ThariPosition;
  opacity?: number | string; // e.g. 0.04 (4%) - 0.08 (8%) or "opacity-[0.03]"
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const ThariWatermark: React.FC<ThariWatermarkProps> = ({
  variant = 'loom-watermark',
  position = 'top-right',
  opacity = 0.075,
  className = '',
  size = 'md'
}) => {
  const positionClasses: Record<ThariPosition, string> = {
    'top-right': 'absolute top-0 right-0 pointer-events-none select-none z-0 overflow-hidden',
    'bottom-right': 'absolute bottom-0 right-0 pointer-events-none select-none z-0 overflow-hidden',
    'bottom-left': 'absolute bottom-0 left-0 pointer-events-none select-none z-0 overflow-hidden',
    'side-panel': 'absolute inset-y-0 right-0 pointer-events-none select-none z-0 overflow-hidden hidden md:flex items-center justify-center',
    'background-center': 'absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center',
    'header-right': 'absolute top-2 right-4 pointer-events-none select-none z-0 overflow-hidden',
    'custom': 'pointer-events-none select-none z-0'
  };

  const sizeStyles: Record<string, { width: number; height: number; scaleClass: string }> = {
    sm: { width: 140, height: 140, scaleClass: 'w-28 h-28 sm:w-36 sm:h-36' },
    md: { width: 220, height: 220, scaleClass: 'w-44 h-44 sm:w-56 sm:h-56' },
    lg: { width: 340, height: 340, scaleClass: 'w-64 h-64 sm:w-80 sm:h-80' },
    xl: { width: 480, height: 480, scaleClass: 'w-80 h-80 sm:w-[420px] sm:h-[420px]' },
    full: { width: 600, height: 600, scaleClass: 'w-full h-full max-w-[500px]' }
  };

  const { scaleClass } = sizeStyles[size] || sizeStyles.md;

  const numericOpacity = typeof opacity === 'number' ? opacity : undefined;
  const opacityClass = typeof opacity === 'string' ? opacity : '';

  // Render authentic traditional Thari (Loom) vector illustrations
  const renderGraphic = () => {
    const commonSvgProps = {
      fill: 'none',
      stroke: 'currentColor',
      className: `${scaleClass} ${opacityClass} transition-opacity duration-300`,
      style: numericOpacity !== undefined ? { opacity: numericOpacity } : undefined,
      xmlns: 'http://www.w3.org/2000/svg'
    };

    switch (variant) {
      case 'shuttle-threads':
        return (
          <svg viewBox="0 0 200 200" {...commonSvgProps} className={`${commonSvgProps.className} text-stone-800`}>
            {/* Warp vertical threads */}
            {Array.from({ length: 18 }).map((_, i) => (
              <line
                key={i}
                x1={20 + i * 9}
                y1={10}
                x2={20 + i * 9}
                y2={190}
                strokeWidth={i % 3 === 0 ? "1.2" : "0.6"}
                strokeDasharray={i % 2 === 0 ? "none" : "3,2"}
              />
            ))}
            {/* Horizontal Weft Handloom Shuttle */}
            <g transform="translate(15, 85) rotate(-5)">
              {/* Shuttle Body */}
              <path
                d="M 10,15 C 30,5 130,5 160,15 C 170,18 170,22 160,25 C 130,35 30,35 10,25 C 0,22 0,18 10,15 Z"
                strokeWidth="1.6"
                fill="none"
              />
              {/* Bobbin Pirn cavity */}
              <rect x="50" y="12" width="70" height="16" rx="4" strokeWidth="1" />
              {/* Thread pirn spool */}
              <line x1="55" y1="20" x2="115" y2="20" strokeWidth="2.5" />
              {/* Emerging silk thread loop */}
              <path d="M 85,20 Q 95,45 135,55" strokeWidth="1" strokeDasharray="2,2" />
            </g>
            {/* Reed Sley Beat-up */}
            <rect x="15" y="130" width="170" height="12" rx="2" strokeWidth="1.4" />
            {Array.from({ length: 24 }).map((_, i) => (
              <line key={`reed-${i}`} x1={20 + i * 6.8} y1={130} x2={20 + i * 6.8} y2={142} strokeWidth="0.8" />
            ))}
          </svg>
        );

      case 'jacquard-harness':
        return (
          <svg viewBox="0 0 240 240" {...commonSvgProps} className={`${commonSvgProps.className} text-stone-800`}>
            {/* Overhead Jacquard Cylinder & Punched Cards Chain */}
            <rect x="40" y="15" width="160" height="30" rx="3" strokeWidth="1.5" />
            {/* Punched hole matrix on Jacquard cards */}
            {[25, 35, 45, 55, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175, 185].map((cx, i) => (
              <React.Fragment key={i}>
                <circle cx={cx} cy="23" r="1.5" fill="currentColor" />
                <circle cx={cx} cy="33" r="1.5" fill={i % 2 === 0 ? "currentColor" : "none"} strokeWidth="0.8" />
              </React.Fragment>
            ))}
            {/* Hanging Jacquard Harness Cords (Viluthu) */}
            {[50, 65, 80, 95, 110, 120, 130, 145, 160, 175, 190].map((x, i) => (
              <g key={`cord-${i}`}>
                <line x1={x} y1={45} x2={40 + i * 16} y2={130} strokeWidth="0.75" />
                {/* Mail eye (Heddle eyelet) */}
                <circle cx={40 + i * 16} cy={130} r="2" strokeWidth="1" />
                {/* Lingoes (Weights) */}
                <line x1={40 + i * 16} y1={132} x2={40 + i * 16} y2={220} strokeWidth="0.9" />
                <rect x={38.5 + i * 16} y={205} width="3" height="15" rx="1" fill="currentColor" />
              </g>
            ))}
            {/* Comber Board */}
            <rect x="30" y="110" width="180" height="8" rx="1.5" strokeWidth="1.2" />
          </svg>
        );

      case 'craft-seal':
        return (
          <svg viewBox="0 0 160 160" {...commonSvgProps} className={`${commonSvgProps.className} text-amber-900`}>
            {/* Outer Traditional Handloom Roundel */}
            <circle cx="80" cy="80" r="74" strokeWidth="1.5" strokeDasharray="4,3" />
            <circle cx="80" cy="80" r="66" strokeWidth="0.8" />
            {/* Inner Loom Shuttle Icon */}
            <path
              d="M 30,80 C 45,70 115,70 130,80 C 115,90 45,90 30,80 Z"
              strokeWidth="1.4"
              fill="none"
            />
            <rect x="62" y="75" width="36" height="10" rx="3" strokeWidth="1" />
            <line x1="66" y1="80" x2="94" y2="80" strokeWidth="2" />
            {/* Cross Heddles */}
            <line x1="80" y1="25" x2="80" y2="65" strokeWidth="1" />
            <line x1="80" y1="95" x2="80" y2="135" strokeWidth="1" />
            <line x1="45" y1="45" x2="115" y2="115" strokeWidth="0.6" strokeDasharray="3,3" />
            <line x1="115" y1="45" x2="45" y2="115" strokeWidth="0.6" strokeDasharray="3,3" />
          </svg>
        );

      case 'corner-motif':
        return (
          <svg viewBox="0 0 180 180" {...commonSvgProps} className={`${commonSvgProps.className} text-stone-800`}>
            {/* Traditional Tamil Nadu Handloom Corner Border Pattern */}
            <path d="M 180,0 L 180,180 L 0,180" strokeWidth="1.2" />
            <path d="M 165,15 L 165,165 L 15,165" strokeWidth="0.8" strokeDasharray="3,2" />
            {/* Diamond Warp Grid (Mayilkan / Temple Border motif) */}
            <path d="M 165,60 L 120,105 L 165,150" strokeWidth="1" />
            <path d="M 120,15 L 75,60 L 120,105 L 165,60 Z" strokeWidth="0.8" />
            <path d="M 75,60 L 30,105 L 75,150 L 120,105 Z" strokeWidth="0.8" />
            <circle cx="120" cy="60" r="3" fill="currentColor" />
            <circle cx="75" cy="105" r="3" fill="currentColor" />
          </svg>
        );

      case 'loom-watermark':
      default:
        return (
          <svg viewBox="0 0 320 280" {...commonSvgProps} className={`${commonSvgProps.className} text-stone-900`}>
            {/* Traditional Wooden Pit/Frame Handloom Structure (Thari) */}
            {/* 1. Main Upright Wooden Posts (Thari Thoon) */}
            <rect x="25" y="30" width="10" height="230" rx="1.5" strokeWidth="1.5" />
            <rect x="285" y="30" width="10" height="230" rx="1.5" strokeWidth="1.5" />
            {/* Base Sills */}
            <rect x="15" y="250" width="290" height="12" rx="2" strokeWidth="1.6" />
            {/* Top Overhead Cross-Beam */}
            <rect x="15" y="25" width="290" height="14" rx="2" strokeWidth="1.6" />

            {/* 2. Warp Roller Beam (Back / Warp Beam - Pavu Maram) */}
            <circle cx="50" cy="140" r="22" strokeWidth="1.4" />
            <circle cx="50" cy="140" r="14" strokeWidth="0.8" strokeDasharray="3,2" />
            <circle cx="50" cy="140" r="4" fill="currentColor" />

            {/* 3. Cloth Roller Beam (Front / Cloth Beam - Thuni Maram) */}
            <circle cx="270" cy="140" r="22" strokeWidth="1.4" />
            <circle cx="270" cy="140" r="14" strokeWidth="0.8" strokeDasharray="3,2" />
            <circle cx="270" cy="140" r="4" fill="currentColor" />

            {/* 4. Warp Taut Thread Sheet */}
            {Array.from({ length: 14 }).map((_, i) => (
              <line
                key={`warp-${i}`}
                x1="68"
                y1={126 + i * 2.2}
                x2="252"
                y2={126 + i * 2.2}
                strokeWidth={i % 3 === 0 ? "1" : "0.5"}
              />
            ))}

            {/* 5. Overhead Harness Frame & Pulley System (Viluthu & Kambi) */}
            <rect x="130" y="45" width="60" height="8" rx="1" strokeWidth="1.2" />
            <line x1="145" y1="53" x2="145" y2="95" strokeWidth="1" />
            <line x1="175" y1="53" x2="175" y2="95" strokeWidth="1" />

            {/* Heddle Frames (Viluthu Kambigal) */}
            <rect x="135" y="95" width="20" height="85" rx="1" strokeWidth="1.2" />
            <rect x="165" y="90" width="20" height="85" rx="1" strokeWidth="1.2" />
            {/* Heddle Wires & Eyes */}
            {Array.from({ length: 9 }).map((_, i) => (
              <React.Fragment key={`heddle-${i}`}>
                <line x1="145" y1={100 + i * 8} x2="145" y2={106 + i * 8} strokeWidth="0.7" />
                <circle cx="145" cy={137} r="1.5" fill="currentColor" />
                <line x1="175" y1={95 + i * 8} x2="175" y2={101 + i * 8} strokeWidth="0.7" />
                <circle cx="175" cy={133} r="1.5" fill="currentColor" />
              </React.Fragment>
            ))}

            {/* 6. Sley / Reed Beat-Up (Naada / Pattadai) */}
            <g transform="translate(195, 80)">
              {/* Sley Swords */}
              <line x1="10" y1="0" x2="15" y2="120" strokeWidth="2" />
              {/* Reed Cap & Sley Race */}
              <rect x="0" y="35" width="20" height="50" rx="1.5" strokeWidth="1.2" />
              {/* Reed Dents */}
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={`reed-d-${i}`} x1="3" y1={38 + i * 3.8} x2="17" y2={38 + i * 3.8} strokeWidth="0.6" />
              ))}
            </g>

            {/* 7. Foot Treadles / Pedals at bottom (Michu Palagai) */}
            <line x1="140" y1="180" x2="135" y2="245" strokeWidth="1" />
            <line x1="170" y1="175" x2="175" y2="245" strokeWidth="1" />
            <rect x="120" y="240" width="30" height="8" rx="1.5" strokeWidth="1.2" />
            <rect x="160" y="240" width="30" height="8" rx="1.5" strokeWidth="1.2" />

            {/* 8. Handloom Shuttle traversing the shed */}
            <g transform="translate(205, 126)">
              <path
                d="M 0,6 C 6,2 34,2 40,6 C 34,10 6,10 0,6 Z"
                strokeWidth="1.2"
                fill="none"
              />
              <circle cx="20" cy="6" r="1.2" fill="currentColor" />
            </g>
          </svg>
        );
    }
  };

  return (
    <div
      className={`${positionClasses[position]} ${className}`}
      aria-hidden="true"
    >
      {renderGraphic()}
    </div>
  );
};
