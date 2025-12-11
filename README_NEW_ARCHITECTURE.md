# AI-Powered Therapeutic Education Platform - New Architecture

## Overview

The platform has been successfully migrated from Supabase to a local, self-hosted architecture. This provides greater control over data, infrastructure, and AI capabilities.

### Architecture (Local/Self-hosted)
- **PostgreSQL 15+** - Self-hosted database
- **Node.js/Express Backend** - RESTful API with JWT authentication
- **Python/FastAPI AI Service** - Dedicated microservice for AI engines
- **React Frontend** - Updated to connect to local backend
- **Docker Compose** - Complete containerized development environment

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Axios for API communication
- Socket.io client for real-time features

### Backend API (Node.js)
- Express.js web framework
- PostgreSQL with pg driver
- JWT for authentication
- bcrypt for password hashing
- Socket.io for WebSocket connections
- express-validator for input validation

### AI Service (Python)
- FastAPI framework
- NumPy, Pandas for data processing
- TensorFlow for deep learning
- PyTorch for neural networks
- Transformers (Hugging Face) for NLP
- OpenCV for computer vision
- Librosa for audio processing

### Database
- PostgreSQL 15+ with extensions:
  - uuid-ossp for UUID generation
  - pgcrypto for encryption

## Project Structure

```
project/
├── backend/               # Node.js Express API
│   ├── src/
│   │   ├── config/       # Database and configuration
│   │   ├── middleware/   # Auth and validation middleware
│   │   ├── routes/       # API route handlers
│   │   └── server.js     # Main server file
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── ai-service/           # Python AI microservice
│   ├── api/
│   │   └── routes/      # AI endpoint handlers
│   ├── engines/         # 10 AI engine implementations
│   ├── main.py          # FastAPI application
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── database/
│   └── init.sql         # Database schema and migrations
├── src/                 # React frontend
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   │   └── api.ts       # API client
│   └── pages/
├── docker-compose.yml   # Complete stack orchestration
└── SETUP.md            # Detailed setup instructions
```

## Key Features

### 10 AI Engines

1. **Speech Analysis Engine** (`/api/speech/analyze`)
   - Pronunciation assessment
   - Clarity and fluency scoring
   - Problematic sound detection
   - Speech transcription

2. **Behavior Recognition Engine** (`/api/behavior/analyze`)
   - Activity detection
   - Attention span tracking
   - Social interaction scoring
   - Behavioral pattern recognition

3. **Emotion Detection Engine** (`/api/emotion/detect`)
   - Facial expression analysis
   - Primary emotion classification
   - Stress level measurement
   - Engagement tracking

4. **Progress Prediction Engine** (`/api/progress/predict`)
   - Development trajectory forecasting
   - Goal achievement probability
   - Timeline estimation
   - Intervention recommendations

5. **Auto-IEP Engine** (`/api/iep/generate`)
   - Automated IEP generation
   - Goal setting based on assessments
   - Accommodation recommendations
   - Review schedule planning

6. **Adaptive Learning Engine** (`/api/adaptive/adjust`)
   - Content difficulty adjustment
   - Learning style identification
   - Personalized curriculum
   - Optimal pacing determination

7. **Risk Detection Engine** (`/api/risk/detect`)
   - Early warning identification
   - Risk level assessment
   - Intervention prioritization
   - Continuous monitoring

8. **Recommendation Engine** (`/api/recommendations/generate`)
   - Activity suggestions
   - Intervention planning
   - Resource recommendations
   - Daily schedule creation

9. **Pattern Recognition Engine** (`/api/patterns/analyze`)
   - Trend identification
   - Correlation analysis
   - Anomaly detection
   - Insight generation

10. **Data Quality Engine** (Planned)
    - Data validation
    - Quality scoring
    - Completeness checking
    - Consistency verification

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (Parent, Therapist, School Admin, System Admin)
- Secure password hashing with bcrypt
- Token expiration and refresh

### Real-time Features

- WebSocket connections via Socket.io
- Real-time messaging between users
- Live progress updates
- Session notifications

### Database Security

- Row-level data isolation
- Role-based query filtering
- Encrypted sensitive data
- Audit logging capabilities

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Get current user profile

### Students
- `GET /api/students` - List accessible students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Create student (therapist only)
- `PUT /api/students/:id` - Update student

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Schedule session
- `PUT /api/sessions/:id` - Update session

### AI Analysis
- `POST /api/ai/analyze-speech` - Speech analysis
- `POST /api/ai/analyze-behavior` - Behavior analysis
- `POST /api/ai/detect-emotion` - Emotion detection
- `POST /api/ai/predict-progress` - Progress prediction
- `POST /api/ai/generate-iep` - Auto-generate IEP
- `GET /api/ai/results/:studentId` - Get analysis results

## Quick Start

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Services will be available at:
# - PostgreSQL: localhost:5432
# - Backend API: localhost:3000
# - AI Service: localhost:8000
# - Frontend: localhost:5173 (run separately: npm run dev)
```

### Manual Setup

See `SETUP.md` for detailed manual installation instructions.

## Environment Variables

### Backend
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/therapy_platform
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://ai-service:8000
FRONTEND_URL=http://localhost:5173
```

### AI Service
```env
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/therapy_platform
MODEL_CACHE_DIR=./models
PYTHONUNBUFFERED=1
```

### Frontend
```env
VITE_API_URL=http://localhost:3000
```

## Migration from Supabase

If you have existing Supabase data:

1. Export data from Supabase tables
2. Import into local PostgreSQL using provided scripts
3. Update environment variables
4. Users will need to reset passwords (passwords are not exportable)

## Development Workflow

1. Start Docker services: `docker-compose up`
2. Make changes to code
3. Backend auto-reloads on save
4. AI service auto-reloads on save
5. Frontend hot-reloads on save
6. Test changes locally
7. Build for production: `npm run build`

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### AI Service Tests
```bash
cd ai-service
pytest
```

### Frontend Tests
```bash
npm test
```

## Deployment Considerations

### Production Checklist
- [ ] Change JWT_SECRET to secure random value
- [ ] Update database credentials
- [ ] Enable SSL for database connections
- [ ] Set up HTTPS with SSL certificates
- [ ] Configure CORS for production domains
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Review and harden security settings

### Scaling Options
- Horizontal scaling of backend API servers
- Separate AI service to dedicated GPU servers
- Database read replicas for reporting
- Redis cache for frequently accessed data
- Load balancer for traffic distribution
- CDN for static assets

## AI Model Enhancement

The current AI engines use placeholder logic. To add real ML capabilities:

1. **Speech Analysis**: Integrate with speech recognition APIs (Google Cloud Speech, Azure Speech)
2. **Behavior Recognition**: Train custom computer vision models with TensorFlow/PyTorch
3. **Emotion Detection**: Use pre-trained facial recognition models (DeepFace, FaceNet)
4. **Progress Prediction**: Build time-series forecasting models with historical data
5. **Auto-IEP**: Implement NLP-based text generation (GPT, BERT)

## Security Best Practices

- All passwords are hashed with bcrypt (salt rounds: 10)
- JWT tokens expire after 7 days
- Database uses row-level filtering for data isolation
- API validates all inputs with express-validator
- CORS configured for specific origins
- No sensitive data logged
- Environment variables for all secrets

## Troubleshooting

See `SETUP.md` for common issues and solutions.

## Support & Documentation

- `README.md` - Original project overview
- `SETUP.md` - Detailed setup instructions
- `TECHNICAL_ARCHITECTURE.md` - System architecture details
- API Documentation: http://localhost:8000/docs (FastAPI auto-generated)

## License

Proprietary - All rights reserved

## Contributors

This architecture migration provides a solid foundation for:
- Complete control over infrastructure
- Custom AI model integration
- Enhanced security and compliance
- Scalable microservices architecture
- Real-time collaborative features
- Advanced analytics and reporting

The platform is now ready for further development and production deployment.
