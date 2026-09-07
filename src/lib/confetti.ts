export function triggerConfetti() {
  if (typeof window === 'undefined') return;

  const count = 70;
  const defaults = {
    origin: { y: 0.7 }
  };

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles: {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    vx: number;
    vy: number;
    alpha: number;
    rotation: number;
    rotSpeed: number;
  }[] = [];

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.6 + (Math.random() - 0.5) * 80,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: -(Math.random() * 14 + 10),
      alpha: 1,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
    });
  }

  let animationFrameId: number;
  const gravity = 0.45;
  const drag = 0.98;

  function update() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeCount = 0;
    for (const p of particles) {
      p.vx *= drag;
      p.vy = p.vy * drag + gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.009;

      if (p.alpha > 0 && p.y < canvas.height + 50) {
        activeCount++;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }

  update();
}
