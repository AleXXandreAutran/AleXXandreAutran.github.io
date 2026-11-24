
(() => {
    const emailLink = document.getElementById('emailContactLink');
    const emailPanel = document.getElementById('emailContactPanel');
    const emailAddress = document.getElementById('emailContactAddress');
    const copyButton = document.getElementById('emailCopyButton');
    const copyStatus = document.getElementById('emailCopyStatus');
    if (!emailLink || !emailPanel || !emailAddress || !copyButton || !copyStatus) return;

    emailLink.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        emailPanel.hidden = !emailPanel.hidden;
        emailLink.setAttribute('aria-expanded', String(!emailPanel.hidden));
        copyStatus.textContent = '';
    });

    function closeWithEscape(event) {
        if (event.key !== 'Escape' || emailPanel.hidden) return;
        event.preventDefault();
        emailPanel.hidden = true;
        emailLink.setAttribute('aria-expanded', 'false');
        emailLink.focus();
    }

    emailLink.addEventListener('keydown', closeWithEscape);
    emailPanel.addEventListener('keydown', closeWithEscape);

    copyButton.addEventListener('click', async () => {
        copyButton.disabled = true;
        copyStatus.textContent = '';
        try {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(emailAddress.textContent.trim());
            copyStatus.textContent = 'Address copied.';
        } catch {
            const selection = window.getSelection();
            if (selection) {
                const range = document.createRange();
                range.selectNodeContents(emailAddress);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            copyStatus.textContent = 'Select and copy the address above.';
        } finally {
            copyButton.disabled = false;
        }
    });
})();



(() => {
    const root = document.documentElement;
    const progressBar = document.querySelector('.reading-progress');

    if (progressBar) {
        let progressFrame = 0;
        const updateProgress = () => {
            progressFrame = 0;
            const scrollableHeight = root.scrollHeight - root.clientHeight;
            const progress = scrollableHeight > 0
                ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
                : 0;
            progressBar.style.setProperty('--reading-progress', String(progress));
        };
        const scheduleProgress = () => {
            if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
        };

        window.addEventListener('scroll', scheduleProgress, { passive: true });
        window.addEventListener('resize', scheduleProgress);
        window.addEventListener('pageshow', scheduleProgress);
        window.addEventListener('load', scheduleProgress);
        if ('ResizeObserver' in window) {
            new ResizeObserver(scheduleProgress).observe(document.body);
        }
        if (document.fonts) document.fonts.ready.then(scheduleProgress);
        updateProgress();
    }

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

    function followSystemTheme() {
        root.setAttribute('data-theme', systemTheme.matches ? 'dark' : 'light');
        root.dataset.themeSource = 'system';
    }

    if (systemTheme.addEventListener) {
        systemTheme.addEventListener('change', followSystemTheme);
    } else {
        systemTheme.addListener(followSystemTheme);
    }
    window.addEventListener('pageshow', followSystemTheme);
    window.addEventListener('focus', followSystemTheme);
    followSystemTheme();

    const siteHeader = document.getElementById('siteHeader');
    if (siteHeader) {
        const updateHeaderHeight = () => {
            root.style.setProperty('--site-header-height', `${siteHeader.offsetHeight}px`);
        };
        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);
        if ('ResizeObserver' in window) new ResizeObserver(updateHeaderHeight).observe(siteHeader);
    }

})();



(() => {
  const research = document.getElementById('research');
  if (!research) return;

  async function typesetSummary(panel) {
    const math = window.MathJax;
    if (panel.hidden || panel.dataset.mathState || !math?.startup?.promise) return;

    panel.dataset.mathState = 'pending';
    try {
      await math.startup.promise;
      if (panel.hidden) {
        delete panel.dataset.mathState;
        return;
      }
      await math.typesetPromise([panel]);
      panel.dataset.mathState = 'ready';
    } catch (error) {
      delete panel.dataset.mathState;
      console.warn('The summary is available, but its formulas could not be typeset.', error);
    }
  }

  research.querySelectorAll('.research-summary-toggle').forEach((button) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;

    const title = button.closest('.research-item').querySelector('h3').textContent.trim();
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(expanded));
      button.setAttribute('aria-label', `${expanded ? 'Hide' : 'Show'} summary: ${title}`);
      panel.hidden = !expanded;
      if (expanded) typesetSummary(panel);
    });
  });
  document.getElementById('publications-mathjax')?.addEventListener('load', () => {
    research.querySelectorAll('.research-summary-panel:not([hidden])').forEach(typesetSummary);
  });
})();



(() => {
  'use strict';

  const canvas = document.getElementById('graph-preview');
  const context = canvas?.getContext('2d');
  const section = document.getElementById('about');
  if (!context || !section) return;
  const publications = document.getElementById('research');
  const firstPublicationTitle = publications?.querySelector('.research-item h3');
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const movingPointsInput = document.getElementById('movingPointsRange');
  const movingPointsPercentage = document.getElementById('movingPointsPercentage');
  const movingPointsSlider = movingPointsInput?.closest('.network-slider');
  let movingPointsPercentageTimer = 0;
  const defaultMovingPointCount = 25;
  const movingPointSpeedScale = 0.9;
  const sparkPalettes = {
    dark: [
      { color: '#f2b26e', rgb: '242, 178, 110', outline: 'rgba(176, 97, 26, 0.45)' },
      { color: '#c4a5f0', rgb: '196, 165, 240', outline: 'rgba(123, 79, 174, 0.45)' },
      { color: '#6fd1c8', rgb: '111, 209, 200', outline: 'rgba(23, 128, 122, 0.45)' },
      { color: '#92b4ff', rgb: '146, 180, 255', outline: 'rgba(47, 95, 179, 0.45)' }
    ],
    light: [
      { color: '#b0611a', rgb: '176, 97, 26', outline: 'rgba(176, 97, 26, 0.45)' },
      { color: '#7b4fae', rgb: '123, 79, 174', outline: 'rgba(123, 79, 174, 0.45)' },
      { color: '#17807a', rgb: '23, 128, 122', outline: 'rgba(23, 128, 122, 0.45)' },
      { color: '#2f5fb3', rgb: '47, 95, 179', outline: 'rgba(47, 95, 179, 0.45)' }
    ]
  };
  Object.values(sparkPalettes).forEach(palette => {
    palette.forEach(color => { color.halo = createSparkHalo(color.rgb); });
  });
  let sparkPalette = sparkPalettes.dark;
  const sparkDuration = 0.9;
  const edgeVisibilityScale = 1.05;
  const vertexPointSizeScale = 0.95;
  const graphExtentScale = 1.35;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let ink = '31, 79, 163';
  let dark = false;
  let nodes = [];
  let edges = [];
  let neighbors = [];
  let packets = [];
  let movingPointCount = defaultMovingPointCount;
  let maxMovingPoints = 0;
  let elapsed = 0;
  let frame = 0;
  let visible = true;
  let previousTime = 0;
  let sampleStart = 0;
  let sampleFrames = 0;
  let boundsFrame = 0;
  let sparkEvents = 0;
  const sparkColorCounts = sparkPalette.map(() => 0);
  let activeSparkCount = -1;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function random(seed) {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function rgba(alpha, colorIndex = null) {
    const color = colorIndex === null ? ink : sparkPalette[colorIndex].rgb;
    return `rgba(${color}, ${Math.round(clamp(alpha, 0, 1) * 1000) / 1000})`;
  }

  function synchronizePalette() {
    const hex = getComputedStyle(root).getPropertyValue('--link').trim().replace('#', '');
    if (/^[a-f\d]{6}$/i.test(hex)) {
      ink = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).join(', ');
    }
    dark = root.dataset.theme === 'dark';
    sparkPalette = dark ? sparkPalettes.dark : sparkPalettes.light;
    canvas.dataset.sparkPalette = sparkPalette.map(color => color.color).join(',');
    canvas.dataset.paletteMode = dark ? 'dark' : 'light';
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  function updateMovingPointsControl() {
    canvas.dataset.packets = String(movingPointCount);
    canvas.dataset.maxPackets = String(maxMovingPoints);
    canvas.dataset.initialPlacement = 'uniform-distinct-edges';
    canvas.dataset.edgeProbability = String(edges.length ? movingPointCount / edges.length : 0);
    canvas.dataset.launchSignature = packets.slice(0, Math.min(movingPointCount, 12)).map(packet => packet.launchKey).join('|');
    const progress = maxMovingPoints ? movingPointCount / maxMovingPoints : 0;
    const percentage = Math.round(progress * 100);
    canvas.dataset.signalPercentage = String(percentage);
    movingPointsSlider?.style.setProperty('--signal-position', `calc(6px + (100% - 12px) * ${progress})`);
    if (movingPointsPercentage) movingPointsPercentage.textContent = `${percentage}%`;
    if (movingPointsInput) {
      movingPointsInput.max = String(maxMovingPoints);
      movingPointsInput.value = String(movingPointCount);
      movingPointsInput.removeAttribute('title');
      movingPointsInput.setAttribute('aria-valuetext', `${percentage}%`);
    }
  }

  function hideMovingPointsPercentage() {
    window.clearTimeout(movingPointsPercentageTimer);
    movingPointsSlider?.classList.remove('is-adjusting');
  }

  function showMovingPointsPercentage() {
    window.clearTimeout(movingPointsPercentageTimer);
    movingPointsSlider?.classList.add('is-adjusting');
    movingPointsPercentageTimer = window.setTimeout(hideMovingPointsPercentage, 800);
  }

  function setMovingPointCount(value) {
    const previousCount = movingPointCount;
    const requested = Number(value);
    movingPointCount = clamp(Number.isFinite(requested) ? Math.round(requested) : 0, 0, maxMovingPoints);
    packets.forEach(packet => {
      if (packet.id >= movingPointCount || packet.id >= previousCount) packet.trail.length = 0;
    });
    if (movingPointCount === 0) nodes.forEach(node => { node.sparkAt = -Infinity; node.pulse = 0; });
    updateMovingPointsControl();
    paint();
  }

  function chooseNext(from, previous, packet) {
    const current = nodes[from];
    if (current.x < -0.65) packet.direction = 1;
    if (current.x > 0.65) packet.direction = -1;
    let options = neighbors[from].filter(index => index !== previous);
    if (!options.length) options = neighbors[from];
    const weights = options.map(index => 1 + Math.max(0, (nodes[index].x - current.x) * packet.direction) * 5);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let choice = random(packet.hops * 71 + packet.id * 137 + 43) * total;
    for (let index = 0; index < options.length; index++) {
      choice -= weights[index];
      if (choice <= 0) return options[index];
    }
    return options[options.length - 1];
  }

  function buildGraph() {
    const previousProgress = maxMovingPoints ? movingPointCount / maxMovingPoints : null;
    const mobile = root.clientWidth <= 700;
    const count = mobile ? 160 : width < 650 ? 112 : 156;
    nodes = [];
    edges = [];
    neighbors = [];
    for (let attempt = 0; nodes.length < count && attempt < 12000; attempt++) {
      const angle = random(attempt * 3 + 211) * Math.PI * 2;
      const vertical = random(attempt * 3 + 317) * 2 - 1;
      const radialSeed = random(attempt * 3 + 419);
      const variation = 1 + Math.sin(angle * 3 + vertical * 2.4) * 0.12 + Math.cos(angle * 5 - vertical * 3.1) * 0.10;
      const radial = (0.12 + Math.pow(radialSeed, 0.62) * 1.1) * variation;
      const horizontal = Math.sqrt(1 - vertical * vertical);
      const opacity = Math.max(0.03, Math.pow(1 - clamp((radial - 0.6) / 0.95, 0, 1), 1.25));
      const point = { x: Math.cos(angle) * horizontal * radial, y: vertical * radial, z: Math.sin(angle) * horizontal * radial, pulse: 0, opacity, sparkAt: -Infinity, sparkColorIndex: 0 };
      if (nodes.some(node => distance(node, point) < 0.19)) continue;
      nodes.push(point);
    }
    nodes.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
    neighbors = nodes.map(() => []);
    const connectedEdges = new Set();
    function connect(a, b) {
      const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
      if (connectedEdges.has(key)) return;
      connectedEdges.add(key);
      edges.push({ a, b, opacity: Math.sqrt(nodes[a].opacity * nodes[b].opacity) });
      neighbors[a].push(b);
      neighbors[b].push(a);
    }

    const included = new Set([0]);
    const shortest = nodes.map(() => Infinity);
    const parents = nodes.map(() => -1);
    let current = 0;
    while (included.size < nodes.length) {
      for (let index = 0; index < nodes.length; index++) {
        if (included.has(index)) continue;
        const separation = distance(nodes[current], nodes[index]);
        if (separation < shortest[index]) {
          shortest[index] = separation;
          parents[index] = current;
        }
      }
      let next = -1;
      for (let index = 0; index < nodes.length; index++) {
        if (!included.has(index) && (next === -1 || shortest[index] < shortest[next])) next = index;
      }
      connect(parents[next], next);
      included.add(next);
      current = next;
    }
    nodes.forEach((node, index) => {
      const nearest = nodes.map((other, candidate) => ({ candidate, distance: distance(node, other) }))
        .filter(other => other.candidate !== index)
        .sort((a, b) => a.distance - b.distance);
      for (const other of nearest.slice(0, 7)) {
        if (neighbors[index].length >= 5) break;
        if (neighbors[other.candidate].length < 7) connect(index, other.candidate);
      }
    });
    maxMovingPoints = edges.length;
    movingPointCount = previousProgress === null
      ? Math.min(defaultMovingPointCount, maxMovingPoints)
      : Math.round(maxMovingPoints * previousProgress);
    const launchEdges = edges.slice();
    for (let index = launchEdges.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [launchEdges[index], launchEdges[other]] = [launchEdges[other], launchEdges[index]];
    }
    packets = launchEdges.map((edge, id) => {
      const reversed = Math.random() < 0.5;
      return { id, from: reversed ? edge.b : edge.a, previous: -1, to: reversed ? edge.a : edge.b, hops: id + 1, direction: id % 2 ? -1 : 1, progress: Math.random(), speed: (0.17 + random(id + 617) * 0.035) * movingPointSpeedScale, colorIndex: null, trail: [], launchKey: `${Math.min(edge.a, edge.b)}:${Math.max(edge.a, edge.b)}` };
    });
    canvas.dataset.style = 'rotating-3d-network';
    canvas.dataset.vertices = String(nodes.length);
    canvas.dataset.edges = String(edges.length);
    canvas.dataset.launchSlots = String(new Set(packets.map(packet => packet.launchKey)).size);
    sparkEvents = 0;
    activeSparkCount = -1;
    sparkColorCounts.fill(0);
    canvas.dataset.colors = String(sparkPalette.length + 1);
    canvas.dataset.sparkPalette = sparkPalette.map(color => color.color).join(',');
    canvas.dataset.sparkDistribution = 'uniform';
    canvas.dataset.sparkColorCounts = sparkColorCounts.join(',');
    canvas.dataset.sparkDuration = String(sparkDuration);
    canvas.dataset.sparkEvents = '0';
    canvas.dataset.trailColorMode = 'whole-path';
    canvas.dataset.movingPoints = 'hidden';
    canvas.dataset.edgeVisibilityScale = String(edgeVisibilityScale);
    canvas.dataset.dimensions = '3';
    canvas.dataset.scope = 'home';
    canvas.dataset.distribution = 'irregular-diffuse-volume';
    canvas.dataset.horizontalFocus = 'center';
    canvas.dataset.framing = mobile ? 'wide-mobile' : 'diffuse-network';
    canvas.dataset.frameRate = 'auto';
    delete canvas.dataset.frameSample;
    updateMovingPointsControl();
  }

  function synchronizeBounds() {
    boundsFrame = 0;
    const aboutBounds = section.getBoundingClientRect();
    const boundary = firstPublicationTitle || publications?.querySelector('.section-title');
    const top = root.clientWidth <= 700 ? -48 : -72;
    const homeBottom = section.closest('main')?.getBoundingClientRect().bottom ?? aboutBounds.bottom;
    const bottom = boundary ? boundary.getBoundingClientRect().top - aboutBounds.top + 120 : Math.max(aboutBounds.height, homeBottom - aboutBounds.top);
    const baseHeight = Math.max(320, bottom - top);
    const scaledHeight = baseHeight * graphExtentScale;
    const scaledTop = top - (scaledHeight - baseHeight) / 2;
    const nextHeight = `${Math.round(scaledHeight * 100) / 100}px`;
    section.style.setProperty('--graph-top', `${scaledTop}px`);
    if (section.style.getPropertyValue('--graph-height') !== nextHeight) {
      section.style.setProperty('--graph-height', nextHeight);
    }
    canvas.dataset.boundary = 'home-soft';
  }

  function scheduleBounds() {
    if (!boundsFrame) boundsFrame = requestAnimationFrame(synchronizeBounds);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const nextRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    if (Math.abs(width - bounds.width) < 0.5 && Math.abs(height - bounds.height) < 0.5 && ratio === nextRatio) return;
    width = bounds.width;
    height = bounds.height;
    ratio = nextRatio;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const expectedNodeCount = root.clientWidth <= 700 ? 160 : width < 650 ? 112 : 156;
    if (nodes.length !== expectedNodeCount) buildGraph();
    paint();
  }

  function projection() {
    const yaw = 0.62 + elapsed * 0.09;
    const pitch = -0.25 + Math.sin(elapsed * 0.045) * 0.11;
    const roll = Math.sin(elapsed * 0.028) * 0.05;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cx = Math.cos(pitch), sx = Math.sin(pitch);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const cameraDistance = 3.8;
    const perspectiveScale = Math.sqrt(1 - 1 / (cameraDistance * cameraDistance));
    const verticalRadius = Math.max(10, height / 2 - 14);
    const viewportRadius = Math.max(10, width / 2 - 14) * graphExtentScale;
    const horizontalRadius = root.clientWidth <= 700
      ? Math.max(viewportRadius, verticalRadius * 1.12)
      : viewportRadius;
    const radiusX = horizontalRadius * perspectiveScale;
    const radiusY = verticalRadius * perspectiveScale;
    return point => {
      const y1 = point.y * cx - point.z * sx;
      const z1 = point.y * sx + point.z * cx;
      const x2 = point.x * cy + z1 * sy;
      const z2 = -point.x * sy + z1 * cy;
      const x3 = x2 * cr - y1 * sr;
      const y3 = x2 * sr + y1 * cr;
      const perspective = cameraDistance / (cameraDistance - z2);
      return { x: width / 2 + x3 * radiusX * perspective, y: height / 2 + y3 * radiusY * perspective, depth: clamp((z2 + 1) / 2, 0, 1), z: z2, opacity: point.opacity };
    };
  }

  function packetPoint(packet) {
    const a = nodes[packet.from], b = nodes[packet.to];
    return { x: a.x + (b.x - a.x) * packet.progress, y: a.y + (b.y - a.y) * packet.progress, z: a.z + (b.z - a.z) * packet.progress, opacity: a.opacity + (b.opacity - a.opacity) * packet.progress };
  }

  function advance(delta) {
    nodes.forEach(node => { node.pulse *= Math.exp(-delta * 2.6); });
    for (const packet of packets) {
      if (packet.id >= movingPointCount) continue;
      let travel = delta * packet.speed;
      while (travel > 0) {
        const length = Math.max(0.001, distance(nodes[packet.from], nodes[packet.to]));
        const remaining = (1 - packet.progress) * length;
        if (travel < remaining) {
          packet.progress += travel / length;
          travel = 0;
        } else {
          travel -= remaining;
          const previous = packet.from;
          packet.from = packet.to;
          packet.previous = previous;
          nodes[packet.from].pulse = 1;
          const vertex = nodes[packet.from];
          const arrivalTime = elapsed - travel / packet.speed;
          vertex.sparkAt = arrivalTime;
          vertex.sparkColorIndex = Math.floor(Math.random() * sparkPalette.length);
          sparkColorCounts[vertex.sparkColorIndex]++;
          canvas.dataset.sparkColorCounts = sparkColorCounts.join(',');
          canvas.dataset.sparkEvents = String(++sparkEvents);
          packet.trail.push({ x: vertex.x, y: vertex.y, z: vertex.z, opacity: vertex.opacity, time: arrivalTime });
          packet.colorIndex = vertex.sparkColorIndex;
          packet.hops++;
          packet.to = chooseNext(packet.from, previous, packet);
          packet.progress = 0;
        }
      }
    }
  }

  function circle(x, y, radius, alpha, colorIndex = null) {
    if (alpha < 0.002 || x + radius < 0 || x - radius > width || y + radius < 0 || y - radius > height) return;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = rgba(alpha, colorIndex);
    context.fill();
  }

  function createSparkHalo(rgb) {
    const sprite = document.createElement('canvas');
    sprite.width = 64;
    sprite.height = 64;
    const spriteContext = sprite.getContext('2d');
    if (!spriteContext) return null;
    const gradient = spriteContext.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, `rgba(${rgb}, 0.42)`);
    gradient.addColorStop(0.25, `rgba(${rgb}, 0.22)`);
    gradient.addColorStop(0.6, `rgba(${rgb}, 0.05)`);
    gradient.addColorStop(1, `rgba(${rgb}, 0)`);
    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, 64, 64);
    return sprite;
  }

  function drawSparks(projected) {
    let count = 0;
    for (const point of projected) {
      const node = nodes[point.index];
      const age = elapsed - node.sparkAt;
      if (age < 0 || age >= sparkDuration) continue;
      const life = age / sparkDuration;
      const attack = Math.min(1, age / 0.025);
      const fade = age <= 0.1 ? 1 : Math.pow((sparkDuration - age) / (sparkDuration - 0.1), 1.05);
      const energy = attack * fade * (0.85 + point.depth * 0.15) * (0.5 + Math.sqrt(point.opacity) * 0.5);
      const diameter = 14 + life * 9;
      if (energy < 0.01 || point.x + diameter < 0 || point.x - diameter > width || point.y + diameter < 0 || point.y - diameter > height) continue;
      count++;
      const color = sparkPalette[node.sparkColorIndex];
      context.globalAlpha = energy;
      if (color.halo) context.drawImage(color.halo, point.x - diameter / 2, point.y - diameter / 2, diameter, diameter);
      context.globalAlpha = Math.min(1, energy * 0.85);
      context.beginPath();
      context.arc(point.x, point.y, 1.1 + (1 - life) * 1.0 + point.depth * 0.2, 0, Math.PI * 2);
      context.fillStyle = color.color;
      context.fill();
      if (!dark) {
        context.lineWidth = 0.45;
        context.strokeStyle = color.outline;
        context.stroke();
      }
    }
    context.globalAlpha = 1;
    if (count !== activeSparkCount) {
      activeSparkCount = count;
      canvas.dataset.activeSparks = String(count);
    }
  }

  function paint() {
    if (!width || !height) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.lineCap = 'round';
    const project = projection();
    const projected = nodes.map((node, index) => {
      const point = project(node);
      point.index = index;
      return point;
    });
    for (const edge of edges) edge.depth = (projected[edge.a].depth + projected[edge.b].depth) / 2;
    edges.sort((a, b) => a.depth - b.depth);
    for (const edge of edges) {
      const a = projected[edge.a], b = projected[edge.b];
      const pulse = Math.max(nodes[edge.a].pulse, nodes[edge.b].pulse);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.lineWidth = 0.45 + edge.depth * 0.35;
      context.strokeStyle = rgba(edgeVisibilityScale * edge.opacity * ((dark ? 0.04 : 0.025) + edge.depth * (dark ? 0.125 : 0.10) + pulse * 0.025));
      context.stroke();
    }
    for (const packet of packets) {
      if (packet.id >= movingPointCount || packet.colorIndex === null) continue;
      const a = projected[packet.from], b = projected[packet.to];
      const depth = (a.depth + b.depth) / 2;
      const opacity = Math.sqrt(nodes[packet.from].opacity * nodes[packet.to].opacity);
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.lineWidth = 0.75 + depth * 0.5;
      context.strokeStyle = rgba(edgeVisibilityScale * opacity * (0.16 + depth * (dark ? 0.32 : 0.24)), packet.colorIndex);
      context.stroke();
    }
    projected.slice().sort((a, b) => a.depth - b.depth).forEach(point => {
      const pulse = nodes[point.index].pulse;
      circle(point.x, point.y, (0.8 + point.depth * 1.05 + pulse * 0.5) * vertexPointSizeScale, point.opacity * ((dark ? 0.12 : 0.085) + point.depth * (dark ? 0.40 : 0.34) + pulse * 0.15));
    });
    const trailDuration = movingPointCount > 64 ? 0.7 : 1.35;
    const trailSampleLimit = Math.max(3, Math.min(40, Math.floor(1600 / Math.max(1, movingPointCount))));
    const trailSampleInterval = Math.max(0.045, trailDuration / trailSampleLimit);
    for (const packet of packets) {
      if (packet.id >= movingPointCount) continue;
      const point = packetPoint(packet);
      const last = packet.trail[packet.trail.length - 1];
      const sampleDistance = movingPointCount > 64 ? packet.speed * trailSampleInterval : 0.009;
      if (!last || distance(last, point) > sampleDistance || elapsed - last.time >= trailSampleInterval) packet.trail.push({ ...point, time: elapsed });
      while (packet.trail.length && (elapsed - packet.trail[0].time > trailDuration || packet.trail.length > trailSampleLimit)) packet.trail.shift();
      let previousTrail = packet.trail.length ? project(packet.trail[0]) : project(point);
      for (let index = 1; index < packet.trail.length; index++) {
        const a = previousTrail, b = project(packet.trail[index]);
        const life = clamp(1 - (elapsed - packet.trail[index].time) / trailDuration, 0, 1);
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.lineWidth = 0.5 + b.depth * 0.65;
        context.strokeStyle = rgba(edgeVisibilityScale * life * life * b.opacity * (0.15 + b.depth * (dark ? 0.52 : 0.40)), packet.colorIndex);
        context.stroke();
        previousTrail = b;
      }
      const projectedPoint = project(point);
      context.beginPath();
      context.moveTo(previousTrail.x, previousTrail.y);
      context.lineTo(projectedPoint.x, projectedPoint.y);
      context.lineWidth = 0.5 + projectedPoint.depth * 0.65;
      context.strokeStyle = rgba(edgeVisibilityScale * projectedPoint.opacity * (0.15 + projectedPoint.depth * (dark ? 0.52 : 0.40)), packet.colorIndex);
      context.stroke();
    }
    drawSparks(projected);
  }

  function tick(time) {
    frame = 0;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.08) : 0;
    previousTime = time;
    elapsed += delta;
    advance(delta);
    paint();
    if (!sampleStart) sampleStart = time;
    sampleFrames++;
    if (time - sampleStart >= 1000) {
      canvas.dataset.frameRate = String(Math.round(sampleFrames * 1000 / (time - sampleStart)));
      canvas.dataset.frameSample = String(Math.round(time));
      sampleStart = time;
      sampleFrames = 0;
    }
    frame = requestAnimationFrame(tick);
  }

  function synchronizeMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    sampleStart = 0;
    sampleFrames = 0;
    const moving = visible && !document.hidden && !reducedMotion.matches;
    canvas.dataset.motion = moving ? 'running' : 'paused';
    paint();
    if (moving) frame = requestAnimationFrame(tick);
  }

  new ResizeObserver(resize).observe(canvas);
  const boundsObserver = new ResizeObserver(scheduleBounds);
  boundsObserver.observe(section);
  if (publications) boundsObserver.observe(publications);
  window.addEventListener('resize', scheduleBounds);
  window.addEventListener('pageshow', scheduleBounds);
  window.addEventListener('pageshow', () => {
    hideMovingPointsPercentage();
    setMovingPointCount(defaultMovingPointCount);
  });
  if (document.fonts) document.fonts.ready.then(scheduleBounds);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    synchronizeMotion();
  }).observe(canvas);
  new MutationObserver(() => {
    synchronizePalette();
    paint();
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', synchronizeMotion);
  reducedMotion.addEventListener('change', synchronizeMotion);
  movingPointsInput?.addEventListener('input', () => {
    setMovingPointCount(movingPointsInput.value);
    showMovingPointsPercentage();
  });
  movingPointsInput?.addEventListener('blur', hideMovingPointsPercentage);
  synchronizePalette();
  synchronizeBounds();
  resize();
  synchronizeMotion();
})();



(() => {
  const welcome = document.querySelector('.welcome-typewriter');
  if (!welcome) return;
  const text = welcome.querySelector('.welcome-animated');
  const phrases = ['Hello there!', 'Welcome to my page!'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let phraseIndex = 0, position = 0, stage = 'typing';
  let visible = false, started = false, timer = null;

  function paint() {
    text.textContent = phrases[phraseIndex].slice(0, position);
    welcome.dataset.stage = stage;
  }

  function tick() {
    timer = null;
    if (!visible || document.hidden || reducedMotion.matches) return;
    let delay;
    if (stage === 'typing') {
      position++;
      if (position >= phrases[phraseIndex].length) {
        position = phrases[phraseIndex].length;
        if (phraseIndex === phrases.length - 1) {
          stage = 'done';
          paint();
          return;
        }
        stage = 'hold';
        delay = 1450;
      } else delay = 110;
    } else if (stage === 'hold') {
      stage = 'deleting';
      delay = 38;
    } else if (stage === 'deleting') {
      position--;
      if (position <= 0) {
        position = 0;
        stage = 'between';
        delay = 160;
      } else delay = 38;
    } else {
      phraseIndex++;
      position = 0;
      stage = 'typing';
      delay = 110;
    }
    paint();
    timer = window.setTimeout(tick, delay);
  }

  function synchronize() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    if (stage === 'done') return;
    if (reducedMotion.matches) {
      started = true;
      phraseIndex = phrases.length - 1;
      position = phrases[phraseIndex].length;
      stage = 'done';
      paint();
      delete welcome.dataset.typing;
      return;
    }
    if (!visible || document.hidden) return;
    welcome.dataset.typing = 'true';
    if (!started) {
      started = true;
      paint();
    }
    timer = window.setTimeout(tick, stage === 'hold' ? 1450 : 105);
  }

  document.addEventListener('visibilitychange', synchronize);
  reducedMotion.addEventListener('change', synchronize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      synchronize();
    }).observe(welcome);
  } else {
    visible = true;
    synchronize();
  }
})();

