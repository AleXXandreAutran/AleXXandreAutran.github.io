(() => {
    'use strict';

    const canvas = document.getElementById('graph-background');
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;
    const pointer = { x: 0, y: 0, active: false };
    const settings = {
        areaPerPoint: 11500,
        maxPoints: 130,
        connectionDistance: 155,
        pointerRadius: 170,
        displacement: 44,
        speed: 9,
    };
    let width = 0;
    let height = 0;
    let points = [];
    let frame = null;
    let previousTime = 0;
    let lightTheme = root.dataset.theme === 'light';

    function stop() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        previousTime = 0;
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        const count = Math.min(settings.maxPoints,
            Math.max(24, Math.round(width * height / settings.areaPerPoint)));
        points = Array.from({ length: count }, () => {
            const direction = Math.random() * Math.PI * 2;
            const speed = settings.speed * (0.45 + Math.random() * 0.75);
            return {
                x: Math.random() * width,
                y: Math.random() * height,
                vx: Math.cos(direction) * speed,
                vy: Math.sin(direction) * speed,
                offsetX: 0, offsetY: 0,
                radius: 1 + Math.random() * 0.7,
                tone: Math.random() > 0.7 ? '148, 166, 247' : '106, 183, 219',
            };
        });
        draw(0);
    }

    function draw(delta) {
        context.clearRect(0, 0, width, height);
        const ease = delta > 0 ? 1 - Math.exp(-delta * 7) : 1;
        const linkDistance = width < 700 ? 120 : settings.connectionDistance;
        const linkDistanceSquared = linkDistance * linkDistance;
        const interaction = pointer.active && !reducedMotion.matches;

        for (const point of points) {
            point.x += point.vx * delta;
            point.y += point.vy * delta;
            if (point.x < 0) { point.x = 0; point.vx = Math.abs(point.vx); }
            if (point.x > width) { point.x = width; point.vx = -Math.abs(point.vx); }
            if (point.y < 0) { point.y = 0; point.vy = Math.abs(point.vy); }
            if (point.y > height) { point.y = height; point.vy = -Math.abs(point.vy); }

            const dx = point.x - pointer.x;
            const dy = point.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            const influence = interaction
                ? Math.max(0, 1 - distance / settings.pointerRadius) : 0;
            const force = settings.displacement * influence * influence;
            const divisor = distance || 1;
            point.offsetX += (dx / divisor * force - point.offsetX) * ease;
            point.offsetY += (dy / divisor * force - point.offsetY) * ease;
            point.drawX = point.x + point.offsetX;
            point.drawY = point.y + point.offsetY;
            point.influence = influence;
        }

        context.lineWidth = 0.65;
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            for (let j = i + 1; j < points.length; j++) {
                const b = points[j];
                const dx = a.drawX - b.drawX;
                const dy = a.drawY - b.drawY;
                const squaredDistance = dx * dx + dy * dy;
                if (squaredDistance >= linkDistanceSquared) continue;
                const proximity = 1 - Math.sqrt(squaredDistance) / linkDistance;
                const influence = Math.max(a.influence, b.influence);
                const opacity = proximity * (0.34 + influence * 0.32);
                context.strokeStyle = lightTheme
                    ? `rgba(50, 100, 132, ${opacity * 0.65})`
                    : `rgba(105, 165, 208, ${opacity})`;
                context.beginPath();
                context.moveTo(a.drawX, a.drawY);
                context.lineTo(b.drawX, b.drawY);
                context.stroke();
            }
        }

        for (const point of points) {
            const opacity = lightTheme ? 0.3 : 0.6 + point.influence * 0.35;
            const tone = lightTheme ? '48, 102, 139' : point.tone;
            context.beginPath();
            context.arc(point.drawX, point.drawY, point.radius, 0, Math.PI * 2);
            context.fillStyle = `rgba(${tone}, ${opacity})`;
            context.fill();
        }
    }

    function tick(time) {
        frame = null;
        const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
        previousTime = time;
        draw(delta);
        frame = requestAnimationFrame(tick);
    }

    function syncAnimation() {
        stop();
        pointer.active = false;
        if (document.hidden) return;
        draw(0);
        if (!reducedMotion.matches) frame = requestAnimationFrame(tick);
    }

    window.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch' || reducedMotion.matches) return;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = true;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer.active = false; });
    window.addEventListener('blur', () => { pointer.active = false; });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', syncAnimation);
    reducedMotion.addEventListener('change', syncAnimation);
    new MutationObserver(() => {
        lightTheme = root.dataset.theme === 'light';
        if (reducedMotion.matches && !document.hidden) draw(0);
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    resize();
    syncAnimation();
})();
