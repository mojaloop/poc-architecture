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
// import {InMemoryParticipantStateRepo} from "../infrastructure/inmemory_participant_repo";
import { CommandMsg, IDomainMessage, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
import { ParticipantsTopics } from '@mojaloop-poc/lib-public-messages'
import { IRunHandler, KafkaInfraTypes, KafkaJsProducerOptions, KafkajsMessagePublisher, KafkaJsConsumer, KafkaJsConsumerOptions, MessageConsumer, KafkaMessagePublisher, KafkaGenericConsumer, EnumOffset, KafkaGenericConsumerOptions, KafkaGenericProducerOptions } from '@mojaloop-poc/lib-infrastructure'
import { ParticpantsAgg } from '../domain/participants_agg'
import { ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { CreateParticipantCmd } from '../messages/create_participant_cmd'
import { CommitPayeeFundsCmd } from '../messages/commit_payee_funds_cmd'
import { RedisParticipantStateRepo } from '../infrastructure/redis_participant_repo'
import { IParticipantRepo } from '../domain/participant_repo'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'

export class ParticipantCmdHandler implements IRunHandler {
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher
  private _repo: IParticipantRepo

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    // const repo: IEntityStateRepository<ParticipantState> = new InMemoryParticipantStateRepo();
    const repo: IParticipantRepo = new RedisParticipantStateRepo(appConfig.redis.host, logger)
    this._repo = repo
    await repo.init()

    let kafkaMsgPublisher: IMessagePublisher | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.info(`Creating ${appConfig.kafka.consumer} participantCmdHandler.kafkaMsgPublisher...`)
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
          client: {
            kafka: {
              kafkaHost: appConfig.kafka.host,
              clientId: `participantCmdHandler-${Crypto.randomBytes(8)}`
            }
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
              brokers: ['localhost:9092'],
              clientId: `participantCmdHandler-${Crypto.randomBytes(8)}`
            },
            producer: { // https://kafka.js.org/docs/producing#options
              allowAutoTopicCreation: true,
              idempotent: true, // false is default
              transactionTimeout: 60000
            }
          }
        }
        kafkaMsgPublisher = new KafkajsMessagePublisher(
          kafkaJsProducerOptions,
          logger
        )
        break
      }
      default: {
        logger.warn('Unable to find a Kafka Producer implementation!')
        throw new Error('participantCmdHandler.kafkaMsgPublisher was not created!')
      }
    }

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
      ['success', 'error'] // Define a custom label 'success'
    )

    // ## Setup participantCmdConsumer
    const participantCmdHandler = async (message: IDomainMessage): Promise<void> => {
      const histTimer = histoParticipantCmdHandlerMetric.startTimer()
      try {
        logger.info(`participantCmdHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
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
            logger.warn(`participantCmdHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
            break
          }
        }
        let processCommandResult: boolean = false
        if (participantCmd != null) {
          processCommandResult = await agg.processCommand(participantCmd)
        } else {
          logger.warn(`participantCmdHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Unable to process event`)
        }
        logger.info(`participantCmdHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: ${processCommandResult.toString()}`)
        histTimer({ success: 'true' })
      } catch (err) {
        const errMsg: string = err?.message?.toString()
        logger.info(`participantCmdHandler processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
        logger.error(err)
        histTimer({ success: 'false', error: err.message })
      }
    }

    this._publisher = kafkaMsgPublisher
    let participantCmdConsumer: MessageConsumer | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.info(`Creating ${appConfig.kafka.consumer} participantCmdConsumer...`)
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const participantCmdConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: `participantCmdConsumer-${Crypto.randomBytes(8)}`,
            groupId: 'participantCmdGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [ParticipantsTopics.Commands]
        }
        participantCmdConsumer = new KafkaGenericConsumer(participantCmdConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsConsumerOptions: KafkaJsConsumerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: ['localhost:9092'],
              clientId: `participantCmdConsumer-${Crypto.randomBytes(8)}`
            },
            consumer: { // https://kafka.js.org/docs/consuming#a-name-options-a-options
              groupId: 'participantCmdGroup'
            },
            consumerRunConfig: {
              autoCommit: appConfig.kafka.autocommit
            }
          },
          topics: [ParticipantsTopics.Commands]
        }
        participantCmdConsumer = new KafkaJsConsumer(kafkaJsConsumerOptions, logger)
        break
      }
      default: {
        logger.warn('Unable to find a Kafka consumer implementation!')
        throw new Error('participantCmdConsumer was not created!')
      }
    }

    this._consumer = participantCmdConsumer
    logger.info('Initializing participantCmdConsumer...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await participantCmdConsumer.init(participantCmdHandler)
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
    await this._repo.destroy()
  }
}
