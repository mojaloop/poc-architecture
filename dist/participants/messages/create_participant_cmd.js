/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateParticipantCmd = void 0;
const messages_1 = require("../../shared/domain_abstractions/messages");
const participants_agg_1 = require("../domain/participants_agg");
class CreateParticipantCmd extends messages_1.CommandMsg {
    constructor(id, name, limit, initial_position) {
        super();
        this.aggregate_name = "Participants";
        this.msg_topic = participants_agg_1.ParticipantsAggTopics.Commands;
        this.aggregate_id = this.msg_key = id;
        this.payload = {
            id,
            name,
            limit,
            initial_position
        };
    }
}
exports.CreateParticipantCmd = CreateParticipantCmd;
//# sourceMappingURL=create_participant_cmd.js.map