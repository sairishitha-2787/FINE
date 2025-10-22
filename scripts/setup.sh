#!/bin/bash

# FINE Finance Intelligent Ecosystem Setup Script
# This script sets up the development environment for the FINE application

set -e

echo "🚀 Setting up FINE Finance Intelligent Ecosystem..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Installing Node.js 18..."
        # Install Node.js 18 using NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION is installed"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.9+ first."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 --version)
    print_success "$PYTHON_VERSION is installed"
}

# Create environment file
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        print_success "Created .env file from template"
        print_warning "Please update .env file with your configuration"
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Install backend dependencies
setup_backend() {
    print_status "Setting up backend dependencies..."
    cd server
    
    if [ ! -f package.json ]; then
        print_error "package.json not found in server directory"
        exit 1
    fi
    
    npm install
    print_success "Backend dependencies installed"
    cd ..
}

# Install frontend dependencies
setup_frontend() {
    print_status "Setting up frontend dependencies..."
    cd client
    
    if [ ! -f package.json ]; then
        print_error "package.json not found in client directory"
        exit 1
    fi
    
    npm install
    print_success "Frontend dependencies installed"
    cd ..
}

# Install ML service dependencies
setup_ml_service() {
    print_status "Setting up ML service dependencies..."
    cd ml_service
    
    if [ ! -f requirements.txt ]; then
        print_error "requirements.txt not found in ml_service directory"
        exit 1
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Created Python virtual environment"
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "ML service dependencies installed"
    deactivate
    cd ..
}

# Start databases
start_databases() {
    print_status "Starting databases..."
    docker-compose up -d mysql mongodb redis
    print_success "Databases started"
    
    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    sleep 10
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    cd server
    npm run migrate
    print_success "Database migrations completed"
    cd ..
}

# Seed database
seed_database() {
    print_status "Seeding database..."
    cd server
    npm run seed
    print_success "Database seeded"
    cd ..
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    docker-compose build
    print_success "Docker images built"
}

# Main setup function
main() {
    echo "🎯 Starting FINE Finance Intelligent Ecosystem setup..."
    echo "=================================================="
    
    # Check prerequisites
    check_docker
    check_node
    check_python
    
    # Setup environment
    setup_environment
    
    # Install dependencies
    setup_backend
    setup_frontend
    setup_ml_service
    
    # Start databases
    start_databases
    
    # Run migrations and seed
    run_migrations
    seed_database
    
    # Build Docker images
    build_images
    
    echo "=================================================="
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update .env file with your configuration"
    echo "2. Start the application: docker-compose up -d"
    echo "3. Access the application at http://localhost:3000"
    echo ""
    echo "🔧 Development commands:"
    echo "- Start development: npm run dev"
    echo "- View logs: docker-compose logs -f"
    echo "- Stop services: docker-compose down"
    echo ""
    echo "📚 Documentation: README.md"
    echo "🐛 Issues: Check the issues section in the repository"
}

# Run main function
main "$@"
