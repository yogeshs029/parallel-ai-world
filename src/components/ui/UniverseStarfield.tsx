import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  twinkleDir: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  active: boolean;
}

const STAR_COLORS = ['#ffffff', '#e0e7ff', '#c7d2fe', '#ddd6fe', '#bae6fd'];

export const UniverseStarfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Generate peaceful stars
    const starCount = Math.min(Math.floor((width * height) / 8000), 160);
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.008 + 0.002,
        twinkleDir: Math.random() > 0.5 ? 1 : -1,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }

    // Occasional subtle shooting stars
    const shootingStars: ShootingStar[] = [];
    let nextShootingStarTime = Date.now() + Math.random() * 6000 + 4000;

    const createShootingStar = () => {
      shootingStars.push({
        x: Math.random() * width * 0.8,
        y: Math.random() * (height * 0.4),
        length: Math.random() * 80 + 50,
        speed: Math.random() * 6 + 5,
        angle: (Math.PI / 4) + (Math.random() * 0.2 - 0.1),
        opacity: 0.8,
        active: true,
      });
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Twinkling Stars
      for (const star of stars) {
        star.alpha += star.speed * star.twinkleDir;
        if (star.alpha > 0.85) {
          star.alpha = 0.85;
          star.twinkleDir = -1;
        } else if (star.alpha < 0.15) {
          star.alpha = 0.15;
          star.twinkleDir = 1;
        }

        ctx.save();
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra soft glow on brightest stars
        if (star.size > 1.2 && star.alpha > 0.5) {
          ctx.globalAlpha = star.alpha * 0.3;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Check shooting star spawn
      const now = Date.now();
      if (now > nextShootingStarTime) {
        createShootingStar();
        nextShootingStarTime = now + Math.random() * 12000 + 8000;
      }

      // Draw Shooting Stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        if (!s.active) continue;

        ctx.save();
        ctx.strokeStyle = `rgba(224, 231, 255, ${s.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(
          s.x - Math.cos(s.angle) * s.length,
          s.y - Math.sin(s.angle) * s.length,
        );
        ctx.stroke();
        ctx.restore();

        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.015;

        if (s.opacity <= 0 || s.x > width || s.y > height) {
          shootingStars.splice(i, 1);
        }
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Deep Cosmos Radial Glows */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060913] via-[#090e1e] to-[#060812]" />
      
      {/* Calm Nebula Auroras */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] opacity-70 animate-pulse [animation-duration:12s]" />
      <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[130px] opacity-60 animate-pulse [animation-duration:16s]" />
      <div className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] bg-cyan-600/08 rounded-full blur-[150px] opacity-50 animate-pulse [animation-duration:20s]" />

      {/* Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
export default UniverseStarfield;
