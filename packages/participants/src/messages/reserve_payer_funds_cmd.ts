/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

"use strict";

import {CommandMsg} from "shared";
import {ParticipantsAggTopics} from "../domain/participants_agg";


export class ReservePayerFundsCmd extends CommandMsg{
	aggregate_id: string;
	aggregate_name: string = "Participants";
	msg_key: string;
	msg_topic: string = ParticipantsAggTopics.Commands;

	payload: {
		payer_id:string;
		transfer_id: string;
		amount: number;
	};

	constructor(payer_id:string, transfer_id:string, amount:number) {
		super();
		this.aggregate_id = this.msg_key = payer_id;

		this.payload = {
			payer_id,
			transfer_id,
			amount
		}
	}
}
