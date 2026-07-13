# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Build tools for native modules (argon2).
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev

# ---- Runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY package.json ./

# Writable dir for KYC / file uploads.
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "dist/main"]
