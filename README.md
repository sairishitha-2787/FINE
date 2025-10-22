# FINE: Finance Intelligent Ecosystem

A comprehensive full-stack financial management application with AI-powered emotional insights, built with React.js, Node.js, and Python FastAPI.

## 🚀 Features

### Core Functionality
- **Interactive Dashboard** with real-time financial overview
- **Transaction Management** with mood tracking and categorization
- **AI-Powered Insights** using machine learning for spending patterns
- **Emotional Intelligence** integration for better financial decisions
- **Goal Setting & Tracking** with progress visualization
- **Budget Management** with smart recommendations

### Technical Features
- **Responsive Design** with TailwindCSS and Framer Motion
- **Real-time Animations** and micro-interactions
- **Adaptive Theming** based on user mood
- **Offline Support** with service workers
- **Progressive Web App** capabilities
- **Multi-database Architecture** (MySQL + MongoDB)
- **Redis Caching** for optimal performance
- **Docker Containerization** for easy deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   ML Service    │
│   (React.js)    │◄──►│   (Node.js)     │◄──►│   (FastAPI)     │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   MySQL         │    │   MongoDB       │
│   (Reverse      │    │   (Relational   │    │   (Document     │
│   Proxy)        │    │   Data)         │    │   Store)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Redis         │
                       │   (Cache)       │
                       └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React.js 18** - Modern React with hooks and context
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Chart.js** - Data visualization
- **Lottie** - Vector animations
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens
- **MySQL2** - MySQL database driver
- **Mongoose** - MongoDB object modeling
- **Redis** - In-memory data store

### ML Service
- **Python 3.9+** - Programming language
- **FastAPI** - Modern web framework
- **scikit-learn** - Machine learning library
- **NLTK** - Natural language processing
- **spaCy** - Advanced NLP
- **pandas** - Data manipulation
- **numpy** - Numerical computing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer
- **MySQL 8.0** - Relational database
- **MongoDB 7.0** - Document database
- **Redis 7.2** - In-memory cache

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for ML service development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fine-finance-intelligent-ecosystem
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - ML Service: http://localhost:8000
   - Nginx (Production): http://localhost:80

### Development Setup

1. **Backend Development**
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Frontend Development**
   ```bash
   cd client
   npm install
   npm start
   ```

3. **ML Service Development**
   ```bash
   cd ml_service
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## 📁 Project Structure

```
fine-finance-intelligent-ecosystem/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── Dockerfile         # Frontend container
├── server/                # Node.js backend
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── middleware/        # Express middleware
│   ├── config/            # Configuration files
│   └── Dockerfile         # Backend container
├── ml_service/            # Python ML service
│   ├── services/          # ML services
│   ├── models/            # ML models
│   ├── utils/             # Utility functions
│   └── Dockerfile         # ML service container
├── database/              # Database schemas
│   ├── mysql/             # MySQL schemas
│   └── mongodb/           # MongoDB schemas
├── nginx/                 # Nginx configuration
├── docker-compose.yml     # Docker orchestration
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

```bash
# Database
MYSQL_ROOT_PASSWORD=your_mysql_password
MONGODB_URI=mongodb://user:pass@localhost:27017/dbname

# Authentication
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id

# Services
ML_SERVICE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379
```

### Database Setup

The application uses two databases:
- **MySQL**: For relational data (users, transactions, budgets)
- **MongoDB**: For flexible data (mood logs, insights, ML data)

Database schemas are automatically created on first run.

## 🎨 UI/UX Features

### Design System
- **Adaptive Colors**: Theme changes based on user mood
- **Micro-interactions**: Smooth animations and transitions
- **Responsive Design**: Works on all device sizes
- **Accessibility**: WCAG 2.1 compliant

### Components
- **Mood Picker**: Interactive emoji-based mood selection
- **Animated Charts**: Real-time data visualization
- **Confetti Effects**: Celebration animations
- **Loading States**: Engaging loading animations

## 🤖 AI Features

### Emotional Insight Agent
- **Mood Analysis**: Tracks emotional patterns
- **Spending Correlation**: Links emotions to spending
- **Predictive Analytics**: Forecasts financial trends
- **Personalized Recommendations**: AI-driven suggestions

### Machine Learning Models
- **Sentiment Analysis**: NLP for mood detection
- **Clustering**: User segmentation
- **Forecasting**: Time-series prediction
- **Recommendation Engine**: Personalized suggestions

## 🚀 Deployment

### Production Deployment

1. **Build for production**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Set up SSL certificates**
   ```bash
   # Place SSL certificates in nginx/ssl/
   cp your-cert.pem nginx/ssl/cert.pem
   cp your-key.pem nginx/ssl/key.pem
   ```

3. **Configure domain**
   ```bash
   # Update nginx/nginx.conf with your domain
   server_name your-domain.com;
   ```

### Environment-specific Configurations

- **Development**: Hot reload, debug mode, local databases
- **Staging**: Production-like environment for testing
- **Production**: Optimized builds, SSL, monitoring

## 📊 Monitoring & Analytics

### Health Checks
- All services include health check endpoints
- Docker health checks for container monitoring
- Database connection monitoring

### Logging
- Structured logging with Winston (Node.js)
- Python logging for ML service
- Nginx access and error logs

### Performance Monitoring
- Redis caching for improved performance
- Database query optimization
- Frontend performance optimization

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication
- OAuth integration (Google)
- Role-based access control
- Password hashing with bcrypt

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting

### Infrastructure Security
- Docker security best practices
- Non-root containers
- Network isolation
- SSL/TLS encryption

## 🧪 Testing

### Test Structure
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# ML service tests
cd ml_service
pytest
```

### Test Coverage
- Unit tests for all components
- Integration tests for API endpoints
- End-to-end tests for user flows
- ML model validation tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write comprehensive tests
- Update documentation
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- API documentation: `/api/docs`
- Component documentation: `/docs/components`
- ML service documentation: `/ml/docs`

### Getting Help
- Check the issues section for common problems
- Create a new issue for bugs or feature requests
- Join our community discussions

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Investment tracking
- [ ] Bill reminders
- [ ] Expense categorization AI
- [ ] Multi-currency support
- [ ] Team/family accounts
- [ ] Integration with banks

### Performance Improvements
- [ ] GraphQL API
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Advanced caching strategies
- [ ] CDN integration

---

**FINE: Finance Intelligent Ecosystem** - Making financial management intelligent, emotional, and accessible. 💰✨
