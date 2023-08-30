"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventMiddleman = void 0;
const Client_1 = require("./Client");
class EventMiddleman {
    constructor(client, eventHandlers, commandHandlers) {
        this.client = client;
        this.eventHandlers = eventHandlers;
        this.commandHandlers = commandHandlers;
    }
    Hook() {
        for (let handler of this.eventHandlers) {
            this.client.on(handler.GetEventType(), (eventData) => handler.OnEvent(eventData));
        }
        // Event recieved when an user sends any command in a guild
        this.client.on("INTERACTION_CREATE", (parsedJsonData) => {
            let commandName = parsedJsonData.d.data.name;
            // This can be optimised but the max number of commands (discord-api limit) is very small (~100)
            for (let command of this.commandHandlers) {
                if (command.commandName === commandName) {
                    command.OnCommand(parsedJsonData);
                }
            }
        });
        this.client.on(Client_1.GatewayDispatchEvent.GUILD_CREATE, (parsedJsonData) => {
            var _a;
            // Check if guild is unavailable in case of a discord outage
            if (parsedJsonData.d.unavailable)
                return;
            let guildMembers = parsedJsonData.d.members;
            for (let i = 0; i < Object.keys(guildMembers).length; i++) {
                if (!guildMembers[i].user)
                    continue;
                let guildUser = {
                    userId: guildMembers[i].user.id,
                    guildId: parsedJsonData.d.id,
                    username: guildMembers[i].user.username,
                    nickname: (_a = guildMembers[i].nick) !== null && _a !== void 0 ? _a : "",
                    joinDate: new Date(guildMembers[i].joined_at).getTime()
                };
                this.client.cache.redisClient.hSet(`guild#${guildUser.guildId}:user#${guildUser.userId}`, Object.assign({}, guildUser));
            }
        });
        this.client.on(Client_1.GatewayDispatchEvent.GUILD_MEMBER_UPDATE, (parsedJsonData) => {
            this.client.cache.redisClient.hSet(`guild#${parsedJsonData.d.guild_id}:user#${parsedJsonData.d.user.id}`, {
                username: parsedJsonData.d.user.username,
                nick: parsedJsonData.d.nick
            });
        });
    }
}
exports.EventMiddleman = EventMiddleman;
