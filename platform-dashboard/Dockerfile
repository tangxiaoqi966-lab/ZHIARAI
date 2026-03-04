
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Set non-root user for security
RUN chown -R node:node /app
# USER node  # Temporarily disabled to avoid permission issues

EXPOSE 3000

CMD ["npm", "start"]
