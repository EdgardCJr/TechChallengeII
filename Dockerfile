#Node.js
FROM node:20

# Diretório de trabalho
WORKDIR /usr/src/app

#package.json e o package-lock.json
COPY package*.json ./

# Instale as dependências 
RUN npm install

# Copie o restante do código
COPY . .

# Exponha a porta que a aplicação irá rodar
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["node", "server.js"]