# -------- BUILD STAGE --------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build Vite app
RUN npm run build


# -------- PRODUCTION STAGE --------
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy build files
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
