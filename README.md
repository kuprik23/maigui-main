# Em3rsa - 3D AI Agents Website

An interactive website showcasing Em3rsa's work in 3D AI Agents, featuring a dynamic Three.js particle eye animation and AI chat functionality.

## Features

- Interactive particle eye animation with advanced effects:
  - Dynamic scatter effect on hover with non-linear movement
  - Smooth return-to-position behavior
  - Wave motion for organic particle movement
  - Enhanced color transitions and particle visibility
- AI Chat Integration:
  - Real-time conversation with AI assistant
  - Stylish message bubbles with timestamps
  - Smooth animations and transitions
  - Graceful error handling for SDK availability
- Responsive design with mobile-friendly navigation
- Google authentication integration
- Smooth scrolling sections for content
- Placeholders for media content

## Technologies Used

- Three.js for 3D graphics and particle animations
- Convai SDK for AI chat functionality
- Vite for development and building
- ES Modules for modern JavaScript
- Google OAuth for authentication
- Vanilla JavaScript for DOM manipulation
- CSS3 for styling and animations

## Getting Started

1. Clone the repository:
```bash
git clone [your-repo-url]
cd em3rsa
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
em3rsa/
├── js/
│   └── main.js         # Three.js implementation, chat functionality, and main logic
├── index.html          # Main HTML file with styles and structure
├── package.json        # Project dependencies and scripts
├── vite.config.js      # Vite configuration
└── README.md          # Project documentation
```

## Features in Detail

### Three.js Particle Animation
- Dynamic particle system creating an eye shape
- Interactive scatter effect on mouse hover
- Non-linear movement patterns for organic feel
- Smooth transitions and color changes
- Independent operation from other features

### AI Chat Integration
- Real-time conversation capabilities
- Elegant UI with distinct message bubbles
- Timestamp display for messages
- Smooth scrolling and fade-in animations
- Graceful fallback for SDK unavailability

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
