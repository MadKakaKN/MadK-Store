# Stage 1: Build Frontend Assets
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Xóa trang mặc định của Nginx
RUN rm -rf ./*

# Copy build artifacts từ Stage 1
COPY --from=build /app/dist .

# Copy cấu hình Nginx SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
