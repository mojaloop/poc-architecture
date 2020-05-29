# poc-architecture
Proof of Concept for Scalability Architecture Stream


## Setup

This project uses [Lerna](https://lerna.js.org/) to manage packages and their respective dependencies. All individual modules (i.e. packages in Lerna speak) are their own respective micro-service/library which uses standard NPM for management, lerna will inject the dependencies when running NPM install at the root-level of the project.

```sh
npm install
```

You can build all the packages by running

```sh
npm run build
```

**Note:** Learn will manage project dependencies and build order based on each package's `package.json`.

## Running

### Participants

```sh
npm run start:participants
```

### Transfers

```sh
npm run start:transfers
```

## Todo

...

## Known Issues

1. `@typescript-eslint/no-misused-promises` lint issue disabled on severak places, e.g. [kafka_generic_producer.ts](./modules/libInfrastructure/src/kafka_generic_producer.ts)
