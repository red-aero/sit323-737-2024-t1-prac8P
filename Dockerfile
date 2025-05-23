FROM node:18-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Ensure the public directory and its contents have correct permissions
RUN chmod -R 755 /app/public

# Expose the port the app runs on
EXPOSE 8080

# Define environment variable for GCP
ENV PORT=8080

# Start the application
CMD ["node", "server.js"]