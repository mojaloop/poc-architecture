/**
 * Created by pedrosousabarreto@gmail.com on 17/Jan/2019.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaMessagePublisher = void 0;
const logger_1 = require("../utilities/logger");
const kafka_generic_producer_1 = require("./kafka_generic_producer");
class KafkaMessagePublisher {
    constructor(kafka_con_string, kafka_client_name, env_name, logger) {
        this._logger = logger || new logger_1.ConsoleLogger();
        this._producer = new kafka_generic_producer_1.KafkaGenericProducer(kafka_con_string, kafka_client_name, env_name, this._logger);
    }
    get env_name() {
        return this._producer.env_name;
    }
    async init() {
        return this._producer.init();
    }
    async destroy() {
        return this._producer.destroy();
    }
    publish(message) {
        return this._producer.send(message);
    }
    publish_many(messages) {
        return this._producer.send(messages);
    }
}
exports.KafkaMessagePublisher = KafkaMessagePublisher;
//# sourceMappingURL=kafka_message_publisher.js.map