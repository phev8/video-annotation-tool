FROM node:8.10 as builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run ng build --prod

FROM nginx:stable-alpine

COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /usr/src/app/dist /var/www/

COPY conf/entrypoint.sh /var/www/client

WORKDIR /var/www/client

EXPOSE 80

RUN ["chmod", "+x", "./entrypoint.sh"]

CMD ["/bin/sh", "-c", "./entrypoint.sh && exec nginx -g 'daemon off;'"]
