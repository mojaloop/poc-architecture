/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */

"use strict";
import { v4 as uuidv4 } from 'uuid';

// import {InMemoryParticipantStateRepo} from "../infrastructure/inmemory_participant_repo";
import {IEntityStateRepository} from "../../shared/domain_abstractions/ientity_state_repository";
import {ParticipantState} from "../domain/participant_entity";
import {IMessagePublisher} from "../../shared/domain_abstractions/imessage_publisher";
import {ParticpantsAgg} from "../domain/participants_agg";
import {ReservePayerFundsCmd} from "../messages/reserve_payer_funds_cmd";
import {ConsoleLogger} from "../../shared/utilities/logger";
import {KafkaMessagePublisher} from "../../shared/infrastructure/kafka_message_publisher";
// import {CreateParticipantCmd} from "../messages/create_participant_cmd";
import {RedisParticipantStateRepo} from "../infrastructure/redis_participant_repo";


const logger: ConsoleLogger = new ConsoleLogger();

async function start() {
	//const repo: IEntityStateRepository<ParticipantState> = new InMemoryParticipantStateRepo();
	const repo: IEntityStateRepository<ParticipantState> = new RedisParticipantStateRepo("redis://localhost:6379", logger);

	await repo.init();

	const kafka_msg_publisher: IMessagePublisher = new KafkaMessagePublisher(
		"localhost:9092",
		"client_a",
		"development",
		logger
	);

	await kafka_msg_publisher.init();

	const agg: ParticpantsAgg = new ParticpantsAgg(repo, kafka_msg_publisher);

	const payer_id:string = "47fca31d-6784-4ac2-afd2-03af341df7e1"; //uuidv4();
	const transfer_id:string = uuidv4();

	//const create_participant_cmd: CreateParticipantCmd = new CreateParticipantCmd(payer_id, "participant 1", 1000, 100);
	//await agg.process_command(create_participant_cmd);

	const reserve_cmd: ReservePayerFundsCmd = new ReservePayerFundsCmd(payer_id, transfer_id, 50);
	await agg.process_command(reserve_cmd);

}


start().catch((err)=>{
	logger.error(err);
}).finally(()=>{
	process.exit(0);
});
