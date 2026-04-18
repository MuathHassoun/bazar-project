FROM node:20-alpine

WORKDIR /app

COPY catalog/package*.json ./

RUN npm install

COPY catalog/ ./

EXPOSE 3001

CMD ["npm", "start"]
