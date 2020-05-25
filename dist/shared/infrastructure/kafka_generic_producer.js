/**
 * Created by pedrosousabarreto@gmail.com on 17/Jan/2019.
 */
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaGenericProducer = void 0;
const kafka = __importStar(require("kafka-node"));
const logger_1 = require("../utilities/logger");
class KafkaGenericProducer {
    constructor(kafka_con_string, kafka_client_name, env_name, logger) {
        this._known_topics = new Map();
        this._kafka_conn_str = kafka_con_string;
        this._kafka_client_name = kafka_client_name;
        this._env_name = env_name;
        if (logger && typeof logger.child === "function") {
            this._logger = logger.child({ class: "KafkaProducer" });
        }
        else {
            this._logger = new logger_1.ConsoleLogger();
        }
        this._logger.info("KafkaGenericProducer instance created");
    }
    get env_name() {
        return this._env_name;
    }
    async init() {
        return new Promise((resolve, reject) => {
            this._logger.info("initialising...");
            let kafka_client_options = {
                kafkaHost: this._kafka_conn_str,
                clientId: this._kafka_client_name,
            };
            this._client = new kafka.KafkaClient(kafka_client_options);
            this._producer = new kafka.HighLevelProducer(this._client, { partitionerType: 3 });
            this._producer.on("ready", async () => {
                this._logger.info("KafkaProducer ready!");
                // force refresh metadata to avoid BrokerNotAvailableError on first request
                // https://www.npmjs.com/package/kafka-node#highlevelproducer-with-keyedpartitioner-errors-on-first-send
                this._client.refreshMetadata([], async (err) => {
                    if (err) {
                        this._logger.error(err, " - error refreshMetadata()");
                        return reject(err);
                    }
                    resolve();
                });
            });
            this._producer.on("error", (err) => {
                this._logger.error(err, "KafkaProducer on error");
            });
        });
    }
    async destroy() {
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
    async send(kafka_messages) {
        return new Promise(async (resolve, reject) => {
            if (!Array.isArray(arguments[0]))
                kafka_messages = [arguments[0]];
            let msgs_by_topic = new Map();
            let payloads = [];
            // iterate the messages to parse and check them, and fill _known_topics with first time topics
            kafka_messages.forEach((kafka_msg) => {
                if (!kafka_msg.msg_topic)
                    throw new Error("Invalid topic for message: " + kafka_msg.msg_type);
                let msg;
                // let topic = this._env_name + "_"+ kafka_msg.header.msg_topic; // prefix env_name on all topics
                let topic = kafka_msg.msg_topic;
                let key = kafka_msg.msg_key;
                try {
                    msg = JSON.stringify(kafka_msg);
                }
                catch (e) {
                    this._logger.error(e, +" - error parsing message");
                    return process.nextTick(() => {
                        reject(new Error("KafkaProducer - Error parsing message"));
                    });
                }
                if (!msg) {
                    this._logger.error("invalid message in send_message");
                    return process.nextTick(() => {
                        reject(new Error("KafkaProducer - invalid or empty message"));
                    });
                }
                // check for known topic and add null if not there
                if (!this._known_topics.has(topic))
                    this._known_topics.set(topic, false);
                let km = new kafka.KeyedMessage(key, msg);
                payloads.push({ topic: topic, messages: km, key: key });
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
                await this._producer.send(payloads, (err, data) => {
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
    async _refresh_metadata(topic_name) {
        return new Promise((resolve, reject) => {
            this._client.refreshMetadata([topic_name], async (err) => {
                if (err) {
                    this._logger.error(err, " - error refreshMetadata()");
                    return reject(err);
                }
                this._client.topicExists([topic_name], (error) => {
                    if (error)
                        return reject(error);
                    resolve();
                });
            });
        });
    }
}
exports.KafkaGenericProducer = KafkaGenericProducer;
//# sourceMappingURL=kafka_generic_producer.js.map