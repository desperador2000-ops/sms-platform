# Builder image for the backend
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package-lock.json* ./packages/backend/

# Install top-level deps if monorepo uses them; otherwise install in packages/backend
RUN apk add --no-cache python3 g++ make
COPY . .
RUN cd packages/backend && npm ci --production=false && npm run build

# Production image
FROM node:18-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PORT=4000

# Copy built files
COPY --from=builder /usr/src/app/packages/backend/dist ./dist
COPY packages/backend/package.json ./package.json
COPY packages/backend/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "dist/main.js"]
