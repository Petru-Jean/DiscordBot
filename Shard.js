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
exports.Shard = exports.NoResumeCloseCodes = exports.ShardRecoveryMethod = exports.ShardStatus = void 0;
const WebSocket = require('ws');
const EventEmitter = require('events');
const Client_1 = require("./Client");
const promises_1 = require("timers/promises");
var ShardStatus;
(function (ShardStatus) {
    ShardStatus[ShardStatus["DISCONNECTED"] = 0] = "DISCONNECTED";
    ShardStatus[ShardStatus["CONNECTING"] = 1] = "CONNECTING";
    ShardStatus[ShardStatus["READY"] = 2] = "READY";
})(ShardStatus || (exports.ShardStatus = ShardStatus = {}));
/**
 * Method used for resuming Discord Gateway connection
 * If NONE is selected, then the shard won't attempt to reconnect
 */
var ShardRecoveryMethod;
(function (ShardRecoveryMethod) {
    ShardRecoveryMethod[ShardRecoveryMethod["NONE"] = 0] = "NONE";
    ShardRecoveryMethod[ShardRecoveryMethod["IDENTIFY"] = 1] = "IDENTIFY";
    ShardRecoveryMethod[ShardRecoveryMethod["RESUME"] = 2] = "RESUME";
})(ShardRecoveryMethod || (exports.ShardRecoveryMethod = ShardRecoveryMethod = {}));
exports.NoResumeCloseCodes = [4004, 4010, 4011, 4012, 4013, 4014];
class Shard extends EventEmitter {
    constructor(cluster, shardId, shardCount) {
        super();
        this.cluster = cluster;
        this.shardId = shardId;
        this.shardCount = shardCount;
        this.shardStatus = ShardStatus.DISCONNECTED;
        this.sessionData =
            {
                sequence: 0,
                resumeURL: "",
                sessionId: 0,
                heartbeat: 0,
                lastHeartbeatAck: 0
            };
    }
    /**
     * Forcefully closes Shard WebSocket connection
     * @param {ShardDestroyData} destroyData
     */
    Destroy(destroyData) {
        var _a;
        if (!this.socket || this.socket.readyState != WebSocket.OPEN) {
            return;
        }
        clearTimeout(this.sessionData.heartbeatTimeout);
        this.shardStatus = ShardStatus.DISCONNECTED;
        this.sessionData.shardDestroyData = destroyData;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close(destroyData.code, destroyData.reason);
    }
    /**
     * Initializes the heartbeat loop for the current connection.
     *
     * Should only be called once after WebSocket connection is estabilished
     * @param {number} jitter Time jitter used for the first heartbeat
     * @returns
     */
    StartHeartbeat(jitter = 0) {
        if (!this.socket || this.socket.readyState != WebSocket.OPEN) {
            return;
        }
        if (Date.now() - this.sessionData.lastHeartbeatAck >= (this.sessionData.heartbeat + 5000)) {
            const options = {
                code: 1000,
                reason: "no heartbeat response",
                recovery: ShardRecoveryMethod.RESUME
            };
            return this.Destroy(options);
        }
        this.sessionData.heartbeatTimeout = setTimeout(() => {
            var _a;
            // Send heartbeat event
            (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({
                "op": 1,
                "d": {}
            }));
            this.StartHeartbeat(0);
        }, this.sessionData.heartbeat);
    }
    OnReconnectEventRecieve(parsedJsonData) {
        const options = {
            code: 1000,
            reason: "reconnect event recieved",
            recovery: ShardRecoveryMethod.RESUME
        };
        this.Destroy(options);
    }
    OnHelloEventRecieve(parsedJsonData) {
        this.sessionData.heartbeat = parsedJsonData.d.heartbeat_interval;
        this.sessionData.lastHeartbeatAck = Date.now();
        this.StartHeartbeat(Math.random() * parsedJsonData.d.heartbeat_interval);
    }
    OnReadyEventRecieve(parsedJsonData) {
        console.log(`[Shard ${this.shardId}/${this.shardCount}] Authentification succesful [${parsedJsonData.d.user.username}]`);
        this.sessionData =
            {
                sequence: parsedJsonData.s,
                resumeURL: parsedJsonData.d.resume_gateway_url,
                sessionId: parsedJsonData.d.session_id,
                heartbeat: this.sessionData.heartbeat,
                lastHeartbeatAck: Date.now()
            };
    }
    OnInvalidSessionEventRecieve(parsedJsonData) {
        const options = {
            code: 1000,
            reason: "invalid session",
            recovery: parsedJsonData.d ? ShardRecoveryMethod.RESUME : ShardRecoveryMethod.IDENTIFY
        };
        return this.Destroy(options);
    }
    OnSocketOpen(data) {
        if (this.sessionData.shardDestroyData && this.sessionData.shardDestroyData.recovery === ShardRecoveryMethod.RESUME) {
            return this.Resume();
        }
        return this.Identify();
    }
    OnSocketClose(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[Shard ${this.shardId}/${this.shardCount}] Shard destroyed: ` + (this.sessionData.shardDestroyData ? this.sessionData.shardDestroyData.reason : `connection closed by server (${data.code})`));
            let recoveryMethod = this.sessionData.shardDestroyData ? this.sessionData.shardDestroyData.recovery : ShardRecoveryMethod.RESUME;
            if (recoveryMethod === ShardRecoveryMethod.NONE) {
                return;
            }
            if (exports.NoResumeCloseCodes.includes(data.code)) {
                return;
            }
            console.log(`[Shard ${this.shardId}/${this.shardCount}] Reconnecting to the WebSocket Gateway`);
            yield (0, promises_1.setTimeout)(2500).then(() => {
                this.Connect(recoveryMethod === ShardRecoveryMethod.RESUME ? this.sessionData.resumeURL : undefined);
            });
        });
    }
    OnSocketMessage(data) {
        var _a;
        let parsedData = JSON.parse(data.data);
        if (parsedData.op === 0) {
            if (parsedData.t === 'READY') {
                this.OnReadyEventRecieve(parsedData);
            }
            this.sessionData.sequence = parsedData.s;
        }
        else {
            if (parsedData.op === Client_1.GatewayOpcode.HELLO) {
                this.OnHelloEventRecieve(parsedData);
            }
            else if (parsedData.op === Client_1.GatewayOpcode.HEARTBEAT_ACK) {
                this.sessionData.lastHeartbeatAck = Date.now();
            }
            else if (parsedData.op === Client_1.GatewayOpcode.RECONNECT) {
                this.OnReconnectEventRecieve(parsedData);
            }
            else if (parsedData.op == Client_1.GatewayOpcode.INVALID_SESSION) {
                this.OnInvalidSessionEventRecieve(parsedData);
            }
        }
        this.cluster.client.emit((_a = parsedData.t) !== null && _a !== void 0 ? _a : parsedData.op, parsedData);
    }
    /**
     * Attempts to resume the last Gateway session after the connection was closed
     */
    Resume() {
        let json = {
            "op": 6,
            "d": {
                "token": `${this.cluster.client.clientConfig.authToken}`,
                "session_id": this.sessionData.sessionId,
                "seq:": this.sessionData.sequence
            }
        };
        this.socket.send(JSON.stringify(json));
    }
    /**
    * Sends the identify event to the discord Gateway
    */
    Identify() {
        let json = {
            "op": 2,
            "d": {
                "token": `${this.cluster.client.clientConfig.authToken}`,
                "properties": {
                    "os": "windows",
                },
                "compress": false,
                "presence": {
                    "status": "dnd",
                    "since": 91879201,
                    "afk": false
                },
                "shard": [this.shardId, this.shardCount],
                "intents": `${this.cluster.client.clientConfig.intent}`,
            }
        };
        this.socket.send(JSON.stringify(json));
    }
    /**
     *
     * @param {string} [url] URL used when establishing the WebSocket connection.
     *
     * By default, the connection uses the fetched Gateway URL for connecting.
     * @returns
     */
    Connect(url) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.socket) {
                const socketState = this.socket.readyState;
                if (socketState === WebSocket.OPEN || socketState === WebSocket.CONNECTING) {
                    return;
                }
                if (socketState === WebSocket.CLOSING) {
                    yield (0, promises_1.setTimeout)(2500);
                }
            }
            if (!url) {
                yield this.cluster.FetchGatewayInformation();
                url = (_a = this.cluster.fetchedConnectionData) === null || _a === void 0 ? void 0 : _a.url;
            }
            try {
                this.socket = new WebSocket(url);
                console.log(`[Shard ${this.shardId}/${this.shardCount}] WebSocket connection estabilished: ${url}`);
            }
            catch (exception) {
                throw new Error(exception);
            }
            (_b = this.socket) === null || _b === void 0 ? void 0 : _b.addEventListener("open", (data) => this.OnSocketOpen(data));
            (_c = this.socket) === null || _c === void 0 ? void 0 : _c.addEventListener("close", (data) => this.OnSocketClose(data));
            (_d = this.socket) === null || _d === void 0 ? void 0 : _d.addEventListener("message", (data) => this.OnSocketMessage(data));
            (_e = this.socket) === null || _e === void 0 ? void 0 : _e.addEventListener("error", (error) => console.log(error));
        });
    }
}
exports.Shard = Shard;
