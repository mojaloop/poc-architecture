/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticpantsAgg = exports.ParticipantsAggTopics = void 0;
const base_aggregate_1 = require("../../shared/domain_abstractions/base_aggregate");
const participants_factory_1 = require("./participants_factory");
const duplicate_participant_evt_1 = require("../messages/duplicate_participant_evt");
const invalid_participant_evt_1 = require("../messages/invalid_participant_evt");
const payer_funds_reserved_evt_1 = require("../messages/payer_funds_reserved_evt");
const participant_created_evt_1 = require("../messages/participant_created_evt");
const netcaplimitexceeded_evt_1 = require("../messages/netcaplimitexceeded_evt");
var ParticipantsAggTopics;
(function (ParticipantsAggTopics) {
    ParticipantsAggTopics["Commands"] = "ParticipantCommands";
    ParticipantsAggTopics["DomainEvents"] = "ParticipantDomainEvents";
    // "StateEvents" = "ParticipantStateEvents"
})(ParticipantsAggTopics = exports.ParticipantsAggTopics || (exports.ParticipantsAggTopics = {}));
class ParticpantsAgg extends base_aggregate_1.BaseAggregate {
    constructor(entity_state_repo, msg_publisher) {
        super(participants_factory_1.ParticipantsFactory.GetInstance(), entity_state_repo, msg_publisher);
        this._register_command_handler("CreateParticipantCmd", this.process_create_participant_command);
        this._register_command_handler("ReservePayerFundsCmd", this.process_reserve_funds_command);
    }
    async process_create_participant_command(command_msg) {
        return new Promise(async (resolve, reject) => {
            // try loadling first to detect duplicates
            await this.load(command_msg.payload.id, false);
            if (this._root_entity) {
                this.record_domain_event(new duplicate_participant_evt_1.DuplicateParticipantDetectedEvt(command_msg.payload.id));
                return resolve(false);
            }
            this.create(command_msg.payload.id);
            this._root_entity.setup_initial_state(command_msg.payload.name, command_msg.payload.limit, command_msg.payload.initial_position);
            this.record_domain_event(new participant_created_evt_1.ParticipantCreatedEvt(this._root_entity));
            return resolve(true);
        });
    }
    async process_reserve_funds_command(command_msg) {
        return new Promise(async (resolve, reject) => {
            await this.load(command_msg.payload.payer_id);
            if (!this._root_entity) {
                this.record_domain_event(new invalid_participant_evt_1.InvalidParticipantEvt(command_msg.payload.payer_id));
                return resolve(false);
            }
            if (!this._root_entity.can_reserve_funds(command_msg.payload.amount)) {
                this.record_domain_event(new netcaplimitexceeded_evt_1.NetCapLimitExceededEvt(this._root_entity.id, command_msg.payload.transfer_id));
                return resolve(false);
            }
            this._root_entity.reserve_funds(command_msg.payload.amount);
            this.record_domain_event(new payer_funds_reserved_evt_1.PayerFundsReservedEvt(command_msg.payload.transfer_id, command_msg.payload.payer_id, this._root_entity.position));
            return resolve(true);
        });
    }
}
exports.ParticpantsAgg = ParticpantsAgg;
//# sourceMappingURL=participants_agg.js.map