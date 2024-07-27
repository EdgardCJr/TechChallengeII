#Node.js
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /usr/app

#package.json e o package-lock.json
COPY package*.json ./

# Instale as dependências 
RUN npm install

# Copie o restante do código
COPY . .

# variáveis de ambiente MONGO_URL
ARG MONGO_URL
ARG SESSION_SECRET

ENV MONGO_URL=$MONGO_URL
ENV SESSION_SECRET=$SESSION_SECRET

RUN echo "MONGO_URL=$MONGO_URL" > .env
RUN echo "SESSION_SECRET=ServerTeste1" > .env

RUN npm i -g pnpm

RUN pnpm build

# Exponha a porta que a aplicação irá rodar
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["node", "server.js"]