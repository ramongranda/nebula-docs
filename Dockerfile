## Multi-stage Dockerfile for Nebula Docs (Astro + Starlight)
# Build stage: Node to install deps and build the site
FROM node:18-alpine AS build

WORKDIR /app

# install pnpm (uses npm to install the CLI)
RUN npm install -g pnpm

# copy only manifest files first for better caching
COPY package.json pnpm-lock.yaml ./

# copy the rest
COPY . ./

# Build-time args (can be passed to `docker build`)
ARG NODE_ENV=production
ARG SHOW_REFERENCE=false

ENV NODE_ENV=${NODE_ENV}
ENV SHOW_REFERENCE=${SHOW_REFERENCE}

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Production image: nginx serving the built site
FROM nginx:stable-alpine

# Copy built site from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
