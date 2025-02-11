import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Three.js Scene Setup
let scene, camera, renderer, model;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let scrollProgress = 0;
let isMobile = window.innerWidth <= 768;

// Initialize Three.js scene
function init() {
    try {
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

        // Create loading indicator
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(loadingOverlay);

        // Load 3D model
        loadModel();
        
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
    } catch (error) {
        console.error('Error in init:', error);
    }
}

async function loadModel() {
    try {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync('models/model.glb');

        model = gltf.scene;
        model.scale.set(2, 2, 2);
        model.position.set(0, 0, 0);
        scene.add(model);

        // Add rotation animation
        model.rotation.y = Math.PI / 4;

        // Remove loading overlay
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => loadingOverlay.remove(), 500);
        }
    } catch (error) {
        console.error('Error loading model:', error);
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = '<p style="color: white;">Error loading 3D model. Please try again.</p>';
        }
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
    // Update renderer size only
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);

    if (model) {
        // Rotate model
        model.rotation.y += 0.005;
        
        // Add floating animation
        model.position.y = Math.sin(time * 0.001) * 0.1;
    }

    renderer.render(scene, camera);
}

// Menu functionality
function initializeMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const menu = document.getElementById('menu');

    if (!menuBtn || !menu) {
        console.error('Menu elements not found');
        return;
    }

    const spans = menuBtn.getElementsByTagName('span');

    // Add transition styles to spans
    Array.from(spans).forEach(span => {
        span.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
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

// Wait for DOM to be fully loaded before initializing
function initializeApp() {
    try {
        initializeMenu();
        init(); // Initialize Three.js scene
        animate();
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
}

// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);
