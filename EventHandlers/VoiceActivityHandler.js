"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceActivityHandler = void 0;
const Client_1 = require("../Client");
const EventHandler_1 = require("../EventHandler");
const DBSchemas_1 = require("../DBSchemas");
/**
 * @classdesc Records user voice sessions to the database
 */
class VoiceActivityHandler extends EventHandler_1.EventHandler {
    constructor() {
        super(Client_1.GatewayDispatchEvent.VOICE_STATE_UPDATE);
        this.voiceSession = new Map();
    }
    OnEvent(event) {
        var _a;
        if (!event.d.member) {
            return;
        }
        // Check if user is connected to any voice channel
        if (this.voiceSession.get(event.d.user_id)) {
            // Check if user is on the same channel
            if (this.voiceSession.get(event.d.user_id).channelId == event.d.channel_id) {
                return;
            }
            let leaveDate = new Date().getTime();
            let joinDate = this.voiceSession.get(event.d.user_id).joinDate.getTime();
            let duration = (leaveDate - joinDate);
            const voiceActivity = new DBSchemas_1.VoiceActivity({
                user_id: event.d.user_id,
                guild_id: (_a = event.d.guild_id) !== null && _a !== void 0 ? _a : -1,
                user: event.d.member.nick ? event.d.member.nick : event.d.member.user.global_name ? event.d.member.user.global_name : event.d.member.user.username,
                duration_in_ms: duration,
                join_date: this.voiceSession.get(event.d.user_id).joinDate
            });
            voiceActivity.save().then(() => { }).catch((error) => {
                console.log("Failed to save voice activity: " + error);
            });
            //console.log("User spent " + ((t2-(t1!))/1000) + " seconds on voice channel " + this.voiceUser.get(event.d.user_id)!.channelId); 
        }
        // Reset user voice session
        if (event.d.channel_id) {
            let activity = {
                channelId: event.d.channel_id,
                joinDate: new Date()
            };
            this.voiceSession.set(event.d.user_id, activity);
        }
        else {
            this.voiceSession.delete(event.d.user_id);
        }
    }
}
exports.VoiceActivityHandler = VoiceActivityHandler;
