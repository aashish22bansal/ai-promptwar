# Stage 1: Build the Vite frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy project files
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Setup the Express production server
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the built frontend from stage 1
COPY --from=builder /app/dist ./dist

# Copy the server file
COPY server.js .

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
