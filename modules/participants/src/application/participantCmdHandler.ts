/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Coil
 - Donovan Changfoot <donovan.changfoot@coil.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Roman Pietrzak <roman.pietrzak@modusbox.com>

 --------------
******/

'use strict'
// import { v4 as uuidv4 } from 'uuid'
import { CommandMsg, IDomainMessage, ILogger, IMessagePublisher } from '@mojaloop-poc/lib-domain'
import { ParticipantsTopics } from '@mojaloop-poc/lib-public-messages'
import {
  EnumOffset,
  IRunHandler,
  KafkaInfraTypes,
  KafkaMessagePublisher,
  MessageConsumer,
  // node-kafka imports
  KafkaGenericConsumer, KafkaGenericConsumerOptions, KafkaGenericProducerOptions, KafkaNodeCompressionTypes,
  // node-kafka-stream imports
  KafkaStreamConsumerOptions, KafkaStreamConsumer,
  // kafkajs imports
  KafkaJsCompressionTypes, KafkaJsConsumer, KafkaJsConsumerOptions, KafkajsMessagePublisher, KafkaJsProducerOptions,
  // rdkafka imports
  RDKafkaCompressionTypes, RDKafkaProducerOptions, RDKafkaMessagePublisher, RDKafkaConsumerOptions, RDKafkaConsumer
} from '@mojaloop-poc/lib-infrastructure'
import { ParticpantsAgg } from '../domain/participants_agg'
import { ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { CreateParticipantCmd } from '../messages/create_participant_cmd'
import { CommitPayeeFundsCmd } from '../messages/commit_payee_funds_cmd'
import { IParticipantRepo } from '../domain/participant_repo'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { RepoInfraTypes } from '../infrastructure'
import { InMemoryParticipantStateRepo } from '../infrastructure/inmemory_participant_repo'
import { RedisParticipantStateRepo } from '../infrastructure/redis_participant_repo'
import { CachedRedisParticipantStateRepo } from '../infrastructure/cachedredis_participant_repo'

export class ParticipantCmdHandler implements IRunHandler {
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher
  private _repo: IParticipantRepo

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    logger.info(`ParticipantCmdHandler::start - appConfig=${JSON.stringify(appConfig)}`)
    let repo: IParticipantRepo

    logger.info(`ParticipantCmdHandler - Creating repo of type ${appConfig.repo.type as string}`)
    switch (appConfig.repo.type) {
      case RepoInfraTypes.REDIS: {
        repo = new RedisParticipantStateRepo(appConfig.redis.host, logger)
        break
      }
      case RepoInfraTypes.CACHEDREDIS: {
        repo = new CachedRedisParticipantStateRepo(appConfig.redis.host, logger)
        break
      }
      default: { // defaulting to In-Memory
        repo = new InMemoryParticipantStateRepo()
      }
    }
    // const repo: IEntityStateRepository<ParticipantState> = new InMemoryParticipantStateRepo();
    // const repo: IParticipantRepo = new RedisParticipantStateRepo(appConfig.redis.host, logger)
    logger.info(`ParticipantCmdHandler - Created repo of type ${repo.constructor.name}`)

    this._repo = repo
    await repo.init()

    let kafkaMsgPublisher: IMessagePublisher | undefined

    logger.info(`ParticipantCmdHandler - Creating ${appConfig.kafka.producer as string} participantCmdHandler.kafkaMsgPublisher...`)
    let clientId = `participantCmdHandler-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.producer) {
      case (KafkaInfraTypes.NODE_KAFKA_STREAM):
      case (KafkaInfraTypes.NODE_KAFKA): {
        const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
          client: {
            kafka: {
              kafkaHost: appConfig.kafka.host,
              clientId
            },
            compression: appConfig.kafka.gzipCompression === true ? KafkaNodeCompressionTypes.GZIP : KafkaNodeCompressionTypes.None
          }
        }
        kafkaMsgPublisher = new KafkaMessagePublisher(
          kafkaGenericProducerOptions,
          logger
        )
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsProducerOptions: KafkaJsProducerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: [appConfig.kafka.host],
              clientId
            },
            producer: { // https://kafka.js.org/docs/producing#options
              allowAutoTopicCreation: true,
              transactionTimeout: 60000
            },
            compression: appConfig.kafka.gzipCompression === true ? KafkaJsCompressionTypes.GZIP : KafkaJsCompressionTypes.None
          }
        }
        kafkaMsgPublisher = new KafkajsMessagePublisher(
          kafkaJsProducerOptions,
          logger
        )
        break
      }
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaProducerOptions: RDKafkaProducerOptions = {
          client: {
            producerConfig: {
              'metadata.broker.list': appConfig.kafka.host,
              dr_cb: true,
              'client.id': clientId,
              'socket.keepalive.enable': true,
              'compression.codec': appConfig.kafka.gzipCompression === true ? RDKafkaCompressionTypes.GZIP : RDKafkaCompressionTypes.NONE
            },
            topicConfig: {
              // partitioner: RDKafkaPartioner.MURMUR2_RANDOM // default java algorithm, seems to have worse random distribution for hashing than rdkafka's default
            }
          }
        }
        kafkaMsgPublisher = new RDKafkaMessagePublisher(
          rdKafkaProducerOptions,
          logger
        )
        break
      }
      default: {
        logger.warn('ParticipantCmdConsumer - Unable to find a Kafka Producer implementation!')
        throw new Error('participantCmdHandler.kafkaMsgPublisher was not created!')
      }
    }
    logger.info(`ParticipantCmdHandler - Created kafkaMsgPublisher of type ${kafkaMsgPublisher.constructor.name}`)

    await kafkaMsgPublisher.init()

    const agg: ParticpantsAgg = new ParticpantsAgg(repo, kafkaMsgPublisher, logger)

    // ## Local Test
    // // const payerId: string = '47fca31d-6784-4ac2-afd2-03af341df7e1' // Use this to validate duplicate insert logic for participants
    // const payerId: string = uuidv4() // Use this to create a new participant record

    // const transferId: string = uuidv4()

    // const createParticipantCmd: CreateParticipantCmd = new CreateParticipantCmd({
    //   id: payerId,
    //   name: 'participant 1',
    //   limit: 1000,
    //   initialPosition: 100
    // })
    // await agg.processCommand(createParticipantCmd)

    // const reserveCmd: ReservePayerFundsCmd = new ReservePayerFundsCmd({
    //   payerId,
    //   transferId: transferId,
    //   amount: 50
    // })
    // await agg.processCommand(reserveCmd)

    const histoParticipantCmdHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'participantCmdHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for participantCmdHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    // ## Setup participantCmdConsumer
    const participantCmdHandler = async (message: IDomainMessage): Promise<void> => {
      const histTimer = histoParticipantCmdHandlerMetric.startTimer()
      const evtname = message.msgName ?? 'unknown'
      try {
        logger.info(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
        let participantCmd: CommandMsg | undefined
        // # Transform messages into correct Command
        switch (message.msgName) {
          case CreateParticipantCmd.name: {
            participantCmd = CreateParticipantCmd.fromIDomainMessage(message)
            break
          }
          case ReservePayerFundsCmd.name: {
            participantCmd = ReservePayerFundsCmd.fromIDomainMessage(message)
            break
          }
          case CommitPayeeFundsCmd.name: {
            participantCmd = CommitPayeeFundsCmd.fromIDomainMessage(message)
            break
          }
          default: {
            logger.warn(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
            break
          }
        }
        let processCommandResult: boolean = false
        if (participantCmd != null) {
          processCommandResult = await agg.processCommand(participantCmd)
        } else {
          logger.warn(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Unable to process event`)
        }
        logger.info(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: ${processCommandResult.toString()}`)
        histTimer({ success: 'true', evtname })
      } catch (err) {
        const errMsg: string = err?.message?.toString()
        logger.info(`ParticipantCmdConsumer - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
        logger.error(err)
        histTimer({ success: 'false', error: err.message, evtname })
      }
    }

    this._publisher = kafkaMsgPublisher
    let participantCmdConsumer: MessageConsumer | undefined

    logger.info(`ParticipantCmdConsumer - Creating ${appConfig.kafka.consumer as string} participantCmdConsumer...`)
    clientId = `participantCmdConsumer-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const participantCmdConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: clientId,
            groupId: 'participantCmdGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [ParticipantsTopics.Commands]
        }
        participantCmdConsumer = new KafkaGenericConsumer(participantCmdConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.NODE_KAFKA_STREAM): {
        const participantCmdConsumerOptions: KafkaStreamConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: clientId,
            groupId: 'participantCmdGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [ParticipantsTopics.Commands]
        }
        participantCmdConsumer = new KafkaStreamConsumer(participantCmdConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsConsumerOptions: KafkaJsConsumerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: [appConfig.kafka.host],
              clientId: clientId
            },
            consumer: { // https://kafka.js.org/docs/consuming#a-name-options-a-options
              groupId: 'participantCmdGroup'
            },
            consumerRunConfig: {
              autoCommit: appConfig.kafka.autocommit,
              autoCommitInterval: appConfig.kafka.autoCommitInterval,
              autoCommitThreshold: appConfig.kafka.autoCommitThreshold
            }
          },
          topics: [ParticipantsTopics.Commands]
        }
        participantCmdConsumer = new KafkaJsConsumer(kafkaJsConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
          client: {
            consumerConfig: {
              'metadata.broker.list': appConfig.kafka.host,
              'group.id': 'participantCmdGroup',
              'enable.auto.commit': appConfig.kafka.autocommit,
              'auto.commit.interval.ms': appConfig.kafka.autoCommitInterval,
              'client.id': clientId,
              'socket.keepalive.enable': true
            },
            topicConfig: {},
            rdKafkaCommitWaitMode: appConfig.kafka.rdKafkaCommitWaitMode
          },
          topics: [ParticipantsTopics.Commands]
        }
        participantCmdConsumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)
        break
      }
      default: {
        logger.warn('ParticipantCmdConsumer - Unable to find a Kafka consumer implementation!')
        throw new Error('participantCmdConsumer was not created!')
      }
    }

    logger.info(`ParticipantCmdConsumer - Created kafkaConsumer of type ${participantCmdConsumer.constructor.name}`)

    this._consumer = participantCmdConsumer
    logger.info('ParticipantCmdConsumer - Initializing participantCmdConsumer...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await participantCmdConsumer.init(participantCmdHandler, null) // by design we're interested in all commands
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
    await this._repo.destroy()
  }
}
