FROM node:12.16.1-alpine as builder
WORKDIR /opt/poc

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool zlib-dev autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp

COPY package.json package-lock.json* tsconfig.json lerna.json /opt/poc/
COPY modules /opt/poc/modules

RUN npm ci

FROM node:12.16.1-alpine
WORKDIR /opt/poc

COPY --from=builder /opt/poc .

# copy source code in case there are changes
COPY modules/participants/src /opt/poc/modules/participants/src
COPY modules/transfers/src /opt/poc/modules/transfers/src
COPY modules/devtools/src /opt/poc/modules/devtools/src
COPY modules/ml-api-adapter/src /opt/poc/modules/ml-api-adapter/src

# run build
RUN npm run build

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

EXPOSE 3001
CMD ["npm", "run", "start"]
