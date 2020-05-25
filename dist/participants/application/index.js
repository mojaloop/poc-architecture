/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const participants_agg_1 = require("../domain/participants_agg");
const reserve_payer_funds_cmd_1 = require("../messages/reserve_payer_funds_cmd");
const logger_1 = require("../../shared/utilities/logger");
const kafka_message_publisher_1 = require("../../shared/infrastructure/kafka_message_publisher");
const redis_participant_repo_1 = require("../infrastructure/redis_participant_repo");
const logger = new logger_1.ConsoleLogger();
async function start() {
    //const repo: IEntityStateRepository<ParticipantState> = new InMemoryParticipantStateRepo();
    const repo = new redis_participant_repo_1.RedisParticipantStateRepo("redis://localhost:6379", logger);
    await repo.init();
    const kafka_msg_publisher = new kafka_message_publisher_1.KafkaMessagePublisher("localhost:9092", "client_a", "development", logger);
    await kafka_msg_publisher.init();
    const agg = new participants_agg_1.ParticpantsAgg(repo, kafka_msg_publisher);
    const payer_id = "47fca31d-6784-4ac2-afd2-03af341df7e1"; //uuidv4();
    const transfer_id = uuid_1.v4();
    //const create_participant_cmd: CreateParticipantCmd = new CreateParticipantCmd(payer_id, "participant 1", 1000, 100);
    //await agg.process_command(create_participant_cmd);
    const reserve_cmd = new reserve_payer_funds_cmd_1.ReservePayerFundsCmd(payer_id, transfer_id, 50);
    await agg.process_command(reserve_cmd);
}
start().catch((err) => {
    logger.error(err);
}).finally(() => {
    process.exit(0);
});
//# sourceMappingURL=index.js.map