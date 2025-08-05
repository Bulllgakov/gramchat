
#!/bin/bash



echo "🚀 Starting GramChat development environment..."



# Start Docker services

echo "📦 Starting Docker services..."

docker-compose up -d



# Wait for services to be ready

echo "⏳ Waiting for services to be ready..."

sleep 5



# Run database migrations

echo "🗄️ Running database migrations..."

cd backend

npm run prisma:migrate



# Start backend

echo "🔧 Starting backend..."

npm run dev &



# Start frontend

echo "🎨 Starting frontend..."

cd ../frontend

npm run dev &



echo "✅ GramChat is running!"

echo "📍 Frontend: http://localhost:5173"

echo "📍 Backend: http://localhost:3000"

echo "📍 Database: http://localhost:5432"



# Wait for user input

echo ""

echo "Press Ctrl+C to stop all services"

wait

