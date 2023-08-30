"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageReactionAddHandler = void 0;
const Client_1 = require("../Client");
const EventHandler_1 = require("../EventHandler");
const DBSchemas_1 = require("../DBSchemas");
/**
 * @classdesc Records reactions to user messages in the database
 */
class MessageReactionAddHandler extends EventHandler_1.EventHandler {
    constructor() {
        super(Client_1.GatewayDispatchEvent.MESSAGE_REACTION_ADD);
    }
    OnEvent(event) {
        DBSchemas_1.Message.findOneAndUpdate({
            message_id: event.d.message_id
        }, {
            $push: {
                reacts: event.d.emoji.name
            }
        }).then((success) => { }, (error) => { console.log("Failed to save message reaction: " + error); });
    }
}
exports.MessageReactionAddHandler = MessageReactionAddHandler;
