FROM node:18-alpine

# Install tzdata package for timezone data
RUN apk add --no-cache tzdata

# Set the timezone to Asia/Kolkata
RUN cp /usr/share/zoneinfo/Asia/Kolkata /etc/localtime && \
    echo "Asia/Kolkata" > /etc/timezone

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

COPY .next ./.next

CMD ["npm", "run", "dev"]
