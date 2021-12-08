FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production --silent

COPY . .

CMD [ "npm", "start" ]