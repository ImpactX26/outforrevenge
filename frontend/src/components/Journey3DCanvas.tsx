import React, { useEffect, useRef, useState } from 'react';

interface AgentNode {
  name: string;
  role: string;
  progress: number; // 0 to 1 along flight path
  color: string;
  icon: string;
}

export const Journey3DCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const agentNodes: AgentNode[] = [
    { name: 'Profile Agent', role: 'Credential Dossier', progress: 0.15, color: '#60a5fa', icon: '👤' },
    { name: 'Document Agent', role: 'OCR & Provenance', progress: 0.42, color: '#34d399', icon: '📄' },
    { name: 'Qualification Engine', role: 'Deterministic Rules', progress: 0.68, color: '#fbbf24', icon: '⚖️' },
    { name: 'Educaro Routing', role: 'Pathway Optimization', progress: 0.90, color: '#a78bfa', icon: '🚀' },
  ];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = Math.min(Math.max(width * 0.52, 340), 460));

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / width - 0.5) * 40;
      targetMouseY = ((e.clientY - rect.top) / height - 0.5) * 30;
    };

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || 800;
      height = canvas.height = Math.min(Math.max(width * 0.52, 340), 460);
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Particle pool along the flight path
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      progress: (i / particleCount),
      speed: 0.002 + Math.random() * 0.0015,
      size: 1.5 + Math.random() * 2,
      brightness: 0.4 + Math.random() * 0.6,
    }));

    // Background stars
    const starCount = 45;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: Math.random() * 1.4,
      alpha: 0.2 + Math.random() * 0.6,
    }));

    let t = 0;

    const getPathPoint = (progress: number, offsetX = 0, offsetY = 0) => {
      // 3D Arched Trajectory: India (South-East / Bottom Right) -> Germany (North-West / Top Left)
      const p1 = { x: width * 0.85 + offsetX * 0.5, y: height * 0.80 + offsetY * 0.5 }; // India
      const p2 = { x: width * 0.50 + offsetX * 1.2, y: height * 0.15 + offsetY * 1.2 }; // Apex
      const p3 = { x: width * 0.15 + offsetX * 0.5, y: height * 0.35 + offsetY * 0.5 }; // Germany

      // Quadratic Bezier interpolation
      const inv = 1 - progress;
      const x = inv * inv * p1.x + 2 * inv * progress * p2.x + progress * progress * p3.x;
      const y = inv * inv * p1.y + 2 * inv * progress * p2.y + progress * progress * p3.y;
      return { x, y };
    };

    const render = () => {
      t += 0.02;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Render background subtle cosmic stars
      stars.forEach((s) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * (0.6 + 0.4 * Math.sin(t + s.x * 10))})`;
        ctx.beginPath();
        ctx.arc(s.x * width + mouseX * 0.1, s.y * height + mouseY * 0.1, s.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground shadow / grid curve
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.08)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      for (let prog = 0; prog <= 1; prog += 0.02) {
        const pt = getPathPoint(prog, mouseX, mouseY);
        const shadowY = pt.y + 35;
        if (prog === 0) ctx.moveTo(pt.x, shadowY);
        else ctx.lineTo(pt.x, shadowY);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Flight Arch Glow
      ctx.beginPath();
      const gradient = ctx.createLinearGradient(width * 0.85, height * 0.8, width * 0.15, height * 0.35);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.6)'); // Warm India Saffron glow
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.9)'); // Nexora Blue apex
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)'); // German Opportunity Green

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 12;

      for (let prog = 0; prog <= 1; prog += 0.01) {
        const pt = getPathPoint(prog, mouseX, mouseY);
        if (prog === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Origin Point: India (Mumbai / Delhi)
      const india = getPathPoint(0, mouseX, mouseY);
      ctx.beginPath();
      ctx.fillStyle = '#f59e0b';
      ctx.arc(india.x, india.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.arc(india.x, india.y, 10 + 4 * Math.sin(t * 2), 0, Math.PI * 2);
      ctx.stroke();

      // Destination Point: Germany (Frankfurt / Berlin)
      const germany = getPathPoint(1, mouseX, mouseY);
      ctx.beginPath();
      ctx.fillStyle = '#10b981';
      ctx.arc(germany.x, germany.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.arc(germany.x, germany.y, 12 + 5 * Math.sin(t * 2 + 1), 0, Math.PI * 2);
      ctx.stroke();

      // Traveling stream particles
      if (!reducedMotion) {
        particles.forEach((p) => {
          p.progress = (p.progress + p.speed) % 1;
          const pos = getPathPoint(p.progress, mouseX, mouseY);
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${p.brightness})`;
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 8;
          ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Draw Floating Agent Nodes
      agentNodes.forEach((node) => {
        const pt = getPathPoint(node.progress, mouseX, mouseY);
        // Vertical gentle floating bob
        const floatY = reducedMotion ? 0 : Math.sin(t * 1.5 + node.progress * 8) * 6;
        const currentY = pt.y + floatY;

        // Node Glow Ring
        ctx.beginPath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10;
        ctx.arc(pt.x, currentY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Small pulse ring
        ctx.beginPath();
        ctx.strokeStyle = `${node.color}55`;
        ctx.lineWidth = 1;
        ctx.arc(pt.x, currentY, 18 + 3 * Math.sin(t * 2 + node.progress * 4), 0, Math.PI * 2);
        ctx.stroke();

        // Node Label Box
        const isHovered = activeNode === node.name;
        ctx.fillStyle = isHovered ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;

        const boxWidth = 110;
        const boxHeight = 32;
        const boxX = pt.x - boxWidth / 2;
        const boxY = currentY - 44;

        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = '600 10.5px Inter, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, pt.x, boxY + 14);

        ctx.font = '500 8.5px Inter, sans-serif';
        ctx.fillStyle = node.color;
        ctx.fillText(node.role, pt.x, boxY + 26);
      });

      // Pin Labels: India & Germany
      ctx.font = '700 11px Inter, sans-serif';
      ctx.textAlign = 'center';

      // India Label
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('🇮🇳 India', india.x, india.y + 24);
      ctx.font = '500 9px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Origin Dossier', india.x, india.y + 36);

      // Germany Label
      ctx.font = '700 11px Inter, sans-serif';
      ctx.fillStyle = '#34d399';
      ctx.fillText('🇩🇪 Germany', germany.x, germany.y - 24);
      ctx.font = '500 9px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Study • Ausbildung • Work', germany.x, germany.y - 12);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [reducedMotion, activeNode]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '980px',
        margin: '0 auto',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(30, 41, 59, 0.7) 0%, rgba(11, 17, 32, 0.95) 80%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          cursor: 'crosshair',
        }}
      />

      {/* Floating Interactive Sub-legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '0.4rem 0.9rem',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
          fontSize: '0.74rem',
        }}
      >
        {agentNodes.map((node) => (
          <button
            key={node.name}
            onMouseEnter={() => setActiveNode(node.name)}
            onMouseLeave={() => setActiveNode(null)}
            style={{
              background: 'none',
              border: 'none',
              color: node.color,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: node.color }} />
            <span>{node.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Journey3DCanvas;
