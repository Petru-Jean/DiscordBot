const mongoose = require('mongoose')
const Schema   = mongoose.Schema

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
    },
    name: {
        type: String,
        required: true
    }
    
}, { timestamps: true } )


export const Message       = mongoose.model('Message', MessageSchema)
export const VoiceActivity = mongoose.model('VoiceActivity', VoiceActivitySchema)
export const ExMembers     = mongoose.model('ExMembers', ExMemberSchema)
