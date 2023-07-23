const mongoose = require('mongoose')
const Schema   = mongoose.Schema


const MessageSchema = new Schema({
    guild_id: {
        type: Number,
        required: true
    },
    message_id: {
        type: Number,
        required: true
    },
    user_id: {
        type: Number,
        required: true
    },
    user_nick: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    reacts: {
        type: Array,
        required: false
    }
}, {timestamps: true })

const VoiceActivitySchema = new Schema({
    user_id: {
        type: Number,
        required: true
    },
    channel_id: {
        type: Number,
        required: true
    },
    user: {
        type:     String,
        required: true
    },
    duration_in_seconds: {
        type: Number,
        required: true
    },
    join_date: {
        type: Date,
        required: true
    }
}, { timestamps: true })

const MemberLeaveSchema = new Schema({
    user_id: {
        type: Number,
        required: true
    },
    guild_id: {
        type: Number,
        required: true
    },
    join_date: {
        type: Date,
        required: true
    }
}, { timestamps: true } )

const Message       = mongoose.model('Message', MessageSchema)
const VoiceActivity = mongoose.model('VoiceActivity', VoiceActivitySchema)
const MemberLeave   = mongoose.model('MemberLeave', MemberLeaveSchema)

module.exports = { Message, VoiceActivity, MemberLeave }