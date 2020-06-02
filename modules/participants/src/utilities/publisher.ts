import { IMessagePublisher, IMessage } from "@mojaloop-poc/lib-domain"
import { KafkaMessagePublisher } from '@mojaloop-poc/lib-infrastructure'
import { appConfig, logger } from '../application'

const kafkaMsgPublisher: IMessagePublisher = new KafkaMessagePublisher(
  appConfig.kafka.host,
  'participants',
  'development',
  logger
)

export const publishMessage = async (message: IMessage) => {
  await kafkaMsgPublisher.init()  
  await kafkaMsgPublisher.publish(message)
  await kafkaMsgPublisher.destroy()
}
