# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install your application's dependencies
RUN npm install

# Bundle your app source
COPY ../src/order-server.js ./ 
COPY ../src/catalog-server.js ./ 
COPY ../src/frontend-server.js ./ 
COPY ../src/catalog.db ./
# Expose the port the app runs on
EXPOSE 8001

# Define the command to run your application
CMD ["node", "catalog-server.js"]
