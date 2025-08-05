#!/bin/bash

echo "Fixing frontend dependencies and styles..."

cd frontend

# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Install dependencies
npm install

echo "Frontend dependencies fixed. Please run 'npm run dev' in the frontend directory to start the development server."