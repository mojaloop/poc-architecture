/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantCreatedEvt = void 0;
const messages_1 = require("../../shared/domain_abstractions/messages");
const participants_agg_1 = require("../domain/participants_agg");
class ParticipantCreatedEvt extends messages_1.DomainEventMsg {
    constructor(participant) {
        super();
        this.aggregate_name = "Participants";
        this.msg_topic = participants_agg_1.ParticipantsAggTopics.DomainEvents;
        this.aggregate_id = this.msg_key = participant.id;
        this.payload = {
            id: participant.id,
            name: participant.name,
            limit: participant.limit,
            position: participant.position
        };
    }
}
exports.ParticipantCreatedEvt = ParticipantCreatedEvt;
//# sourceMappingURL=participant_created_evt.js.map