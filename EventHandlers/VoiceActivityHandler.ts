import { GatewayDispatchEvent } from "../Client";
import { EventHandler  }  from "../EventHandler";
import { VoiceActivity }  from '../DBSchemas'

interface VoiceActivity
{
    channelId:  number,
    joinDate:   Date
}

/**
 * @classdesc Records user voice sessions to the database 
 */

export class VoiceActivityHandler extends EventHandler
{
    voiceSession: Map<number, VoiceActivity>

    constructor()
    {
        super(GatewayDispatchEvent.VOICE_STATE_UPDATE)

        this.voiceSession = new Map<number, VoiceActivity>()
    }

    OnEvent(event: any): void
    {
        if (!event.d.member)
        {
            return   
        }
        
        // Check if user is connected to any voice channel
        if (this.voiceSession.get(event.d.user_id))
        {
            
            // Check if user is on the same channel
            if (this.voiceSession.get(event.d.user_id)!.channelId == event.d.channel_id)
            {
                return;
            }

            let leaveDate = new Date().getTime()
            let joinDate  = this.voiceSession.get(event.d.user_id)!.joinDate.getTime()

            let duration = (leaveDate - joinDate)
            
            const voiceActivity = new VoiceActivity(
            {
                user_id:             event.d.user_id,
                guild_id:            event.d.guild_id ?? -1,
                user: event.d.member.nick ? event.d.member.nick : event.d.member.user.global_name ? event.d.member.user.global_name : event.d.member.user.username,
                duration_in_ms:      duration,
                join_date:           this.voiceSession.get(event.d.user_id)!.joinDate
            })
        
            voiceActivity.save().then(() => {}).catch((error : any) =>
            {
                console.log("Failed to save voice activity: " + error)
            })

            //console.log("User spent " + ((t2-(t1!))/1000) + " seconds on voice channel " + this.voiceUser.get(event.d.user_id)!.channelId); 
        }

        // Reset user voice session
        if (event.d.channel_id)
        {
            let activity = 
            {
                channelId: event.d.channel_id,
                joinDate:  new Date()
            }

            this.voiceSession.set(event.d.user_id, activity);    
        }
        else
        {
            this.voiceSession.delete(event.d.user_id);    
        }
        
    }
    
}