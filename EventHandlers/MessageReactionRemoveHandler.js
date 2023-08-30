"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageReactionRemoveHandler = void 0;
const Client_1 = require("../Client");
const EventHandler_1 = require("../EventHandler");
const DBSchemas_1 = require("../DBSchemas");
/**
 * @classdesc Records message reaction removals in the database
 */
class MessageReactionRemoveHandler extends EventHandler_1.EventHandler {
    constructor() {
        super(Client_1.GatewayDispatchEvent.MESSAGE_REACTION_REMOVE);
    }
    OnEvent(event) {
        DBSchemas_1.Message.findOneAndUpdate({
            message_id: event.d.message_id
        }, {
            $pull: {
                reacts: event.d.emoji.name
            }
        }).then((success) => { }, (error) => { console.log("Failed to remove message reaction: " + error); });
    }
}
exports.MessageReactionRemoveHandler = MessageReactionRemoveHandler;
