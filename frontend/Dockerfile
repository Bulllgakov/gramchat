# Frontend Dockerfile
  FROM node:20-alpine AS builder

  WORKDIR /app

  # Set environment variable for build
  ENV VITE_API_URL=https://api.gramchat.ru

  # Copy package files
  COPY package*.json ./

  # Install dependencies
  RUN npm ci

  # Copy source code
  COPY . .

  # Build application
  RUN npm run build

  # Production stage with nginx
  FROM nginx:alpine

  # Copy nginx configuration
  COPY nginx.conf /etc/nginx/conf.d/default.conf

  # Copy built application
  COPY --from=builder /app/dist /usr/share/nginx/html

  # Expose port
  EXPOSE 80

  # Start nginx
  CMD ["nginx", "-g", "daemon off;"]
