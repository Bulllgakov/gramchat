#!/bin/bash

# GramChat Docker Deployment Script
# This script deploys using Docker Compose on the production server

set -e

echo "GramChat Docker Deployment"
echo "=========================="

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found!${NC}"
    echo "Please create $ENV_FILE from .env.production.example"
    exit 1
fi

# Function to check service health
check_service() {
    local service=$1
    local port=$2
    echo -n "Checking $service... "
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        return 1
    fi
}

# Pull latest code
echo -e "${YELLOW}Pulling latest code...${NC}"
git pull origin main

# Build and start services
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose -f $COMPOSE_FILE run --rm backend npx prisma migrate deploy

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"
check_service "PostgreSQL" 5432
check_service "Redis" 6379
check_service "Backend API" 3000
check_service "Frontend" 5173

# Show running containers
echo -e "${YELLOW}Running containers:${NC}"
docker-compose -f $COMPOSE_FILE ps

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Services are running at:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: http://localhost:3000"
echo ""
echo "To view logs: docker-compose -f $COMPOSE_FILE logs -f [service_name]"
echo "To stop services: docker-compose -f $COMPOSE_FILE down"