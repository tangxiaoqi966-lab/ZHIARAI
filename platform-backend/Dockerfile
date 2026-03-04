
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create non-root user and set permissions
RUN chown -R node:node /app
# USER node  # Temporarily disabled for Docker socket access

EXPOSE 3001

CMD ["node", "index.js"]
