import { useRef, useEffect, useCallback } from 'react';
import { Champion } from '../types/champion';

interface Props {
  champions: Champion[];
  winnerId: string | null;
  spinning: boolean;
  onSpinComplete: () => void;
  size?: number;
}

const COLORS = [
  '#e03030', '#a93226', '#c0392b', '#7b241c', '#ff4757',
  '#cc1111', '#922b21', '#ff6b6b', '#8e0000', '#e84393',
];

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

export default function RouletteWheel({ champions, winnerId, spinning, onSpinComplete, size = 380 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animRef = useRef<number>(0);

  const total = champions.reduce((s, c) => s + c.counter, 0);

  const draw = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas || champions.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;
    const radius = cx - 12;

    ctx.clearRect(0, 0, size, size);

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#2a0a0a';
    ctx.lineWidth = 3;
    ctx.stroke();

    let startAngle = rotation - Math.PI / 2;

    champions.forEach((champ, i) => {
      const sliceAngle = total > 0 ? (champ.counter / total) * 2 * Math.PI : (2 * Math.PI) / champions.length;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#0a0000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      if (sliceAngle > 0.12) {
        const mid = startAngle + sliceAngle / 2;
        const tr = radius * 0.68;
        const tx = cx + Math.cos(mid) * tr;
        const ty = cy + Math.sin(mid) * tr;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(mid + Math.PI / 2);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(9, Math.min(13, sliceAngle * 22))}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = champ.name.length > 9 ? champ.name.slice(0, 8) + '…' : champ.name;
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }

      startAngle = endAngle;
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0000';
    ctx.fill();
    ctx.strokeStyle = '#3a0a0a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [champions, total, size]);

  useEffect(() => {
    draw(rotationRef.current);
  }, [draw]);

  useEffect(() => {
    if (!spinning || !winnerId || champions.length === 0) return;

    // Find winner's mid-angle in wheel space
    let cumAngle = 0;
    let winnerMid = 0;
    for (const champ of champions) {
      const slice = total > 0 ? (champ.counter / total) * 2 * Math.PI : (2 * Math.PI) / champions.length;
      if (champ._id === winnerId) {
        winnerMid = cumAngle + slice / 2;
        break;
      }
      cumAngle += slice;
    }

    // Target: winner mid-angle at top → rotation = -winnerMid
    let target = -winnerMid;
    while (target <= rotationRef.current + 8 * Math.PI) {
      target += 2 * Math.PI;
    }

    const startRot = rotationRef.current;
    const startTime = performance.now();
    const duration = 5500;

    function animate(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      rotationRef.current = startRot + (target - startRot) * easeOut(t);
      draw(rotationRef.current);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        onSpinComplete();
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [spinning, winnerId]);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Arrow pointer */}
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '14px solid transparent',
        borderRight: '14px solid transparent',
        borderTop: '28px solid #e03030',
        filter: 'drop-shadow(0 0 8px rgba(220,30,30,0.9))',
        marginBottom: -4,
        zIndex: 2,
        position: 'relative',
      }} />
      <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />
    </div>
  );
}
