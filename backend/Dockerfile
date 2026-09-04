FROM node:26-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:26-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

RUN chown -R node:node /app
RUN mkdir -p /app/sessions && chown -R node:node /app/sessions
USER node

EXPOSE 5000

CMD ["npm", "start"]
