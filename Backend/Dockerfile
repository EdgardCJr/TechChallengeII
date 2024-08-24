FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ARG MONGO_URL
ARG JWT_SECRET

ENV MONGO_URL=$MONGO_URL
ENV JWT_SECRET=$JWT_SECRET

RUN npm run build

CMD ["npm", "start"]
