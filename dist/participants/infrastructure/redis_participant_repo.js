/**
 * Created by pedrosousabarreto@gmail.com on 24/May/2020.
 */
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisParticipantStateRepo = void 0;
const redis = __importStar(require("redis"));
class RedisParticipantStateRepo {
    constructor(conn_str, logger) {
        this._initialized = false;
        this.key_prefix = "participant_";
        this._redis_conn_str = conn_str;
        this._logger = logger;
    }
    init() {
        return new Promise((resolve, reject) => {
            this._redis_client = redis.createClient({ url: this._redis_conn_str });
            this._redis_client.on("ready", () => {
                this._logger.info('Redis client ready');
                if (this._initialized)
                    return;
                this._initialized = true;
                return resolve();
            });
            this._redis_client.on('error', (err) => {
                this._logger.error(err, 'A redis error has occurred:');
                if (!this._initialized)
                    return reject(err);
            });
        });
    }
    destroy() {
        if (this._initialized)
            this._redis_client.quit();
        return Promise.resolve();
    }
    can_call() {
        return this._initialized; // for now, no circuit breaker exists
    }
    load(id) {
        return new Promise((resolve, reject) => {
            if (!this.can_call())
                return reject("Repository not ready");
            const key = this.key_with_prefix(id);
            this._redis_client.get(key, (err, result) => {
                if (err) {
                    this._logger.error(err, "Error fetching entity state from redis - for key: " + key);
                    return reject();
                }
                if (!result) {
                    this._logger.debug("Entity state not found in redis - for key: " + key);
                    return resolve(null);
                }
                try {
                    let state = JSON.parse(result);
                    return resolve(state);
                }
                catch (err) {
                    this._logger.error(err, "Error parsing entity state from redis - for key: " + key);
                    return reject();
                }
            });
        });
    }
    remove(id) {
        return new Promise((resolve, reject) => {
            if (!this.can_call())
                return reject("Repository not ready");
            const key = this.key_with_prefix(id);
            this._redis_client.del(key, (err, result) => {
                if (err) {
                    this._logger.error(err, "Error removing entity state from redis - for key: " + key);
                    return reject();
                }
                if (result !== 1) {
                    this._logger.debug("Entity state not found in redis - for key: " + key);
                    return resolve();
                }
                return resolve();
            });
        });
    }
    store(entity_state) {
        return new Promise((resolve, reject) => {
            if (!this.can_call())
                return reject("Repository not ready");
            const key = this.key_with_prefix(entity_state.id);
            let string_value;
            try {
                string_value = JSON.stringify(entity_state);
            }
            catch (err) {
                this._logger.error(err, "Error parsing entity state JSON - for key: " + key);
                return reject();
            }
            this._redis_client.set(key, string_value, (err, reply) => {
                if (err) {
                    this._logger.error(err, "Error storing entity state to redis - for key: " + key);
                    return reject();
                }
                if (reply !== "OK") {
                    this._logger.error("Unsuccessful attempt to store the entity state in redis - for key: " + key);
                    return reject();
                }
                return resolve();
            });
        });
    }
    key_with_prefix(key) {
        return this.key_prefix + key;
    }
}
exports.RedisParticipantStateRepo = RedisParticipantStateRepo;
//# sourceMappingURL=redis_participant_repo.js.map