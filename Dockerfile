# syntax=docker/dockerfile:1
FROM node:24-alpine

ENV NODE_ENV=production \
    PORT=6789

WORKDIR /app

# Install production deps first so this layer is cached until package files change
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy only what the app needs, owned by the unprivileged user
COPY --chown=node:node index.js ./
COPY --chown=node:node src ./src

USER node

EXPOSE 6789
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:6789/health/check || exit 1

CMD ["node", "index.js"]
