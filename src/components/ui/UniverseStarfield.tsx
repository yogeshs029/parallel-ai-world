import React, { useEffect, useRef } from 'react';

export const UniverseStarfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const stars: { x: number; y: number; radius: number; alpha: number; speed: number; pulse: number }[] = [];
    const numStars = Math.floor((width * height) / 12000);

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.02 + 0.005,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.pulse += star.speed;
        const currentAlpha = star.alpha + Math.sin(star.pulse) * 0.25;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 132, 252, ${Math.max(0.1, Math.min(1, currentAlpha))})`;
        ctx.shadowBlur = star.radius > 1 ? 6 : 0;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#0B0C14]">
      {/* 🌌 Animated Canvas Stars */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

      {/* Radiant Deep Cosmic Glowing Nebulae */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[150px] opacity-40 pointer-events-none animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(11, 12, 20, 0) 70%)' }}
      />
      <div
        className="absolute top-[35%] -right-[15%] w-[55vw] h-[55vw] rounded-full blur-[160px] opacity-30 pointer-events-none animate-glow-pulse"
        style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(11, 12, 20, 0) 70%)', animationDelay: '2s' }}
      />
      <div
        className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, rgba(11, 12, 20, 0) 70%)' }}
      />
    </div>
  );
};
