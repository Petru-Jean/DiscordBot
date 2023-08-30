"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockHandler = void 0;
const Client_1 = require("../Client");
const EventHandler_1 = require("../EventHandler");
class MockHandler extends EventHandler_1.EventHandler {
    constructor() {
        super(Client_1.GatewayDispatchEvent.MESSAGE_CREATE);
    }
    OnEvent(event) {
    }
}
exports.MockHandler = MockHandler;
