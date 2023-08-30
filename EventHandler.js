"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventHandler = void 0;
const db = require('./db');
class EventHandler {
    constructor(eventType) {
        this.eventType = eventType;
    }
    GetEventType() {
        return this.eventType;
    }
}
exports.EventHandler = EventHandler;
