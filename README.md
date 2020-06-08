# poc-architecture

Proof of Concept for Scalability Architecture Stream

## Objectives

TBD

## Setup

Ensure you have the following Pre-requisite tools installed: 
- [Docker](https://docs.docker.com/get-docker/)
- [kafkacat](https://github.com/edenhill/kafkacat#install)
- NodeJs - v12.16.0
- Nvm
- Npm

This project uses [Lerna](https://lerna.js.org/) to manage packages and their respective dependencies. All individual modules (i.e. packages in Lerna speak) are their own respective micro-service/library which uses standard NPM for management, lerna will inject the dependencies when running NPM install at the root-level of the project.

```sh
npm install
```

You can build all the packages by running

```sh
npm run build
```

**Note:** Lerna will manage project dependencies and build order based on each package's `package.json`.

## Running

### Kafka

```sh
npm run docker:kafka:start
```
### Redis

```sh
npm run docker:kafka:start
```

### Participant Handlers

```sh
npm run start:participants
```

### Transfer Handlers

```sh
npm run start:transfers
```

## Todo

1. Handle currencies with something that can handle arbitrary precision (or at a minimum big numbers, etc)
2. Prometheus Metric Instrumentation
3. ...

## Known Issues

1. `@typescript-eslint/no-misused-promises` lint issue disabled on several places, e.g. [kafka_generic_producer.ts](./modules/libInfrastructure/src/kafka_generic_producer.ts)
