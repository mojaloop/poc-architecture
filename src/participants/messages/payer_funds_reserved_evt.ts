/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

"use strict";

import {DomainEventMsg} from "../../shared/domain_abstractions/messages";
import {ParticipantsAggTopics} from "../domain/participants_agg";


export class PayerFundsReservedEvt extends DomainEventMsg{
	aggregate_id: string;
	aggregate_name: string = "Participants";
	msg_key: string;
	msg_topic: string = ParticipantsAggTopics.DomainEvents;

	payload: {
		transfer_id:string;
		payer_id:string;
		current_position:number;
	};

	constructor(transfer_id:string, payer_id:string, current_position:number) {
		super();

		this.aggregate_id = this.msg_key = payer_id;

		this.payload = {
			transfer_id,
			payer_id,
			current_position
		}
	}
}
