"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShardCluster = void 0;
const Shard_1 = require("./Shard");
const promises_1 = require("timers/promises");
const { EventEmitter } = require('events');
class ShardCluster extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.shards = new Array();
    }
    /**
     * Fetches the gateway connection data
     * @returns
     */
    FetchGatewayInformation() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.fetchedConnectionData) {
                if (Date.now() <= this.fetchedConnectionData.expiresAt) {
                    return;
                }
                this.fetchedConnectionData = undefined;
            }
            let response = yield fetch("https://discord.com/api/v10/gateway/bot", {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                    'Authorization': this.client.clientConfig.authToken
                }
            });
            let parsedRequestData = yield response.json();
            // Check if Unauthorized
            if (parsedRequestData.code === 0) {
                throw new Error("Unauthorized FetchGatewayInformation call");
            }
            const fetchedGatewayData = {
                url: parsedRequestData.url,
                shards: parsedRequestData.shards,
                sessionLimit: {
                    total: parsedRequestData.session_start_limit.total,
                    remaining: parsedRequestData.session_start_limit.remaining,
                    resetAfter: parsedRequestData.session_start_limit.reset_after,
                    maxConcurrency: parsedRequestData.session_start_limit.max_concurrency
                },
                expiresAt: Date.now() + parsedRequestData.session_start_limit.reset_after
            };
            this.fetchedConnectionData = fetchedGatewayData;
        });
    }
    /**
     * Creates the shards and connects them to the Discord Gateway
     * @param shards The number of shard to create. When set to zero, the recommended shard number is used
     */
    Create(shards) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.FetchGatewayInformation();
            const connectionDelay = 5000 / ((_a = this.fetchedConnectionData) === null || _a === void 0 ? void 0 : _a.sessionLimit.maxConcurrency);
            if (shards == 0) {
                shards = (_c = (_b = this.fetchedConnectionData) === null || _b === void 0 ? void 0 : _b.shards) !== null && _c !== void 0 ? _c : 1;
            }
            for (let i = 0; i < shards; i++) {
                let shard = new Shard_1.Shard(this, i, shards);
                this.shards.push(shard);
                shard.Connect();
                yield (0, promises_1.setTimeout)(connectionDelay);
            }
        });
    }
}
exports.ShardCluster = ShardCluster;
