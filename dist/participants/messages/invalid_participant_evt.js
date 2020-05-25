/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidParticipantEvt = void 0;
const messages_1 = require("../../shared/domain_abstractions/messages");
const participants_agg_1 = require("../domain/participants_agg");
class InvalidParticipantEvt extends messages_1.DomainEventMsg {
    constructor(participant_id) {
        super();
        this.aggregate_name = "Participants";
        this.msg_topic = participants_agg_1.ParticipantsAggTopics.DomainEvents;
        this.aggregate_id = this.msg_key = participant_id;
        this.payload = {
            participant_id
        };
    }
}
exports.InvalidParticipantEvt = InvalidParticipantEvt;
//# sourceMappingURL=invalid_participant_evt.js.map