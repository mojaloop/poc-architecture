/**
 * Created by pedrosousabarreto@gmail.com on 17/Jan/2019.
 */
"use strict";

import * as kafka from "kafka-node";
import {ConsoleLogger, ILogger} from "../utilities/logger";
import {IMessage} from "../domain_abstractions/messages";

export class KafkaGenericProducer {
	protected _logger: ILogger;
	private _client!: kafka.KafkaClient;
	private _kafka_conn_str: string;
	private _kafka_client_name: string;
	private _producer!: kafka.HighLevelProducer;
	private _known_topics = new Map<string, boolean>();

	constructor(kafka_con_string: string, kafka_client_name: string, env_name: string, logger?: ILogger) {
		this._kafka_conn_str = kafka_con_string;
		this._kafka_client_name = kafka_client_name;

		this._env_name = env_name;

		if (logger && typeof (<any>logger).child === "function") {
			this._logger = (<any>logger).child({class: "KafkaProducer"});
		} else {
			this._logger = new ConsoleLogger();
		}

		this._logger.info("KafkaGenericProducer instance created");
	}

	private _env_name: string;

	get env_name(): string {
		return this._env_name;
	}

	async init(): Promise<void> {
		return new Promise((resolve, reject) => {

			this._logger.info("initialising...");

			let kafka_client_options: kafka.KafkaClientOptions = {
				kafkaHost: this._kafka_conn_str,
				clientId: this._kafka_client_name,
			};

			this._client = new kafka.KafkaClient(kafka_client_options);
			this._producer = new kafka.HighLevelProducer(this._client, {partitionerType: 3});


			this._producer.on("ready", async () => {
				this._logger.info("KafkaProducer ready!");

				// force refresh metadata to avoid BrokerNotAvailableError on first request
				// https://www.npmjs.com/package/kafka-node#highlevelproducer-with-keyedpartitioner-errors-on-first-send

				this._client.refreshMetadata([], async (err: Error) => {
					if (err) {
						this._logger.error(err, " - error refreshMetadata()");
						return reject(err);
					}

					resolve();
				});
			});


			this._producer.on("error", (err: Error) => {
				this._logger.error(err, "KafkaProducer on error");
			});

		});
	}

	async destroy(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this._producer && this._producer.close)
				this._producer.close(() => {
					resolve();
				});
			else {
				resolve();
			}
		});

	}

	// async send(kafka_msg: IMessage, callback: (err?: Error, offset_data?: any) => void): Promise<>;
	async send(kafka_msg: IMessage): Promise<void>;

	async send(kafka_messages: IMessage[]): Promise<void>;

	async send(kafka_messages: any): Promise<void> {
		return new Promise(async (resolve, reject) => {
			if (!Array.isArray(arguments[0]))
				kafka_messages = <IMessage[]>[arguments[0]];

			let msgs_by_topic: Map<string, kafka.KeyedMessage[]> = new Map<string, kafka.KeyedMessage[]>();
			let payloads: any[] = [];

			// iterate the messages to parse and check them, and fill _known_topics with first time topics
			kafka_messages.forEach((kafka_msg: IMessage) => {
				if (!kafka_msg.msg_topic)
					throw new Error("Invalid topic for message: " + kafka_msg.msg_type);

				let msg: string;
				// let topic = this._env_name + "_"+ kafka_msg.header.msg_topic; // prefix env_name on all topics
				let topic = kafka_msg.msg_topic;
				let key = kafka_msg.msg_key;


				try {
					msg = JSON.stringify(kafka_msg);
				} catch (e) {
					this._logger.error(e, +" - error parsing message");
					return process.nextTick(() => {
						reject(new Error("KafkaProducer - Error parsing message"));
					});
				}

				if (!msg) {
					this._logger.error("invalid message in send_message");
					return process.nextTick(() => {
						reject(new Error("KafkaProducer - invalid or empty message"))
					});
				}

				// check for known topic and add null if not there
				if (!this._known_topics.has(topic))
					this._known_topics.set(topic, false);

				let km = new kafka.KeyedMessage(key, msg);
				payloads.push({topic: topic, messages: km, key: key});
				// payloads.push({topic: topic, messages: [km]});
				// payloads.push(km);
			});

			// make sure we refresh metadata for first time topics - otherwise we bet BrokerNotAvailable error on first time topic
			const results = Promise.all(Array.from(this._known_topics.entries()).map(async (item) => {
				let topic_name = item[0];
				let val = item[1];
				if (val)
					return Promise.resolve();

				await this._refresh_metadata(topic_name);
				this._known_topics.set(topic_name, true);
				return Promise.resolve();
			}));

			await results.catch(err => {
				reject();
			}).then(async () => {
				await this._producer.send(payloads, (err?: Error | null, data?: any) => {
					if (err) {
						this._logger.error(err, "KafkaGenericProducer error sending message");
						return reject(err);
					}

					console.log("KafkaGenericProducer sent message - response:", data);
					resolve(data);
				});
			});


		});
	}

	private async _refresh_metadata(topic_name: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this._client.refreshMetadata([topic_name], async (err?: Error) => {
				if (err) {
					this._logger.error(err, " - error refreshMetadata()");
					return reject(err);
				}

				this._client.topicExists([topic_name], (error?: kafka.TopicsNotExistError | any) => {
					if (error)
						return reject(error);

					resolve();
				});
			});
		});
	}
}
