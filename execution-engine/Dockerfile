FROM node:20-alpine
WORKDIR /app

COPY package.json bun.lock ./

RUN npm install -g bun
RUN bun install

COPY . .

# Compilar TypeScript
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]