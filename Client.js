"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.GatewayDispatchEvent = exports.GatewayOpcode = void 0;
const EventEmitter = require('events');
const ShardCluster_1 = require("./ShardCluster");
const ClientCache_1 = require("./ClientCache");
var GatewayOpcode;
(function (GatewayOpcode) {
    GatewayOpcode[GatewayOpcode["DIPSATCH"] = 0] = "DIPSATCH";
    GatewayOpcode[GatewayOpcode["HEARTBEAT"] = 1] = "HEARTBEAT";
    GatewayOpcode[GatewayOpcode["IDENTIFY"] = 2] = "IDENTIFY";
    GatewayOpcode[GatewayOpcode["RESUME"] = 6] = "RESUME";
    GatewayOpcode[GatewayOpcode["RECONNECT"] = 7] = "RECONNECT";
    GatewayOpcode[GatewayOpcode["INVALID_SESSION"] = 9] = "INVALID_SESSION";
    GatewayOpcode[GatewayOpcode["HELLO"] = 10] = "HELLO";
    GatewayOpcode[GatewayOpcode["HEARTBEAT_ACK"] = 11] = "HEARTBEAT_ACK";
})(GatewayOpcode || (exports.GatewayOpcode = GatewayOpcode = {}));
var GatewayDispatchEvent;
(function (GatewayDispatchEvent) {
    GatewayDispatchEvent["MESSAGE_CREATE"] = "MESSAGE_CREATE";
    GatewayDispatchEvent["MESSAGE_REACTION_ADD"] = "MESSAGE_REACTION_ADD";
    GatewayDispatchEvent["MESSAGE_REACTION_REMOVE"] = "MESSAGE_REACTION_REMOVE";
    GatewayDispatchEvent["GUILD_MEMBER_ADD"] = "GUILD_MEMBER_ADD";
    GatewayDispatchEvent["GUILD_MEMBER_REMOVE"] = "GUILD_MEMBER_REMOVE";
    GatewayDispatchEvent["VOICE_STATE_UPDATE"] = "VOICE_STATE_UPDATE";
    GatewayDispatchEvent["RESUMED"] = "RESUMED";
    GatewayDispatchEvent["INVALID_SESSION"] = "INVALID_SESSION";
    GatewayDispatchEvent["GUILD_MEMBER_UPDATE"] = "GUILD_MEMBER_UPDATE";
    GatewayDispatchEvent["GUILD_CREATE"] = "GUILD_CREATE";
})(GatewayDispatchEvent || (exports.GatewayDispatchEvent = GatewayDispatchEvent = {}));
class Client extends EventEmitter {
    constructor(clientConfig, redisClient, rest) {
        super();
        this.cluster = new ShardCluster_1.ShardCluster(this);
        this.cache = new ClientCache_1.ClientCache(redisClient);
        this.rest = rest;
        this.clientConfig = clientConfig;
    }
    Start(shards = 0) {
        this.cluster.Create(shards);
    }
}
exports.Client = Client;
