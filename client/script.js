// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Intersection Observer for fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.problem-card, .feature-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});

// 3D Hero Canvas (Three.js)
(function initHero3D(){
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || !window.THREE) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07070a, 10, 60);

    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(0x000000, 0);

    // Gradient ambient lighting
    const ambientTop = new THREE.HemisphereLight(0x8899ff, 0x111122, 0.8);
    scene.add(ambientTop);

    const dirLight = new THREE.DirectionalLight(0x8899ff, 0.6);
    dirLight.position.set(3, 5, 2);
    scene.add(dirLight);

    // Reactive orb (glowing sphere)
    const orbGeometry = new THREE.SphereGeometry(1.2, 64, 64);
    const orbMaterial = new THREE.MeshStandardMaterial({
        color: 0x667eea,
        metalness: 0.2,
        roughness: 0.3,
        emissive: 0x222244,
        emissiveIntensity: 0.7
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orb);

    // Orbiting rings
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x764ba2, wireframe: true, opacity: 0.5, transparent: true });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2, 0.02, 16, 200), ringMaterial);
    ring1.rotation.x = Math.PI / 3;
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.02, 16, 220), new THREE.MeshBasicMaterial({ color: 0x9b6bd6, wireframe: true, opacity: 0.35, transparent: true }));
    ring2.rotation.x = -Math.PI / 4;
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.02, 16, 240), new THREE.MeshBasicMaterial({ color: 0xf093fb, wireframe: true, opacity: 0.25, transparent: true }));
    ring3.rotation.y = Math.PI / 5;
    scene.add(ring1, ring2, ring3);

    // Floating particles
    const particleGeom = new THREE.BufferGeometry();
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        const r = 6 * Math.random();
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x667eea, size: 0.03, transparent: true, opacity: 0.8 });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // Resize handling
    function resize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);

    // Interactivity: gentle parallax with mouse
    let targetX = 0, targetY = 0;
    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        targetX = x;
        targetY = y;
    });

    // Reduce motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
        const t = clock.getElapsedTime();
        if (!prefersReducedMotion) {
            orb.rotation.y += 0.003;
            ring1.rotation.z += 0.002;
            ring2.rotation.z -= 0.0015;
            ring3.rotation.x += 0.0012;
            particles.rotation.y += 0.0008;
        }
        camera.position.x += (targetX * 0.6 - camera.position.x) * 0.02;
        camera.position.y += (-targetY * 0.4 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    resize();
    animate();
})();


