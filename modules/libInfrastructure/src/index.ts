/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Coil
- Donovan Changfoot <donovan.changfoot@coil.com>

* Crosslake
- Pedro Sousa Barreto <pedrob@crosslaketech.com>

* ModusBox
- Miguel de Barros <miguel.debarros@modusbox.com>
- Roman Pietrzak <roman.pietrzak@modusbox.com>
*****/

'use strict'

export enum KafkaInfraTypes {
  NODE_KAFKA = 'node-kafka',
  NODE_KAFKA_STREAM = 'node-kafka-stream',
  KAFKAJS = 'kafkajs',
  NODE_RDKAFKA = 'node-rdkafka'
}

export enum RedisDuplicateInfraTypes {
  REDIS = 'redis',
  REDIS_SHARDED = 'redis-sharded',
  MEMORY = 'memory'
}

// Exports for Infrastructure
export * from './kafka_generic_consumer'
export * from './kafka_stream_consumer'
export * from './kafkajs_consumer'
export * from './kafka_generic_producer'
export * from './kafka_message_publisher'
export * from './kafkajs_consumer'
export * from './kafkajs_producer'
export * from './kafkajs_message_publisher'
export * from './rdkafka_consumer'
export * from './rdkafka_producer'
export * from './rdkafka_message_publisher'
export * from './imessage_consumer'
export * from './irun_handler'
export * from './api_server'
export * from './inmemory_duplicate_repo'
export * from './redis_duplicate_repo'
export * from './redis_duplicate_sharded_repo'
export * from './rdkafka_fetcher'
export * from './redis_messageoffset_repo'
export * from './eventsourcing_repo'
