"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExMembers = exports.VoiceActivity = exports.Message = exports.ExMemberSchema = exports.VoiceActivitySchema = exports.MessageSchema = void 0;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = require('./db');
exports.MessageSchema = new Schema({
    guild_id: {
        type: String,
        required: true
    },
    message_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    // user_nick: {
    //     type: String,
    //     required: true
    // },
    content: {
        type: String,
        required: false
    },
    reacts: {
        type: Array,
        required: false
    }
}, { timestamps: true });
exports.VoiceActivitySchema = new Schema({
    guild_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    duration_in_ms: {
        type: Number,
        required: true
    },
    join_date: {
        type: Date,
        required: true
    }
}, { timestamps: true });
exports.ExMemberSchema = new Schema({
    guild_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    join_date: {
        type: Date,
        required: true
    }
}, { timestamps: true });
exports.Message = db.mongoose.model('Message', exports.MessageSchema);
exports.VoiceActivity = db.mongoose.model('VoiceActivity', exports.VoiceActivitySchema);
exports.ExMembers = db.mongoose.model('ExMembers', exports.ExMemberSchema);
