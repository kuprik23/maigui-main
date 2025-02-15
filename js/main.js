import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Three.js Scene Setup
let scene, camera, renderer, model;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let scrollProgress = 0;
let isMobile = window.innerWidth <= 768;

// Initialize Three.js scene
async function init() {
    try {
        // Scene setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setClearColor(0x000000, 0); // Set transparent background
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // Enhanced lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Increased intensity
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increased intensity
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Add additional light from the front
        const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
        frontLight.position.set(0, 0, 5);
        scene.add(frontLight);

        // Load 3D model first
        await loadModel();
        
        // Position camera further back and slightly elevated
        camera.position.set(0, 2, 8);
        camera.lookAt(0, 0, 0);

        // Event Listeners
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', onWindowResize);
        
        // Device orientation for mobile
        if (isMobile && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', onDeviceOrientation);
        }

        // Start animation after everything is loaded
        animate();
    } catch (error) {
        console.error('Error in init:', error);
    }
}

async function loadModel() {
    try {
        const loader = new GLTFLoader();
        
        // Create a promise to handle the loading
        const loadModelPromise = new Promise((resolve, reject) => {
            loader.load(
                '/Golden_Vision_20cm.glb',
                (gltf) => {
                    console.log('Model loaded successfully:', gltf);
                    resolve(gltf);
                },
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
        });

        const gltf = await loadModelPromise;
        model = gltf.scene;

        // Log model details
        console.log('Model geometry:', model.children);
        
        // Reset model position and rotation
        model.position.set(0, 0, 0);
        model.rotation.set(0, Math.PI / 4, 0);
        
        // Compute bounding box
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        
        // Scale model to reasonable size
        const scale = 2.5 / Math.max(size.x, size.y, size.z);
        model.scale.multiplyScalar(scale);
        
        // Center model
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center.multiplyScalar(scale));
        
        // Adjust final position
        model.position.y = -0.5;
        
        // Add the model to the scene
        scene.add(model);
        
        console.log('Model added to scene');
        
        return true;
    } catch (error) {
        console.error('Error loading model:', error);
        return false;
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

let scrollTimeout;

function onScroll() {
    if (!scrollTimeout) {
        scrollTimeout = setTimeout(function() {
            scrollTimeout = null;
            const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
            scrollProgress = window.scrollY / scrollMax;
        }, 100);
    }
}

function onWindowResize() {
    isMobile = window.innerWidth <= 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Update renderer size only
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Main animation loop
function animate() {
    requestAnimationFrame(animate);
    if (model) {
        model.rotation.y += 0.005;
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
async function initializeApp() {
    try {
        initializeMenu();
        await init(); // Initialize Three.js scene
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
}

// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);
