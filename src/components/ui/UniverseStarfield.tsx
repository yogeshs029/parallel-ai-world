import React from 'react';

export const UniverseStarfield: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#f5f5f7]">
      {/* Soft iOS Ambient Light Accents */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0, 122, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%)' }}
      />
      <div
        className="absolute top-[40%] -right-[15%] w-[45vw] h-[45vw] rounded-full blur-[160px] opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(255, 255, 255, 0) 70%)' }}
      />
    </div>
  );
};
