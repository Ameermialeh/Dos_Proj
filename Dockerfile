FROM node:14
WORKDIR  /app
COPY package*.json .


RUN npm install
# Expose the port the app runs on
COPY src/ . 
EXPOSE 8001

# Define the command to run your application
# CMD ["node", "apps.js"]