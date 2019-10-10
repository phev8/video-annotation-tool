FROM node:10.15.3

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:prod" ]

EXPOSE 3000
