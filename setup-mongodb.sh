#!/bin/bash

echo "MongoDB Setup Script for Task Manager Application"
echo

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "Error: MongoDB is not installed or not in your PATH."
    echo "Please install MongoDB or make sure it's in your system PATH."
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p ./data/db

echo "Checking if MongoDB service is running..."
if ! mongo --eval "db.version()" localhost:27017 &> /dev/null; then
    echo "MongoDB is not running. Starting MongoDB service..."
    mongod --dbpath=./data/db --fork --logpath=./data/mongod.log
    echo "Waiting for MongoDB to start..."
    sleep 5
fi

echo "Creating MongoDB database and sample data..."
mongo setup-mongodb.js

echo
echo "MongoDB setup complete!"
echo "You can now run the application using one of these methods:"
echo
echo "1. Node.js: npm install && npm start"
echo "2. Docker Compose: docker-compose up -d"
echo "3. Kubernetes: Follow the instructions in README.md"
echo
echo "Access the application at: http://localhost:3000"
echo