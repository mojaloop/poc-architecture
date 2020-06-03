import { IMessagePublisher, IMessage, ILogger } from '@mojaloop-poc/lib-domain'
import { KafkaMessagePublisher } from '@mojaloop-poc/lib-infrastructure'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

import * as dotenv from 'dotenv'

dotenv.config({ path: '../../.env' })

const logger: ILogger = new ConsoleLogger()

// # setup application config
const appConfig = {
  kafka: {
    host: process.env.KAFKA_HOST
  }
}

const kafkaMsgPublisher: IMessagePublisher = new KafkaMessagePublisher(
  appConfig.kafka.host!,
  'transfer-utilities',
  'development',
  logger
)

export const publishMessage = async (message: IMessage): Promise<void> => {
  await kafkaMsgPublisher.init()
  await kafkaMsgPublisher.publish(message)
  await kafkaMsgPublisher.destroy()
}
