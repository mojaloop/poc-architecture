/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

"use strict";

import {DomainEventMsg} from "shared";
import {ParticipantsAggTopics} from "../domain/participants_agg";


export class InvalidParticipantEvt extends DomainEventMsg{
	aggregate_id: string;
	aggregate_name: string = "Participants";
	msg_key: string;
	msg_topic: string = ParticipantsAggTopics.DomainEvents;

	payload: {
		participant_id:string
	};

	constructor(participant_id:string) {
		super();

		this.aggregate_id = this.msg_key = participant_id;

		this.payload = {
			participant_id
		}
	}
}
