/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

"use strict";

import {DomainEventMsg} from "../../shared/domain_abstractions/messages";
import {ParticipantEntity} from "../domain/participant_entity";
import {ParticipantsAggTopics} from "../domain/participants_agg";


export class ParticipantCreatedEvt extends DomainEventMsg{
	aggregate_id: string;
	aggregate_name: string = "Participants";
	msg_key: string;
	msg_topic: string = ParticipantsAggTopics.DomainEvents;

	payload: {
		id:string;
		name:string;
		limit:number;
		position:number;
	};

	constructor(participant:ParticipantEntity) {
		super();

		this.aggregate_id = this.msg_key = participant.id;

		this.payload = {
			id: participant.id,
			name: participant.name,
			limit: participant.limit,
			position: participant.position

		}
	}
}
