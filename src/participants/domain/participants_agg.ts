/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */

"use strict";

import {BaseAggregate} from "../../shared/domain_abstractions/base_aggregate";
import {ParticipantEntity, ParticipantState} from "./participant_entity";
import {CommandMsg, DomainEventMsg, MessageTypes} from "../../shared/domain_abstractions/messages";
import {IEntityStateRepository} from "../../shared/domain_abstractions/ientity_state_repository";
import {IMessagePublisher} from "../../shared/domain_abstractions/imessage_publisher";
import {ParticipantsFactory} from "./participants_factory";
import {ReservePayerFundsCmd} from "../messages/reserve_payer_funds_cmd";
import {CreateParticipantCmd} from "../messages/create_participant_cmd";
import {DuplicateParticipantDetectedEvt} from "../messages/duplicate_participant_evt";
import {InvalidParticipantEvt} from "../messages/invalid_participant_evt";
import {PayerFundsReservedEvt} from "../messages/payer_funds_reserved_evt";
import {ParticipantCreatedEvt} from "../messages/participant_created_evt";
import {NetCapLimitExceededEvt} from "../messages/netcaplimitexceeded_evt";

export enum ParticipantsAggTopics{
	"Commands" = "ParticipantCommands",
	"DomainEvents" = "ParticipantDomainEvents",
	// "StateEvents" = "ParticipantStateEvents"
}

export class ParticpantsAgg extends BaseAggregate<ParticipantEntity, ParticipantState>{

	constructor(entity_state_repo:IEntityStateRepository<ParticipantState>, msg_publisher:IMessagePublisher) {
		super(ParticipantsFactory.GetInstance(), entity_state_repo, msg_publisher);
		this._register_command_handler("CreateParticipantCmd", this.process_create_participant_command);
		this._register_command_handler("ReservePayerFundsCmd", this.process_reserve_funds_command);
	}

	async process_create_participant_command(command_msg: CreateParticipantCmd): Promise<boolean> {
		return new Promise(async (resolve, reject)=> {
			// try loadling first to detect duplicates
			await this.load(command_msg.payload.id, false);
			if (this._root_entity) {
				this.record_domain_event(new DuplicateParticipantDetectedEvt(command_msg.payload.id));
				return resolve(false);
			}

			this.create(command_msg.payload.id);
			this._root_entity!.setup_initial_state(
				command_msg.payload.name,
				command_msg.payload.limit,
				command_msg.payload.initial_position
			)

			this.record_domain_event(new ParticipantCreatedEvt(this._root_entity!));

			return resolve(true);
		});
	}

	async process_reserve_funds_command(command_msg: ReservePayerFundsCmd): Promise<boolean> {
		return new Promise(async (resolve, reject)=>{
			await this.load(command_msg.payload.payer_id);

			if(!this._root_entity){
				this.record_domain_event(new InvalidParticipantEvt(command_msg.payload.payer_id));
				return resolve(false);
			}

			if(!this._root_entity.can_reserve_funds(command_msg.payload.amount)){
				this.record_domain_event(new NetCapLimitExceededEvt(this._root_entity.id, command_msg.payload.transfer_id));
				return resolve(false);
			}

			this._root_entity.reserve_funds(command_msg.payload.amount);

			this.record_domain_event(new PayerFundsReservedEvt(command_msg.payload.transfer_id, command_msg.payload.payer_id, this._root_entity.position));

			return resolve(true);
		});
	}

}
