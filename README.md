# poc-architecture

Proof of Concept for Scalability Architecture Stream

## Objectives

TBD

## Setup

### Pre-requisites
Ensure you have the following Pre-requisite tools installed:
- [Docker](https://docs.docker.com/get-docker/)
- [kafkacat](https://github.com/edenhill/kafkacat#install)
- NodeJs - v12.16.0
- Nvm
- Npm

### Install
If you are running on MacOS, you may need to [export the following environmental variables to build node-rdkafka](https://github.com/Blizzard/node-rdkafka#mac-os-high-sierra--mojave) (required by ml-api-adapter & central-services-stream):

```bash
export CPPFLAGS=-I/usr/local/opt/openssl/include
export LDFLAGS=-L/usr/local/opt/openssl/lib
```

This project uses [Lerna](https://lerna.js.org/) to manage packages and their respective dependencies. All individual modules (i.e. packages in Lerna speak) are their own respective micro-service/library which uses standard NPM for management, lerna will inject the dependencies when running NPM install at the root-level of the project.

**Note:** Lerna will manage project dependencies and build order based on each package's `package.json`.

```sh
npm install
```

### Build
You can build all the packages by running

```sh
npm run build
```

### Local DNS for local test/development

Add the following line to your `/etc/hosts` file:

`127.0.0.1  simulator`


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

#### Participant TODO

1. Add Validation to Events - (don't need it for now)
2. Add Validation to Commands - [#1435](https://github.com/mojaloop/project/issues/1435)
4. Add support for `thresholdAlarmPercentage` to limits, and implementation on position changes for `reserve` (prepare) and `commit` (fulfil)
5. Parallelize Validations for FSP-checks
6. ...
7. Unhappy Paths Scenarios
    - Validation failures on incoming Events/Commands
    - un-reserve position for PayerFSP on Rejection/Abort from PayeeFSP
    - un-reserve position for PayerFSP on timeouts
    - ...

### Transfer Handlers

```sh
npm run start:transfers
```

#### Transfers TODO

1. Add Validation to Events - (don't need it for now)
2. Add Validation to Commands - [#1435](https://github.com/mojaloop/project/issues/1435)
3. Optional config flag to support disabling On-Us transfers (currently support both On-Us and Off-Us unlike the As-Is switch implementation)
4. ...
5. Unhappy Paths Scenarios
    - Validation failures on incoming Events/Commands
    - Validation of expiration date on fulfils
    - Duplicate Checks for Prepare leg (support GET operations?)
    - Duplicate Checks for Fulfil leg (support GET operations?)
    - Rejection/Abort from PayeeFSP
    - Rejection/Abort on timeouts
    - ...


## General TODO

1. ~~Handle currencies with something that can handle arbitrary precision (or at a minimum big numbers, etc)~~
2. ~~Prometheus Metric Instrumentation & Dashboards - [#1417](https://github.com/mojaloop/project/issues/1417)~~
3. ~~Tracing Support - [#1417](https://github.com/mojaloop/project/issues/1417)~~
4. Helm charts for deployment [#1434](https://github.com/mojaloop/project/issues/1434)
5. Add support for currency specific ISO precision validations (validation as part of transfer handler or perhaps commands/events?)
6. Non-inflight Long-term Persistent Storage for Reporting (contains full history of transfers, transfer-state-changes, position-state-changes, participants, etc)
7. Assign completed transfers to a Settlement Window
8. Make sure all interfaces start with an 'I' and types start with 'T'
9. Maybe?? Move the aggregate load logic to the base class (not throwing), so the higher level implementation can start by verifying if the rootEntity exists and checking for consistency
10. Implement log guards on methods, to avoid parameter expansion (that respects LOG_LEVEL)

## Known Issues

1. `@typescript-eslint/no-misused-promises` lint issue disabled on several places, e.g. [kafka_generic_producer.ts](./modules/libInfrastructure/src/kafka_generic_producer.ts)
