/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayerFundsReservedEvt = void 0;
const messages_1 = require("../../shared/domain_abstractions/messages");
const participants_agg_1 = require("../domain/participants_agg");
class PayerFundsReservedEvt extends messages_1.DomainEventMsg {
    constructor(transfer_id, payer_id, current_position) {
        super();
        this.aggregate_name = "Participants";
        this.msg_topic = participants_agg_1.ParticipantsAggTopics.DomainEvents;
        this.aggregate_id = this.msg_key = payer_id;
        this.payload = {
            transfer_id,
            payer_id,
            current_position
        };
    }
}
exports.PayerFundsReservedEvt = PayerFundsReservedEvt;
//# sourceMappingURL=payer_funds_reserved_evt.js.map