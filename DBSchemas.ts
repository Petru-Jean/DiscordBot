import { ObjectId } from "mongodb"

const mongoose = require('mongoose')
const Schema   = mongoose.Schema
const db = require('./db')

export const MessageSchema = new Schema({
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
}, {timestamps: true })

export const VoiceActivitySchema = new Schema({
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
}, { timestamps: true })

export const ExMemberSchema = new Schema({
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
}, { timestamps: true } )


export const Message       = db.mongoose.model('Message', MessageSchema)
export const VoiceActivity = db.mongoose.model('VoiceActivity', VoiceActivitySchema)
export const ExMembers   = db.mongoose.model('ExMembers', ExMemberSchema)
