/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayerFundsReservedEvt = void 0;
const messages_1 = require("../../shared/domain_abstractions/messages");
class PayerFundsReservedEvt extends messages_1.DomainEventMsg {
    constructor(transfer_id, participant_id) {
        super();
        this.payload = {
            transfer_id,
            participant_id
        };
    }
}
exports.PayerFundsReservedEvt = PayerFundsReservedEvt;
//# sourceMappingURL=payer_funds_reserved_event.js.map