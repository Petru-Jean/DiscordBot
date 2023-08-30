"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageCreateHandler = void 0;
const Client_1 = require("../Client");
const EventHandler_1 = require("../EventHandler");
const DBSchemas_1 = require("../DBSchemas");
class MessageCreateHandler extends EventHandler_1.EventHandler {
    constructor() {
        super(Client_1.GatewayDispatchEvent.MESSAGE_CREATE);
    }
    OnEvent(event) {
        var _a;
        let message = event;
        let ephemeralFlag = 1 << 6;
        // Check if message is ephemeral
        if (message.d.flags && (message.d.flags & ephemeralFlag)) {
            return;
        }
        const msg = new DBSchemas_1.Message({
            guild_id: message.d.guild_id,
            user_id: message.d.author.id,
            message_id: message.d.id,
            content: (_a = message.d.content) !== null && _a !== void 0 ? _a : "Attachment"
        });
        msg.save().then(() => { }).catch((error) => {
            console.log("Failed to save message: " + error);
        });
    }
}
exports.MessageCreateHandler = MessageCreateHandler;
