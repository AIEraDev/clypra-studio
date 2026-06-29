<div align="center">
  <img src="./apps/studio/public/clypra.svg" alt="Clypra Logo" width="120" height="120" />
  <h1>Clypra Studio</h1>
  <p><strong>AI-Powered Text Effects & Creative Editor</strong></p>
  <p>Design, animate, and export high-performance Canvas 2D text effects with gradients, bevels, glow stacks, shadows, and procedural engines.</p>
  
  <p>
    <a href="https://clypra.abdulkabirmusa.com">Live Demo</a> • 
    <a href="https://clypra.abdulkabirmusa.com/studio">Studio App</a> •
    <a href="#-features">Features</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="./CONTRIBUTING.md">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/PixiJS-8-E60010?logo=pixijs&logoColor=white" alt="PixiJS" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  </p>
</div>

---

## ✨ Features

### 🎨 **Design Studio**

- **Real-time Canvas Preview** - Instant visual feedback as you design
- **Advanced Typography Controls** - Font family, size, weight, letter spacing, and line height
- **Multi-layer Effects** - Gradients, shadows, glows, bevels, and strokes
- **Color Management** - Full RGBA color picker with gradient support
- **Preset Library** - 20+ built-in professional presets
- **Custom Presets** - Save and manage your own effect templates

### 🎥 **GPU-Accelerated Video Effects** ⚡ NEW!

- **37 Professional Effects** - PixiJS-powered WebGL rendering
- **5 Effect Categories**:
  - 💡 **Light Effects (10)** - Neon glow, lens flare, light leak, vignette, color grading
  - 🌀 **Glitch Effects (5)** - RGB split, VHS, CRT, glitch bands, static noise
  - 🎬 **Cinematic Effects (10)** - Motion blur, film grain, tilt shift, drop shadow, LUT
  - 🌊 **Distortion Effects (5)** - Bulge/pinch, twist, shockwave, reflection, displacement
  - 🎨 **Stylization Effects (7)** - ASCII art, pixelate, outline, emboss, cross-hatch
- **Real-time Parameter Control** - Live preview with hardware acceleration
- **Effect Composition** - Chain multiple effects for unique visuals
- **Dual Rendering** - Seamless Canvas2D and PixiJS integration

### 🤖 **AI-Powered Tools**

- **Prompt-to-Style** - Generate text effects from natural language descriptions
- **Image Style Scanner** - Analyze and replicate text effects from images
- **AI Name Generator** - Smart naming for your custom effects
- **Deep Design Research** - Historical and thematic style exploration
- **Custom Effect Generator** ⚡ NEW! - AI-generated PixiJS effects with GLSL shaders

### 🎬 **Animation Engine**

- **Timeline Editor** - Professional keyframe-based animation
- **Layer System** - Organize and animate multiple text layers
- **Easing Functions** - Smooth transitions with customizable curves
- **Export Options** - PNG, PNG sequence, and WebM video formats

### 💻 **Developer Export**

- **TypeScript/JavaScript** - Production-ready code generation
- **Standalone HTML** - Self-contained interactive demos
- **JSON Definitions** - Portable effect configurations
- **Copy & Download** - Quick integration into your projects

### 🛠️ **Developer Tools** ⚡ NEW!

- **Effect Graph Sandbox** - Visual effect composition testing
- **Admin Effects Panel** - Effect library management
- **Parameter Editor** - Dynamic form generation from schemas
- **Performance Metrics** - Real-time FPS and render stats

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Gemini API Key** (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AIEraDev/clypra-studio.git
   cd clypra-studio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   Get your API key from [Google AI Studio](https://ai.google.dev/)

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:5173`

---

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploy to Vercel

```bash
vercel deploy
```

---

## 🛠️ Tech Stack

- **Frontend Framework** - React 19 + TypeScript
- **Build Tool** - Vite 6
- **Styling** - Tailwind CSS 4 + Custom CSS Variables
- **Canvas Rendering** - HTML5 Canvas 2D API
- **GPU Rendering** ⚡ - PixiJS 8 + WebGL (37 effects)
- **Effect Filters** - pixi-filters library (40+ GPU filters)
- **AI Integration** - Google Gemini API
- **Animation** - Custom keyframe engine
- **Export** - Canvas-to-PNG, WebM encoding, effect code generation
- **Routing** - Client-side routing with route-based metadata
- **Testing** - Vitest

---

## 📁 Project Structure

```
clypra-studio/
├── public/              # Static assets (logos, images, manifests)
├── src/
│   ├── components/      # React components
│   │   ├── screens/     # Page components (WebShowcase, etc.)
│   │   ├── *.tsx        # UI components (panels, modals, controls)
│   ├── engine/          # Core text effect engine
│   │   ├── animation.ts # Animation system
│   │   ├── render.ts    # Canvas rendering
│   │   ├── schema.ts    # Type definitions
│   │   └── *.ts         # Engine utilities
│   ├── hooks/           # Custom React hooks
│   ├── App.tsx          # Main studio application
│   ├── RootApp.tsx      # Root component with routing
│   ├── main.tsx         # Application entry point
│   ├── presets.ts       # Built-in effect presets
│   └── types.ts         # TypeScript type definitions
├── api/                 # Server-side API handlers
│   ├── handlers.ts      # Gemini API integration
│   └── index.ts         # API routes
├── server.ts            # Express server
└── package.json         # Dependencies and scripts
```

---

## 🎯 Usage

### Creating a Text Effect

1. **Start from a preset** or create from scratch
2. **Customize typography** - Font, size, spacing
3. **Add effects** - Gradients, shadows, glows, bevels
4. **Animate** (optional) - Add keyframes and transitions
5. **Export** - Download as code, image, or video

### Creating GPU-Accelerated Video Effects ⚡ NEW!

1. **Navigate to Effects** - Go to `/effects/video`
2. **Choose Effect Category** - Light, Glitch, Cinematic, Distortion, or Style
3. **Select an Effect** - Browse 37 professional PixiJS effects
4. **Adjust Parameters** - Real-time preview with sliders and color pickers
5. **Chain Effects** - Combine multiple effects for unique results
6. **Export** - Download as image, video, or effect code

#### Example Effects:

- **Neon Glow**: Premium neon outline with customizable color and intensity
- **VHS**: Vintage tape artifacts with scanlines and tracking noise
- **Motion Blur**: Directional blur with velocity vectors
- **RGB Split**: Chromatic aberration with independent channel offsets
- **ASCII Art**: Convert video to ASCII characters in real-time

### Using AI Features

#### Prompt-to-Style

```
"Create a retro 80s neon effect with pink and cyan colors"
```

#### AI Custom Effect Generator ⚡ NEW!

```
"Create a holographic rainbow shimmer effect that shifts colors over time"
```

The AI generates:

- Complete PixiJS effect implementation
- GLSL fragment shader code
- Parameter definitions with ranges
- Real-time preview for testing

#### Image Scanner

Upload an image with text effects, and the AI will analyze and recreate the styling.

### Exporting Code

The studio generates production-ready code:

- **TypeScript Class** - Reusable effect engine
- **HTML Sandbox** - Standalone interactive demo
- **JSON Config** - Portable effect definition
- **PixiJS Effect Code** ⚡ - GPU-accelerated effect implementation

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### Quick Start

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes following our [coding guidelines](./CONTRIBUTING.md)
4. Commit using [conventional commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: add amazing feature'`)
5. Push to your branch (`git push origin feat/amazing-feature`)
6. Open a Pull Request

### Resources

- [Contributing Guidelines](./CONTRIBUTING.md) - Detailed contribution instructions
- [Code of Conduct](./CODE_OF_CONDUCT.md) - Community standards
- [Security Policy](./SECURITY.md) - Report security vulnerabilities

### Ways to Contribute

- 🐛 Report bugs via [GitHub Issues](https://github.com/AIEraDev/clypra-studio/issues)
- ✨ Suggest new features or enhancements
- 📝 Improve documentation
- 🎨 Design new effects or presets
- 💻 Submit code improvements
- 🧪 Write tests

See [open issues](https://github.com/AIEraDev/clypra-studio/issues) for a list of proposed features and known issues.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI-powered design assistance
- **React Team** - Amazing frontend framework
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **PixiJS Team** - GPU-accelerated 2D WebGL rendering
- **pixi-filters** - Professional-grade filter library

---

## 📧 Contact

**Abdul Kabir Musa**

- Website: [clypra.abdulkabirmusa.com](https://abdulkabirmusa.com)
- GitHub: [@AIEraDev](https://github.com/AIEraDev)

---

<div align="center">
  <p>Made with ❤️ by AbdulKabir Musa</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
