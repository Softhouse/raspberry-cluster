# FROM node:13.1.0-alpine
FROM arm32v7/node:13.1.0-alpine
ADD . /app
WORKDIR /app
RUN yarn install
EXPOSE 3000
CMD [ "node", "index.js" ]