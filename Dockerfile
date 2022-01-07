FROM node:16
MAINTAINER qPools Core Developers "contact@qpools.finance"

RUN apt-get update -y

# RUN mkdir -p /usr/src/app

# Copy the source code
COPY ./dapp-nextjs /app/dapp-nextjs
COPY ./qpools-sdk /app/qpools-sdk

RUN pwd

ENV HOME=/app
ENV PORT 3000

# Building app
# cd into the qpools-sdk, instlal dependencies, and compile it
WORKDIR $HOME/qpools-sdk/
RUN pwd
RUN npm install --include=dev
RUN npx tsc

WORKDIR $HOME/dapp-nextjs/
RUN pwd
RUN yarn

EXPOSE 3000

# Running the app
CMD "yarn" "dev"
