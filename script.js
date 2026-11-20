/* Core portfolio interactions — dependency-free */
(() => {
  'use strict';

  const init = () => {
    const root = document.documentElement;
    const menuButton = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const themeButton = document.querySelector('.theme-toggle');
    const backToTop = document.querySelector('.back-to-top');
    const progress = document.querySelector('.scroll-progress');
    const year = document.querySelector('#current-year');
    const navItems = [...document.querySelectorAll('.nav-link')];

    if (year) year.textContent = String(new Date().getFullYear());

    // Theme toggle.
    const setTheme = (theme) => {
      const dark = theme === 'dark';
      root.dataset.theme = dark ? 'dark' : 'light';
      if (themeButton) {
        themeButton.setAttribute('aria-pressed', String(dark));
        themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
        themeButton.setAttribute('title', `Switch to ${dark ? 'light' : 'dark'} theme`);
        const icon = themeButton.querySelector('i');
        const label = themeButton.querySelector('.theme-toggle-label');
        if (icon) icon.className = `fa-solid ${dark ? 'fa-sun' : 'fa-moon'}`;
        if (label) label.textContent = dark ? 'Light' : 'Dark';
      }
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = dark ? '#08090d' : '#f7f8fc';
      try { localStorage.setItem('portfolio-theme', dark ? 'dark' : 'light'); } catch (_) {}
    };

    let initialTheme = 'light';
    try { initialTheme = localStorage.getItem('portfolio-theme') || 'light'; } catch (_) {}
    setTheme(initialTheme);

    if (themeButton) {
      themeButton.addEventListener('click', (event) => {
        event.preventDefault();
        setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
      });
    }

    // Mobile navigation.
    const closeMenu = () => {
      if (!menuButton || !navLinks) return;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      navLinks.classList.remove('open');
      document.body.classList.remove('menu-open');
    };

    if (menuButton && navLinks) {
      menuButton.addEventListener('click', (event) => {
        event.preventDefault();
        const open = menuButton.getAttribute('aria-expanded') !== 'true';
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        navLinks.classList.toggle('open', open);
        document.body.classList.toggle('menu-open', open);
      });
      navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
      });
    }

    // Smooth in-page navigation with a fixed-header offset.
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        closeMenu();
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
        history.replaceState(null, '', `#${id}`);
      });
    });

    // Back to top.
    if (backToTop) {
      backToTop.addEventListener('click', event => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Reveal-on-scroll, with a safe fallback.
    const revealItems = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      revealItems.forEach(item => observer.observe(item));
    } else {
      revealItems.forEach(item => item.classList.add('is-visible'));
    }

    // Scroll progress, active navigation and back-to-top visibility.
    const sections = [...document.querySelectorAll('main section[id]')];
    const updateScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = `${max > 0 ? window.scrollY / max * 100 : 0}%`;
      if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 450);
      let current = 'home';
      sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 190) current = section.id;
      });
      navItems.forEach(item => {
        const active = item.getAttribute('href') === `#${current}`;
        item.classList.toggle('active', active);
        if (active) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 680) closeMenu();
      updateScroll();
    }, { passive: true });
    updateScroll();

    // Card pointer glow.
    document.querySelectorAll('.about-panel,.skill-card,.education-card,.highlight-card,.project-card,.contact-panel')
      .forEach(card => card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      }, { passive: true }));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();


/* Classic mouse-reactive network: connected nodes, fine lines and depth */
(() => {
  const canvas = document.getElementById('geo-canvas');
  if (!canvas) return;

  const fallback = () => {
    canvas.style.display = 'none';
    document.documentElement.classList.add('geometry-fallback');
  };

  const startScene = () => {
    if (!window.THREE) { fallback(); return; }
    const THREE = window.THREE;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas, alpha: true, antialias: true, powerPreference: 'high-performance'
      });
    } catch (error) {
      fallback();
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 100);
    camera.position.z = 17;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x000000, 0);

    const network = new THREE.Group();
    scene.add(network);

    // Nodes are distributed in a broad, calm cloud, leaving the hero copy legible.
    const isMobile = innerWidth < 700;
    const nodeCount = isMobile ? 105 : 230;
    const spreadX = isMobile ? 18 : 31;
    const spreadY = isMobile ? 13.5 : 18;
    const nodeData = [];
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeGeometry = new THREE.BufferGeometry();

    for (let i = 0; i < nodeCount; i++) {
      const x = (Math.random() - .5) * spreadX;
      const y = (Math.random() - .5) * spreadY;
      const z = -1.5 - Math.random() * 9;
      nodeData.push({
        x, y, z,
        vx: (Math.random() - .5) * .012,
        vy: (Math.random() - .5) * .012,
        phase: Math.random() * Math.PI * 2
      });
      nodePositions[i*3] = x;
      nodePositions[i*3+1] = y;
      nodePositions[i*3+2] = z;
    }
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));

    const nodeMaterial = new THREE.PointsMaterial({
      color: 0x7898c8,
      size: isMobile ? .065 : .075,
      transparent: true,
      opacity: .84,
      sizeAttenuation: true,
      depthWrite: false
    });
    const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    network.add(nodes);

    // A single dynamic line buffer is updated each frame for connected neighbors.
    const maxSegments = nodeCount * 18;
    const linePositions = new Float32Array(maxSegments * 2 * 3);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setDrawRange(0, 0);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x91a9d6,
      transparent: true,
      opacity: .30,
      depthWrite: false
    });
    const links = new THREE.LineSegments(lineGeometry, lineMaterial);
    network.add(links);

    // Small accent nodes, deliberately sparse and understated.
    const accentMaterial = new THREE.PointsMaterial({
      color: 0x8f83d9, size: isMobile ? .075 : .09,
      transparent: true, opacity: .72, sizeAttenuation: true, depthWrite: false
    });
    const accentIndices = nodeData
      .map((_, i) => i)
      .filter(i => i % 9 === 0);
    const accentPositions = new Float32Array(accentIndices.length * 3);
    const accentsGeometry = new THREE.BufferGeometry();
    accentsGeometry.setAttribute('position', new THREE.BufferAttribute(accentPositions, 3));
    const accents = new THREE.Points(accentsGeometry, accentMaterial);
    network.add(accents);

    let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0;
    if (matchMedia('(pointer:fine)').matches && !reducedMotion) {
      addEventListener('pointermove', event => {
        targetX = (event.clientX / innerWidth - .5) * 2;
        targetY = (event.clientY / innerHeight - .5) * 2;
      }, { passive: true });
      addEventListener('pointerleave', () => { targetX = 0; targetY = 0; });
    }

    const clock = new THREE.Clock();
    let raf = 0;
    let running = false;
    const maxDistance = isMobile ? 2.9 : 3.15;

    const drawConnections = () => {
      let cursor = 0;
      for (let i = 0; i < nodeCount; i++) {
        const a = nodeData[i];
        for (let j = i + 1; j < nodeCount; j++) {
          const b = nodeData[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dz = a.z - b.z;
          const distSq = dx*dx + dy*dy + dz*dz;
          if (distSq < maxDistance * maxDistance) {
            linePositions[cursor++] = a.x;
            linePositions[cursor++] = a.y;
            linePositions[cursor++] = a.z;
            linePositions[cursor++] = b.x;
            linePositions[cursor++] = b.y;
            linePositions[cursor++] = b.z;
          }
        }
      }
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.setDrawRange(0, cursor / 3);

      accentIndices.forEach((index, i) => {
        const n = nodeData[index];
        accentPositions[i*3] = n.x;
        accentPositions[i*3+1] = n.y;
        accentPositions[i*3+2] = n.z;
      });
      accentsGeometry.attributes.position.needsUpdate = true;
    };

    const render = () => {
      if (!running) return;
      raf = requestAnimationFrame(render);
      const t = clock.getElapsedTime();

      // Quick, smooth mouse response; the network subtly tilts in 3D.
      pointerX += (targetX - pointerX) * .48;
      pointerY += (targetY - pointerY) * .48;
      network.rotation.y = pointerX * .22 + Math.sin(t * .65) * .035;
      network.rotation.x = -pointerY * .16 + Math.cos(t * .55) * .025;
      network.position.x = pointerX * .55;
      network.position.y = -pointerY * .38;

      for (let i = 0; i < nodeCount; i++) {
        const n = nodeData[i];
        if (!reducedMotion) {
          n.x += n.vx + Math.sin(t * 1.15 + n.phase) * .0018;
          n.y += n.vy + Math.cos(t * 1.05 + n.phase) * .0018;
          if (n.x > spreadX/2) n.x = -spreadX/2;
          if (n.x < -spreadX/2) n.x = spreadX/2;
          if (n.y > spreadY/2) n.y = -spreadY/2;
          if (n.y < -spreadY/2) n.y = spreadY/2;
        }
        nodePositions[i*3] = n.x;
        nodePositions[i*3+1] = n.y;
        nodePositions[i*3+2] = n.z;
      }
      nodeGeometry.attributes.position.needsUpdate = true;
      drawConnections();
      renderer.render(scene, camera);
    };

    const start = () => {
      if (running) return;
      running = true;
      clock.start();
      render();
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const resize = () => {
      const w = innerWidth, h = innerHeight;
      camera.aspect = w / h;
      camera.position.z = w < 700 ? 20 : 17;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    };

    addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (!reducedMotion) start();
      else { drawConnections(); renderer.render(scene, camera); }
    });
    resize();
    drawConnections();
    if (reducedMotion) renderer.render(scene, camera);
    else start();
  };

  if (window.THREE) startScene();
  else window.addEventListener('three-ready', startScene, { once: true });
})();
