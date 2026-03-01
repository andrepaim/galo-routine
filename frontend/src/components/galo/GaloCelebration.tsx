import React, { useEffect, useState } from 'react';

interface Props {
  taskName: string;
  stars: number;
  onDone: () => void;
}

export function GaloCelebration({ taskName, stars, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300); // wait for fade out
    }, 1500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Floating stars */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute text-2xl animate-bounce pointer-events-none"
          style={{
            left: `${10 + (i * 11) % 80}%`,
            top: `${15 + (i * 17) % 60}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.6 + (i % 3) * 0.2}s`,
            opacity: 0.7,
          }}
        >
          ⭐
        </div>
      ))}

      {/* Center content */}
      <div className="flex flex-col items-center gap-3 animate-fade-in-up">
        <div className="w-24 h-24 rounded-full bg-star-gold/20 border-4 border-star-gold flex items-center justify-center shadow-[0_0_40px_rgba(255,215,0,0.4)]">
          <span className="text-5xl">✅</span>
        </div>
        <p className="text-2xl font-extrabold text-white mt-2">Arrasou!</p>
        <p className="text-base text-gray-300 text-center px-8">{taskName}</p>
        <div className="flex items-center gap-2 bg-star-gold/20 border border-star-gold px-5 py-2 rounded-full mt-1">
          <span className="text-xl">⭐</span>
          <span className="text-xl font-extrabold text-star-gold">+{stars}</span>
        </div>
      </div>
    </div>
  );
}
