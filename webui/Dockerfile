# Step 1: Build the React application
FROM node:14 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package.json

# Install dependencies
RUN npm install

# Copy the local files to the container
COPY . .

# Declare an ARG for backend port
ARG DEVMATE_BACKEND_PORT

# Build the application, passing the backend URL as an environment variable
RUN REACT_APP_DEVMATE_BACKEND_PORT=${DEVMATE_BACKEND_PORT} npm run build

# Step 2: Serve the React application from Nginx
FROM nginx:alpine

# Copy the build output to replace the default Nginx contents
COPY --from=build /app/build /usr/share/nginx/html

# Remove the default Nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Add a new Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
