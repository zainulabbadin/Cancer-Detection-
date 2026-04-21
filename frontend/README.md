# CancerAI - Frontend (React.js)

Modern, responsive web UI for AI-powered cancer detection system.

## Features

✨ **Features**
- 🎨 Modern UI with Tailwind CSS
- 🔄 Real-time image upload & processing
- 📊 Detailed prediction results with confidence scores
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🌙 Dark mode support
- 🎬 Smooth animations and transitions
- 📜 Prediction history tracking
- 🎯 Professional medical theme
- ♿ Accessible components
- 🚀 Production-ready code

## Technology Stack

- **React 18** - UI framework
- **React Router v6** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Icons** - Icon library
- **React Hot Toast** - Notifications

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/           # Reusable components
│   │   ├── Navbar.js
│   │   ├── Footer.js
│   │   ├── HeroSection.js
│   │   ├── Features.js
│   │   ├── ImageUpload.js
│   │   └── ResultCard.js
│   ├── pages/               # Page components
│   │   ├── Home.js
│   │   ├── Detection.js
│   │   ├── About.js
│   │   └── Contact.js
│   ├── services/            # API calls
│   │   └── api.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 14+ installed
- npm or yarn package manager

### Steps

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file** (copy from .env.example)
```bash
cp .env.example .env
```

4. **Configure API endpoint** in `.env`
```
REACT_APP_API_URL=http://localhost:8000
```

5. **Start development server**
```bash
npm start
```

The application will open at `http://localhost:3000`

## Pages & Features

### 🏠 Home Page
- Hero section with CTA buttons
- Feature highlights
- Statistics dashboard
- Call-to-action for detection

### 🔬 Detection Page
- Drag & drop image upload
- Real-time image preview
- One-click prediction
- Detailed results with:
  - Primary cancer classification
  - Subtype classification
  - Confidence score with visual bar
- Prediction history sidebar
- Download & share options

### ℹ️ About Page
- Project overview
- Technology stack details
- Model performance metrics
- Dataset information
- Team & credentials

### 📧 Contact Page
- Contact form (name, email, subject, message)
- Direct contact information
- Email, phone, location
- Social media links

## API Integration

### Backend Endpoint Configuration

The frontend connects to the FastAPI backend:

```
POST /predict
```

**Request:**
```javascript
FormData {
  file: File
}
```

**Response:**
```json
{
  "main_class": "Malignant Cancer",
  "sub_class": "Adenocarcinoma",
  "confidence": 0.985
}
```

## Styling & Customization

### Color Scheme
- **Primary**: Blue (#0ea5e9)
- **Secondary**: Cyan (#06b6d4)
- **Dark Mode**: Slate (#1e293b)

### Tailwind Configuration
Edit `tailwind.config.js` to customize:
- Colors
- Fonts
- Animations
- Breakpoints

### Custom CSS
Global styles in `src/index.css`:
- Glassmorphism effects
- Custom animations
- Button styles
- Card styles

## Features in Detail

### Image Upload
- Drag & drop support
- Click to select
- File type validation
- Image preview
- Multiple image history

### Prediction Results
- Real-time processing indicator
- Color-coded confidence levels
- Progress bar visualization
- Medical disclaimer
- Download report button
- Share results option

### Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop enhancements
- Touch-friendly UI

### Dark Mode
- System preference detection
- Manual toggle in navbar
- Smooth transitions
- All components themed

## Environment Variables

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# Environment
REACT_APP_ENV=development
```

## Build & Deployment

### Build for Production
```bash
npm run build
```

Creates optimized production build in `build/` directory.

### Deploy to Vercel/Netlify
1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set environment variables
4. Deploy automatically on push

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Performance Optimization

- Code splitting with React Router
- Image optimization
- CSS minification via Tailwind
- Lazy loading components
- Production builds optimized

## Troubleshooting

### Port 3000 already in use
```bash
PORT=3001 npm start
```

### API connection issues
- Check `REACT_APP_API_URL` in `.env`
- Ensure backend is running on correct port
- Check CORS settings on backend

### Styling not applied
```bash
npm run build:css
```

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Part of CancerAI - AI Based Multi-Cancer Detection System

## Support

For issues, questions, or suggestions:
- Email: support@cancerai.com
- GitHub Issues: [Link]
- Documentation: [Link]

---

**Built with ❤️ for medical imaging AI**
