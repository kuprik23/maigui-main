import * as THREE from 'three';

// Three.js Scene Setup
let scene, camera, renderer, particles;
let eyeParticles = [];
const particleCount = 2000;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

// Initialize Three.js scene
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create particles for the eye
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    for (let i = 0; i < particleCount; i++) {
        // Create eye shape using parametric equations
        const t = (i / particleCount) * Math.PI * 2;
        const radius = 1.5;
        const x = Math.cos(t) * radius;
        const y = Math.sin(t) * radius * 0.6; // Make it slightly oval
        const z = 0;

        positions.push(x, y, z);
        
        // Random colors for particles
        colors.push(Math.random(), Math.random(), Math.random());
        
        // Store original positions for animation
        eyeParticles.push({
            originalX: x,
            originalY: y,
            originalZ: z,
            randomX: (Math.random() - 0.5) * 10,
            randomY: (Math.random() - 0.5) * 10,
            randomZ: (Math.random() - 0.5) * 10
        });
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.02,
        vertexColors: true,
        transparent: true,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
    });

    particles = new THREE.Points(geometry, material);
    particles.rotation.x = Math.PI * 0.1; // Slight tilt
    scene.add(particles);

    camera.position.z = 4;

    // Event Listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);

    // Rotate particles slowly
    if (particles) {
        particles.rotation.z = Math.sin(time * 0.0001) * 0.1;
    }

    // Smooth mouse movement
    targetX += (mouseX - targetX) * 0.1;
    targetY += (mouseY - targetY) * 0.1;

    const positions = [];
    const colors = [];

    for (let i = 0; i < particleCount; i++) {
        const particle = eyeParticles[i];
        
        // Calculate distance from mouse
        const dx = targetX * 2;
        const dy = targetY * 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Scatter effect based on mouse proximity
        let x = particle.originalX;
        let y = particle.originalY;
        let z = particle.originalZ;
        
        if (distance < 1.5) {
            const scatter = (1.5 - distance) * 2;
            x += particle.randomX * scatter;
            y += particle.randomY * scatter;
            z += particle.randomZ * scatter;
        }

        positions.push(x, y, z);
        
        // More vibrant color changes with time-based animation
        const r = 0.7 + Math.sin(time * 0.001 + i * 0.1) * 0.3;
        const g = 0.7 + Math.cos(time * 0.001 + i * 0.1) * 0.3;
        const b = 0.7 + Math.sin(time * 0.002 + i * 0.1) * 0.3;
        colors.push(r, g, b);
    }

    // Update geometry
    const geometry = particles.geometry;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    renderer.render(scene, camera);
}

// Menu functionality
document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('menu').classList.toggle('active');
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
        // Close menu after clicking
        document.getElementById('menu').classList.remove('active');
    });
});

// Google Sign-in
window.onSignIn = function(googleUser) {
    const profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId());
    console.log('Name: ' + profile.getName());
    console.log('Email: ' + profile.getEmail());
    // Here you would typically send the user info to your backend
};

// Initialize Three.js scene
init();
animate();
