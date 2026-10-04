{\rtf1\ansi\ansicpg1252\cocoartf2907
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 (() => \{\
  const canvas = document.getElementById("networkBackground");\
  if (!canvas) return;\
\
  const ctx = canvas.getContext("2d");\
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");\
\
  let width = 0;\
  let height = 0;\
  let dpr = 1;\
  let particles = [];\
  let animationFrame = null;\
\
  const mouse = \{\
    x: -1000,\
    y: -1000,\
    vx: 0,\
    vy: 0,\
    active: false\
  \};\
\
  const CONNECTION_DISTANCE = 135;\
  const MOUSE_RADIUS = 190;\
\
  const COLORS = \{\
    dark: \{\
      particle: [145, 181, 255],\
      line: [47, 184, 208],\
      mouse: [193, 169, 255]\
    \},\
    light: \{\
      particle: [65, 100, 135],\
      line: [47, 130, 160],\
      mouse: [110, 90, 170]\
    \}\
  \};\
\
  function getColors() \{\
    return document.documentElement.getAttribute("data-theme") === "light"\
      ? COLORS.light\
      : COLORS.dark;\
  \}\
\
  function rgba(color, alpha) \{\
    return `rgba($\{color[0]\}, $\{color[1]\}, $\{color[2]\}, $\{alpha\})`;\
  \}\
\
  function createParticle() \{\
    return \{\
      x: Math.random() * width,\
      y: Math.random() * height,\
      vx: (Math.random() - 0.5) * 0.32,\
      vy: (Math.random() - 0.5) * 0.32,\
      radius: 0.8 + Math.random() * 1.15\
    \};\
  \}\
\
  function createParticles() \{\
    const area = width * height;\
\
    const count =\
      width < 700\
        ? Math.max(18, Math.min(35, Math.round(area / 15000)))\
        : Math.max(35, Math.min(90, Math.round(area / 18000)));\
\
    particles = Array.from(\{ length: count \}, createParticle);\
  \}\
\
  function resize() \{\
    width = window.innerWidth;\
    height = window.innerHeight;\
\
    dpr = Math.min(window.devicePixelRatio || 1, 2);\
\
    canvas.width = Math.round(width * dpr);\
    canvas.height = Math.round(height * dpr);\
\
    canvas.style.width = `$\{width\}px`;\
    canvas.style.height = `$\{height\}px`;\
\
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\
\
    createParticles();\
\
    if (reducedMotion.matches) \{\
      draw();\
    \}\
  \}\
\
  function update() \{\
    mouse.vx *= 0.88;\
    mouse.vy *= 0.88;\
\
    for (const p of particles) \{\
      if (mouse.active) \{\
        const dx = p.x - mouse.x;\
        const dy = p.y - mouse.y;\
        const distance = Math.hypot(dx, dy);\
\
        if (distance > 0 && distance < MOUSE_RADIUS) \{\
          const influence = 1 - distance / MOUSE_RADIUS;\
          const force = influence * 0.013;\
\
          p.vx += (dx / distance) * force;\
          p.vy += (dy / distance) * force;\
\
          p.vx += mouse.vx * influence * 0.00045;\
          p.vy += mouse.vy * influence * 0.00045;\
        \}\
      \}\
\
      const speed = Math.hypot(p.vx, p.vy);\
      const maxSpeed = 0.65;\
\
      if (speed > maxSpeed) \{\
        p.vx = (p.vx / speed) * maxSpeed;\
        p.vy = (p.vy / speed) * maxSpeed;\
      \}\
\
      p.vx *= 0.998;\
      p.vy *= 0.998;\
\
      p.x += p.vx;\
      p.y += p.vy;\
\
      if (p.x < -10) \{\
        p.x = width + 10;\
      \}\
\
      if (p.x > width + 10) \{\
        p.x = -10;\
      \}\
\
      if (p.y < -10) \{\
        p.y = height + 10;\
      \}\
\
      if (p.y > height + 10) \{\
        p.y = -10;\
      \}\
    \}\
  \}\
\
  function draw() \{\
    ctx.clearRect(0, 0, width, height);\
\
    const colors = getColors();\
\
    const light =\
      document.documentElement.getAttribute("data-theme") === "light";\
\
    for (let i = 0; i < particles.length; i++) \{\
      const a = particles[i];\
\
      for (let j = i + 1; j < particles.length; j++) \{\
        const b = particles[j];\
\
        const dx = a.x - b.x;\
        const dy = a.y - b.y;\
\
        const distance = Math.hypot(dx, dy);\
\
        if (distance < CONNECTION_DISTANCE) \{\
          const strength = 1 - distance / CONNECTION_DISTANCE;\
          const alpha = strength * (light ? 0.11 : 0.18);\
\
          ctx.beginPath();\
          ctx.moveTo(a.x, a.y);\
          ctx.lineTo(b.x, b.y);\
\
          ctx.strokeStyle = rgba(colors.line, alpha);\
          ctx.lineWidth = 0.7;\
\
          ctx.stroke();\
        \}\
      \}\
    \}\
\
    if (mouse.active) \{\
      for (const p of particles) \{\
        const dx = p.x - mouse.x;\
        const dy = p.y - mouse.y;\
\
        const distance = Math.hypot(dx, dy);\
\
        if (distance < MOUSE_RADIUS) \{\
          const strength = 1 - distance / MOUSE_RADIUS;\
\
          ctx.beginPath();\
\
          ctx.moveTo(mouse.x, mouse.y);\
          ctx.lineTo(p.x, p.y);\
\
          ctx.strokeStyle = rgba(\
            colors.mouse,\
            strength * (light ? 0.08 : 0.16)\
          );\
\
          ctx.lineWidth = 0.65;\
\
          ctx.stroke();\
        \}\
      \}\
    \}\
\
    for (const p of particles) \{\
      ctx.beginPath();\
\
      ctx.arc(\
        p.x,\
        p.y,\
        p.radius,\
        0,\
        Math.PI * 2\
      );\
\
      ctx.fillStyle = rgba(\
        colors.particle,\
        light ? 0.38 : 0.65\
      );\
\
      ctx.fill();\
    \}\
  \}\
\
  function animate() \{\
    update();\
    draw();\
\
    animationFrame = requestAnimationFrame(animate);\
  \}\
\
  function startAnimation() \{\
    if (animationFrame !== null) \{\
      cancelAnimationFrame(animationFrame);\
      animationFrame = null;\
    \}\
\
    if (reducedMotion.matches) \{\
      draw();\
    \} else \{\
      animate();\
    \}\
  \}\
\
  window.addEventListener(\
    "pointermove",\
    event => \{\
      if (mouse.active) \{\
        mouse.vx = event.clientX - mouse.x;\
        mouse.vy = event.clientY - mouse.y;\
      \}\
\
      mouse.x = event.clientX;\
      mouse.y = event.clientY;\
\
      mouse.active = true;\
    \},\
    \{ passive: true \}\
  );\
\
  document.addEventListener("pointerleave", () => \{\
    mouse.active = false;\
  \});\
\
  window.addEventListener("blur", () => \{\
    mouse.active = false;\
  \});\
\
  window.addEventListener(\
    "resize",\
    resize,\
    \{ passive: true \}\
  );\
\
  const themeObserver = new MutationObserver(() => \{\
    if (reducedMotion.matches) \{\
      draw();\
    \}\
  \});\
\
  themeObserver.observe(\
    document.documentElement,\
    \{\
      attributes: true,\
      attributeFilter: ["data-theme"]\
    \}\
  );\
\
  if (typeof reducedMotion.addEventListener === "function") \{\
    reducedMotion.addEventListener(\
      "change",\
      startAnimation\
    );\
  \} else if (typeof reducedMotion.addListener === "function") \{\
    reducedMotion.addListener(startAnimation);\
  \}\
\
  resize();\
  startAnimation();\
\})();}