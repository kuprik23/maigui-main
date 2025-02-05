import * as THREE from 'three';

// Initialize chat functionality
document.addEventListener('DOMContentLoaded', () => {
    let convaiClient;

    // Initialize Convai SDK if available
    try {
        if (window.CONVAI_SDK) {
            convaiClient = new window.CONVAI_SDK.ConvaiClient({
                apiKey: '65bf9ae68038238e590ce2857b7d933b',
                characterId: '63eba3f89146e9c36c6e5751',
                enableAudio: true,
                container: 'convai-container',
                enableVoiceInput: true,
                enableTextInput: true,
                enableTextOutput: true,
                enableAutoplay: true,
                enableProfanityFilter: true,
                language: 'en-US'
            });
        } else {
            console.warn('Convai SDK not available');
            document.getElementById('convai-container').innerHTML = '<div class="convai-error">Chat functionality is currently unavailable.</div>';
            return;
        }
    } catch (error) {
        console.error('Error initializing Convai:', error);
        document.getElementById('convai-container').innerHTML = '<div class="convai-error">Chat functionality is currently unavailable.</div>';
        return;
    }

    const outputDiv = document.getElementById('convai-output');
    const inputField = document.getElementById('convai-input');
    const sendButton = document.getElementById('convai-send');

    // Helper function to append messages to output
    function appendMessage(text, isAI = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isAI ? 'ai-message' : 'user-message';
        
        // Message text
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        messageDiv.appendChild(textSpan);
        
        // Timestamp
        const timeSpan = document.createElement('div');
        timeSpan.className = 'message-time';
        const now = new Date();
        timeSpan.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageDiv.appendChild(timeSpan);
        
        outputDiv.appendChild(messageDiv);
        
        // Smooth scroll to bottom
        outputDiv.scrollTo({
            top: outputDiv.scrollHeight,
            behavior: 'smooth'
        });
        
        // Add fade-in animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(10px)';
        messageDiv.style.transition = 'all 0.3s ease';
        
        // Trigger animation
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
    }

    // Set up response callback
    convaiClient.setResponseCallback((response) => {
        console.log('AI Response:', response);
        if (response && response.text) {
            appendMessage(response.text, true);
        }
    });

    // Set up error callback
    convaiClient.setErrorCallback((error) => {
        console.error('Convai Error:', error);
        appendMessage('Sorry, there was an error processing your request.', true);
    });

    // Handle send button click
    function sendMessage() {
        const message = inputField.value.trim();
        if (message) {
            appendMessage(message, false);
            convaiClient.sendTextMessage(message);
            inputField.value = '';
        }
    }

    // Add event listeners
    sendButton.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initialize character
    convaiClient.initializeCharacter().then(() => {
        console.log('Convai character initialized successfully');
        appendMessage('Hello! How can I help you today?', true);
    }).catch((error) => {
        console.error('Error initializing Convai character:', error);
        appendMessage('Sorry, I had trouble connecting. Please try refreshing the page.', true);
    });
});

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
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-container').appendChild(renderer.domElement);

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
            randomX: (Math.random() - 0.5) * 15,
            randomY: (Math.random() - 0.5) * 15,
            randomZ: (Math.random() - 0.5) * 8,
            phase: Math.random() * Math.PI * 2 // Add phase for varied movement
        });
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.03,
        vertexColors: true,
        transparent: true,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        opacity: 0.8
    });

    particles = new THREE.Points(geometry, material);
    particles.rotation.x = Math.PI * 0.1; // Slight tilt
    scene.add(particles);

    camera.position.z = 5;
    
    // Center the particles
    particles.position.x = 0;
    particles.position.y = 0;

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
        
        // Calculate distance from mouse with enhanced sensitivity
        const dx = targetX * 3; // Increased mouse influence
        const dy = targetY * 3;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Enhanced scatter effect based on mouse proximity
        let x = particle.originalX;
        let y = particle.originalY;
        let z = particle.originalZ;
        
        if (distance < 2.5) { // Further increased scatter radius
            const scatter = Math.pow((2.5 - distance), 2) * 2.0; // Enhanced non-linear scatter effect
            const time_factor = Math.sin(time * 0.001 + i) * 0.3; // Add some wave motion
            x += particle.randomX * scatter + time_factor;
            y += particle.randomY * scatter + time_factor;
            z += particle.randomZ * scatter;
        } else {
            // Smooth return to original position
            const returnSpeed = 0.05;
            x += (particle.originalX - x) * returnSpeed;
            y += (particle.originalY - y) * returnSpeed;
            z += (particle.originalZ - z) * returnSpeed;
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
function initializeMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const menu = document.getElementById('menu');
    const spans = menuBtn.getElementsByTagName('span');

    // Add transition styles to spans
    spans[0].style.transition = 'transform 0.3s ease-in-out';
    spans[1].style.transition = 'opacity 0.3s ease-in-out';
    spans[2].style.transition = 'transform 0.3s ease-in-out';

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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMenu();
    init(); // Initialize Three.js scene
    animate();
});
