# MindMesh+ Client

A modern, gamified mental health platform frontend built with React, Three.js, and Ready Player Me avatars.

## 🎯 Overview

MindMesh+ is an immersive mental health support platform featuring:
- **3D Avatar Chat Interface** with realistic animations
- **Real-time Emotion Tracking** using face-api.js
- **Interactive Analytics Dashboard** with visualizations
- **Video Call Therapy Sessions** via WebRTC
- **Gamified Progress Tracking** with milestones
- **Crisis Support Resources** with 24/7 helplines

## 🚀 Tech Stack

- **Framework**: React 18.2 + Vite
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **Avatar**: Ready Player Me (Visage SDK)
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Charts**: Recharts
- **Face Recognition**: face-api.js
- **Real-time Communication**: WebRTC + Socket.IO

## 📦 Installation

```bash
# Clone repository
git clone <repo-url>
cd HACKLOOP/client

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
client/
├── public/
│   ├── 68f63a724e825b15ec6c27d4.glb    # Ready Player Me avatar model
│   └── assets/                          # Static assets
├── src/
│   ├── main.jsx                         # App entry point
│   ├── App.jsx                          # Root component with routing
│   ├── app-styles.css                   # Global styles
│   ├── components/                      # Reusable UI components
│   │   ├── Header.jsx                   # Main header
│   │   ├── Hero.jsx                     # Landing hero section
│   │   ├── Features.jsx                 # Feature showcase
│   │   ├── CTA.jsx                      # Call-to-action
│   │   ├── Footer.jsx                   # Footer
│   │   └── shared/                      # Shared components
│   │       ├── AppLayout.jsx            # App layout wrapper
│   │       ├── Sidebar.jsx              # Navigation sidebar
│   │       ├── Modal.jsx                # Modal component
│   │       └── ProtectedRoute.jsx       # Auth guard
│   ├── pages/                           # Main application pages
│   │   ├── Landing.jsx                  # Landing page
│   │   ├── Login.jsx                    # User login
│   │   ├── Signup.jsx                   # User registration
│   │   ├── Dashboard.jsx                # Main dashboard
│   │   ├── Chat.jsx                     # AI Chat with 3D avatar
│   │   ├── EmotionTracking.jsx          # Real-time emotion detection
│   │   ├── Analytics.jsx                # Progress analytics
│   │   ├── Therapists.jsx               # Find therapists
│   │   ├── VideoCall.jsx                # Video therapy sessions
│   │   ├── CrisisSupport.jsx            # Crisis resources
│   │   ├── Profile.jsx                  # User profile
│   │   ├── admin/                       # Admin features
│   │   │   └── AdminDashboard.jsx
│   │   └── therapist/                   # Therapist features
│   │       ├── TherapistDashboard.jsx
│   │       └── PatientDetails.jsx
│   ├── context/
│   │   └── AppContext.jsx               # Global state management
│   └── utils/
│       ├── webrtc.js                    # WebRTC utilities
│       ├── signaling.js                 # WebRTC signaling
│       └── animationUtils.js            # Avatar animation helpers
└── package.json
```

## ✨ Key Features

### 1. **AI Chat with 3D Avatar** (`Chat.jsx`)
- Realistic Ready Player Me avatar with natural animations
- **Greeting Animation**: Wave, smile, and head nod on load
- **Micro-movements**: Breathing, subtle sway, eye saccades
- **Lip Sync**: Mouth movements when AI speaks
- **Natural Gestures**: Hand movements, finger animations
- **Eye Tracking**: Realistic gaze with saccades and blinks
- **Conversation History**: Save/load/delete chat sessions
- **Dual Input**: Text and voice input
- **Keyboard Shortcuts**: Ctrl+K/N/S//, Esc
- **Message Actions**: Copy, thumbs up/down feedback
- **Typing Indicator**: Shows when AI is responding
- **Voice Visualization**: Animated bars during speech
- **Fullscreen Mode**: Maximize 3D avatar experience
- **Mobile Responsive**: Touch controls and adaptive layout

### 2. **Emotion Tracking** (`EmotionTracking.jsx`)
- Real-time facial emotion detection via webcam
- Emotion history with time-based charts
- Mood patterns analysis
- Integration with face-api.js

### 3. **Analytics Dashboard** (`Analytics.jsx`)
- Mood trends over time (Recharts)
- Session statistics
- Progress milestones
- Weekly/monthly comparisons

### 4. **Video Call Therapy** (`VideoCall.jsx`)
- WebRTC-based video sessions
- Screen sharing capabilities
- Chat during calls
- Session recording (optional)

### 5. **Therapist Matching** (`Therapists.jsx`)
- Browse available therapists
- Filter by specialization
- View ratings and availability
- Book appointments

### 6. **Crisis Support** (`CrisisSupport.jsx`)
- 24/7 helpline numbers
- Emergency resources
- Self-help guides
- Breathing exercises

## 🎨 Chat Interface Design

The chat interface follows a **minimal, gamified, light theme**:

### Visual Design
- **Background**: `#fafbfc` (ultra-light gray)
- **Primary Color**: `#6366f1` (indigo)
- **Accent**: `#10b981` (emerald for success)
- **Typography**: Clean sans-serif
- **Shadows**: Subtle `0 1px 3px rgba(0,0,0,0.1)`
- **Borders**: Minimal `1px solid #e5e7eb`

### Layout
- **3D Avatar**: Center stage (450px default, 60vh fullscreen)
- **Chat Messages**: Compact bubbles with hover actions
- **Sidebar**: Conversation history (280px)
- **Input Area**: Clean dual-input (text + voice)

### Animations
- **Message Entry**: Bouncy scale + translate animation
- **Typing Indicator**: 3 bouncing dots
- **Voice Bars**: 5 animated bars with wave effect
- **Keyboard Modal**: Backdrop blur + scale-up
- **Badge Pop**: Cubic bezier bounce for session count

### Interactions
- **Keyboard Shortcuts**:
  - `Ctrl+K`: Focus input
  - `Ctrl+N`: New chat
  - `Ctrl+S`: Save conversation
  - `Ctrl+/`: Show shortcuts
  - `Esc`: Clear/close
- **Message Actions**: Copy, thumbs up/down on hover
- **Session Management**: Save, load, delete conversations

## 🎭 Avatar Animation System

### Core Animations
1. **Initial Greeting** (5-phase sequence):
   - Look up with slight head tilt
   - Wave with right hand
   - Actual wave motion with fingers
   - Nodding while greeting
   - Return to neutral pose

2. **Micro-movements** (Always active):
   - Breathing: Chest expansion, shoulder lift
   - Postural sway: Subtle spine rotation
   - Weight shift: Periodic body movement
   - Head micro-movements: Tiny nods and tilts

3. **Eye System**:
   - Saccades: Random gaze shifts every 1.5-3s
   - Smooth pursuit: Eye tracking targets
   - Blinks: Random (2-4s) + after saccades
   - Eye convergence: Natural coordination

4. **Speaking Animations**:
   - Mouth morphs: Jaw open, lip movements
   - Head emphasis: Nods, tilts during speech
   - Expressive gestures: Hand movements
   - Breathing sync: Chest movement with speech

5. **Gesture System**:
   - Open hand: Welcoming gesture
   - Point: Directional emphasis
   - Explain: Open palms
   - Thinking: Hand to chin
   - Wave: Finger animation

### Morph Targets Used
- `smile`, `jawOpen`, `mouthOpen`
- `eyeBlinkLeft`, `eyeBlinkRight`, `blink`
- `eyeWiden`, `browsDown`, `browsUp`
- `mouthSmile`, `mouthFrown`

### Bone Manipulation
- Head, Neck, Spine (1, 2)
- Shoulders (left, right)
- Arms: Upper, Forearm, Hand
- Fingers: Thumb, Index, Middle, Ring, Pinky
- Eyes (left, right)

## 📱 Responsive Breakpoints

```css
/* Desktop: Default */
@media (max-width: 1024px) {
  /* Tablet: Adjusted sidebar (260px), avatar (280px) */
}

@media (max-width: 768px) {
  /* Mobile: Sidebar slide-in, 85% message width, full buttons */
}

@media (max-width: 480px) {
  /* Small Mobile: Compact (180px avatar), 90% messages, 36-40px buttons */
}
```

## 🔐 Authentication Flow

1. **Landing** (`/`) → Hero + Features
2. **Signup** (`/signup`) → Create account
3. **Login** (`/login`) → Authenticate
4. **Dashboard** (`/app/dashboard`) → Protected routes
5. **Profile** (`/app/profile`) → User settings

### Protected Routes
All `/app/*` routes require authentication via `ProtectedRoute.jsx`

## 🌐 API Integration

The client connects to the Node.js backend at `http://localhost:4000`:

```javascript
// Example API calls
const API_URL = 'http://localhost:4000';

// Login
POST /api/auth/login
Body: { email, password }

// Get user profile
GET /api/users/:userId
Headers: { Authorization: `Bearer ${token}` }

// Save emotion data
POST /api/emotions
Body: { userId, emotion, confidence, timestamp }

// Get therapists
GET /api/therapists

// Book session
POST /api/sessions
Body: { therapistId, userId, date, time }
```

## 🧪 Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🎮 Usage Examples

### Start New Chat Session
1. Navigate to Chat page
2. Click "New Chat" or press `Ctrl+N`
3. Type or use microphone
4. Watch avatar respond with animations

### Save Conversation
1. During chat, press `Ctrl+S`
2. Or click save icon in sidebar
3. Session appears in history

### Load Previous Session
1. Click on session in sidebar
2. Previous messages load
3. Continue conversation

### Fullscreen Mode
1. Click fullscreen toggle (⊞)
2. Avatar expands to 60vh
3. Exit with ⊟ or Esc

### Emotion Tracking
1. Go to Emotion Tracking page
2. Allow webcam access
3. View real-time emotion detection
4. See historical mood patterns

## 🎨 Customization

### Change Avatar Model
Replace `/public/68f63a724e825b15ec6c27d4.glb` with your Ready Player Me avatar:
```javascript
// In Chat.jsx
const modelUrl = '/your-avatar-id.glb';
```

### Adjust Animation Speed
```javascript
// In Chat.jsx RealisticAvatar component
const headNodSpeed = 1.0;  // Increase for faster
const gestureSpeed = 6.0;  // Gesture frequency
```

### Modify Color Scheme
Edit `app-styles.css`:
```css
:root {
  --primary: #6366f1;
  --background: #fafbfc;
  --accent: #10b981;
}
```

## 🐛 Troubleshooting

### Avatar Not Loading
- Check `/public/68f63a724e825b15ec6c27d4.glb` exists
- Verify file is valid GLB format
- Check browser console for errors

### Webcam Not Working
- Grant camera permissions
- Check HTTPS (required for camera)
- Verify face-api.js models loaded

### WebRTC Failing
- Ensure backend is running on port 4000
- Check Socket.IO connection
- Verify STUN/TURN server config

## 📊 Performance

- **Lighthouse Score**: 90+ (target)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Avatar Frame Rate**: 60 FPS (target)

### Optimization Tips
- Use production build for deployment
- Enable compression (gzip/brotli)
- Lazy load routes with React.lazy
- Optimize GLB model size (<5MB recommended)

## 🚀 Deployment

### Build
```bash
npm run build
# Outputs to /dist directory
```

### Deploy to Vercel/Netlify
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

### Environment Variables
Create `.env` file:
```bash
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_OPENAI_API_KEY=your_key_here
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT

## 🙏 Credits

- **Avatar**: [Ready Player Me](https://readyplayer.me/)
- **3D Library**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- **Face Detection**: [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- **Icons**: [Lucide](https://lucide.dev/)

## 📧 Support

For issues or questions:
- Open a GitHub issue
- Contact: support@mindmeshplus.com
- Discord: [Join our community](https://discord.gg/mindmesh)

---

Built with ❤️ for mental health awareness
