FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
RUN npm run build

FROM node:20-alpine
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ .
COPY --from=client-build /app/client/dist /app/client/dist
EXPOSE 3001
CMD ["npm", "start"]
