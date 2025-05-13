FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Ensure the public directory and its contents have correct permissions
RUN chmod -R 755 /app/public

EXPOSE 3000

CMD ["node", "server.js"] 