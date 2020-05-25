/**
 * Created by pedrosousabarreto@gmail.com on 17/Jan/2019.
 */


"use strict";

import * as kafka from "kafka-node";
import {ConsoleLogger, ILogger} from "../utilities/logger";
import {IMessage} from "../domain_abstractions/messages";
import {KafkaGenericProducer} from "./kafka_generic_producer";
import {IMessagePublisher} from "../domain_abstractions/imessage_publisher";

export class KafkaMessagePublisher implements IMessagePublisher{
	private _producer:KafkaGenericProducer;
	protected _logger: ILogger;

	constructor(kafka_con_string: string, kafka_client_name: string, env_name: string, logger?: ILogger) {
		this._logger = logger || new ConsoleLogger();
		this._producer = new KafkaGenericProducer(kafka_con_string, kafka_client_name, env_name, this._logger);

	}

	get env_name(): string {
		return this._producer.env_name;
	}

	async init(): Promise<void> {
		return this._producer.init();
	}

	async destroy(): Promise<void> {
		return this._producer.destroy();
	}

	publish(message: IMessage): Promise<void> {
		return this._producer.send(message);
	}

	publish_many(messages: IMessage[]): Promise<void> {
		return this._producer.send(messages);
	}

}
