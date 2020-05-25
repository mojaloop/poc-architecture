/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservePayerFundsCmd = void 0;
const messages_1 = require("../../shared/domain_abstractions/messages");
const participants_agg_1 = require("../domain/participants_agg");
class ReservePayerFundsCmd extends messages_1.CommandMsg {
    constructor(payer_id, transfer_id, amount) {
        super();
        this.aggregate_name = "Participants";
        this.msg_topic = participants_agg_1.ParticipantsAggTopics.Commands;
        this.aggregate_id = this.msg_key = payer_id;
        this.payload = {
            payer_id,
            transfer_id,
            amount
        };
    }
}
exports.ReservePayerFundsCmd = ReservePayerFundsCmd;
//# sourceMappingURL=reserve_payer_funds_cmd.js.map