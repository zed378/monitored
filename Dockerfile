FROM node:25-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./

# Install only production deps
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=6789

# Expose port
EXPOSE 6789

# Run app
CMD ["node", "index.js"]