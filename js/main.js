import * as THREE from 'three';

// Three.js Scene Setup
let scene, camera, renderer, logo;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let scrollProgress = 0;
let isMobile = window.innerWidth <= 768;

// Initialize Three.js scene
function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create logo geometry
    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(0, 2);
    triangleShape.lineTo(-1.7, -1);
    triangleShape.lineTo(1.7, -1);
    triangleShape.lineTo(0, 2);

    const extrudeSettings = {
        steps: 1,
        depth: 0.4,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.1,
        bevelSegments: 3
    };

    const geometry = new THREE.ExtrudeGeometry(triangleShape, extrudeSettings);

    // Create custom shader material
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0xFFD700) }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 color;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vec3 light = normalize(vec3(1.0, 1.0, 1.0));
                float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                float diffuse = max(0.0, dot(vNormal, light));
                vec3 baseColor = color;
                vec3 finalColor = mix(baseColor, vec3(1.0), fresnel * 0.7);
                finalColor *= (diffuse * 0.8 + 0.2);
                finalColor += vec3(pow(fresnel, 2.0)) * 0.5;
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    });

    // Create logo mesh
    logo = new THREE.Mesh(geometry, material);
    logo.scale.set(0.8, 0.8, 0.8);
    scene.add(logo);

    // Position camera
    camera.position.z = 5;

    // Event Listeners
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onWindowResize);
    
    // Device orientation for mobile
    if (isMobile && window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', onDeviceOrientation);
    }
}

function onMouseMove(event) {
    if (isMobile) return;
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
}

function onDeviceOrientation(event) {
    if (event.beta && event.gamma) {
        mouseX = Math.min(Math.max(event.gamma / 45, -1), 1);
        mouseY = Math.min(Math.max(event.beta / 45, -1), 1);
    }
}

function onScroll() {
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = window.scrollY / scrollMax;
}

function onWindowResize() {
    isMobile = window.innerWidth <= 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);

    if (logo) {
        // Update shader time uniform
        logo.material.uniforms.time.value = time * 0.001;

        // Smooth rotation based on mouse position
        const rotationSpeed = isMobile ? 0.03 : 0.05;
        targetRotationY += (mouseX * 1.5 - targetRotationY) * rotationSpeed;
        targetRotationX += (mouseY * 1.5 - targetRotationX) * rotationSpeed;

        // Apply rotations
        logo.rotation.y = targetRotationY;
        logo.rotation.x = targetRotationX;

        // Add scroll-based rotation
        logo.rotation.z = scrollProgress * Math.PI * 2;

        // Add floating animation
        logo.position.y = Math.sin(time * 0.001) * 0.1;
    }

    renderer.render(scene, camera);
}

// Menu functionality
function initializeMenu() {
    console.log('Initializing menu...');
    const menuBtn = document.getElementById('menu-btn');
    const menu = document.getElementById('menu');

    if (!menuBtn || !menu) {
        console.error('Menu elements not found:', { menuBtn, menu });
        return;
    }

    console.log('Menu elements found:', { menuBtn, menu });
    const spans = menuBtn.getElementsByTagName('span');
    console.log('Menu spans found:', spans.length);

    // Add transition styles to spans
    Array.from(spans).forEach((span, index) => {
        span.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
        console.log(`Added transition to span ${index}`);
    });

    menuBtn.addEventListener('click', function() {
        menu.classList.toggle('active');
        this.classList.toggle('active');
        
        if (menu.classList.contains('active')) {
            // Animate to X
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
            
            // Add overlay
            const overlay = document.createElement('div');
            overlay.id = 'menu-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0, 0, 0, 0.5)';
            overlay.style.zIndex = '998';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(overlay);
            
            // Trigger overlay fade in
            setTimeout(() => overlay.style.opacity = '1', 0);
            
            // Close menu when clicking overlay
            overlay.addEventListener('click', function() {
                menu.classList.remove('active');
                menuBtn.classList.remove('active');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            });
        } else {
            // Reset to hamburger
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
            
            // Remove overlay
            const overlay = document.getElementById('menu-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        }
    });

    // Close menu when clicking menu items
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            menuBtn.classList.remove('active');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
            
            const overlay = document.getElementById('menu-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        });
    });
}

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

// Wait for DOM to be fully loaded before initializing
function initializeApp() {
    console.log('Initializing app...');
    try {
        initializeMenu();
        init(); // Initialize Three.js scene
        animate();
        console.log('App initialization complete');
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
}

// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    initializeApp();
});
