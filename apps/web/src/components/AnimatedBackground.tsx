'use client';

import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Enhanced animated elements: farms, buyers, transport
    interface AnimatedItem {
      x: number;
      y: number;
      type: 'farm' | 'buyer' | 'transport' | 'crop' | 'tree';
      size: number;
      speed: number;
      rotation: number;
      direction: number;
      opacity: number;
    }

    const items: AnimatedItem[] = [];

    // Create diverse farm elements
    for (let i = 0; i < 50; i++) {
      const types: AnimatedItem['type'][] = ['farm', 'buyer', 'transport', 'crop', 'tree'];
      items.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        type: types[Math.floor(Math.random() * types.length)],
        size: 30 + Math.random() * 60,
        speed: 0.2 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2,
        direction: Math.random() * Math.PI * 2,
        opacity: 0.1 + Math.random() * 0.15,
      });
    }

    const drawFarm = (x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Farm house
      ctx.fillStyle = '#9d6a3e';
      ctx.fillRect(-size * 0.3, -size * 0.2, size * 0.6, size * 0.4);
      
      // Roof
      ctx.fillStyle = '#7f5434';
      ctx.beginPath();
      ctx.moveTo(-size * 0.3, -size * 0.2);
      ctx.lineTo(0, -size * 0.4);
      ctx.lineTo(size * 0.3, -size * 0.2);
      ctx.closePath();
      ctx.fill();
      
      // Crops around
      ctx.fillStyle = '#22c55e';
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const cropX = Math.cos(angle) * size * 0.5;
        const cropY = Math.sin(angle) * size * 0.5;
        ctx.beginPath();
        ctx.arc(cropX, cropY, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    };

    const drawBuyer = (x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Person icon
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(0, -size * 0.2, size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      // Body
      ctx.fillRect(-size * 0.1, -size * 0.05, size * 0.2, size * 0.3);
      
      // Shopping bag
      ctx.fillStyle = '#15803d';
      ctx.fillRect(size * 0.15, size * 0.1, size * 0.2, size * 0.25);
      
      ctx.restore();
    };

    const drawTransport = (x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Truck body
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-size * 0.4, -size * 0.15, size * 0.8, size * 0.3);
      
      // Truck cabin
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(-size * 0.4, -size * 0.15, size * 0.3, size * 0.3);
      
      // Wheels
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-size * 0.2, size * 0.15, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.2, size * 0.15, size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawCrop = (x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Crop plant
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.2);
      ctx.lineTo(0, -size * 0.2);
      ctx.stroke();
      
      // Leaves
      ctx.fillStyle = '#22c55e';
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI * 2) / 4;
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(angle) * size * 0.15,
          -size * 0.1 + (i % 2) * size * 0.1,
          size * 0.08,
          size * 0.12,
          angle,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      
      ctx.restore();
    };

    const drawTree = (x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Trunk
      ctx.fillStyle = '#7f5434';
      ctx.fillRect(-size * 0.05, 0, size * 0.1, size * 0.4);
      
      // Leaves
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(0, -size * 0.1, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const animate = () => {
      // Green gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.15)'); // green-500
      gradient.addColorStop(0.5, 'rgba(22, 163, 74, 0.12)'); // green-600
      gradient.addColorStop(1, 'rgba(21, 128, 61, 0.1)'); // green-700
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and animate items
      items.forEach((item) => {
        ctx.globalAlpha = item.opacity;

        switch (item.type) {
          case 'farm':
            drawFarm(item.x, item.y, item.size, item.rotation);
            break;
          case 'buyer':
            drawBuyer(item.x, item.y, item.size, item.rotation);
            break;
          case 'transport':
            drawTransport(item.x, item.y, item.size, item.rotation);
            break;
          case 'crop':
            drawCrop(item.x, item.y, item.size, item.rotation);
            break;
          case 'tree':
            drawTree(item.x, item.y, item.size, item.rotation);
            break;
        }

        // Animate position with direction
        item.x += Math.cos(item.direction) * item.speed;
        item.y += Math.sin(item.direction) * item.speed;
        item.rotation += 0.005;

        // Wrap around edges
        if (item.x > canvas.width + item.size) item.x = -item.size;
        if (item.x < -item.size) item.x = canvas.width + item.size;
        if (item.y > canvas.height + item.size) item.y = -item.size;
        if (item.y < -item.size) item.y = canvas.height + item.size;
      });

      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
