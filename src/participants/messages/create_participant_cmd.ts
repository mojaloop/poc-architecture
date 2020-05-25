/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

"use strict";

import {CommandMsg} from "../../shared/domain_abstractions/messages";
import {ParticipantsAggTopics} from "../domain/participants_agg";


export class CreateParticipantCmd extends CommandMsg {
	aggregate_id: string;
	aggregate_name: string = "Participants";
	msg_key: string;
	msg_topic: string = ParticipantsAggTopics.Commands;


	payload: {
		id: string;
		name: string;
		limit:number;
		initial_position: number;
	};

	constructor(id: string, name:string, limit:number, initial_position: number) {
		super();

		this.aggregate_id = this.msg_key = id;

		this.payload = {
			id,
			name,
			limit,
			initial_position
		}
	}
}
