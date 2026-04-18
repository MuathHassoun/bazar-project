FROM node:20-alpine

WORKDIR /app

COPY order/package*.json ./

RUN npm install

COPY order/ ./

EXPOSE 3002

CMD ["npm", "start"]
