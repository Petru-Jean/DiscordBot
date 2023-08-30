"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
require('console-stamp')(console, '[HH:MM:ss.l]');
const EventMiddleman_1 = require("./EventMiddleman");
const EventHandlers = __importStar(require("./EventHandlers/EventHandlers"));
const Client_1 = require("./Client");
const Rest_1 = require("./Rest");
const StatsCommandHandler_1 = require("./EventHandlers/StatsCommandHandler");
const Redis = __importStar(require("redis"));
const db = require('./db');
let redis = Redis.createClient();
redis.on('error', err => { throw new Error(err); });
redis.connect()
    .then(() => { console.log("Redis client connected."); })
    .catch((error) => { throw new Error(`Redis error: ${error}`); });
const config = {
    authToken: (_a = process.env.AUTH_TOKEN) !== null && _a !== void 0 ? _a : "",
    intent: 131071,
    reconnectDelay: 5000
};
const rest = new Rest_1.Rest();
const client = new Client_1.Client(config, redis, rest);
const commandHandlers = [
    new StatsCommandHandler_1.StatsCommandHandler(client)
];
const eventHandlers = [
    new EventHandlers.MessageCreateHandler(),
    new EventHandlers.MockHandler(),
    new EventHandlers.VoiceActivityHandler(),
    new EventHandlers.MessageReactionAddHandler(),
    new EventHandlers.MessageReactionRemoveHandler()
];
new EventMiddleman_1.EventMiddleman(client, eventHandlers, commandHandlers).Hook();
client.Start();
