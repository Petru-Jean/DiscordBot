import { DiscordBot, DispatchEvents } from "./DiscordBotAPI";

const  { mongoose }                = require('mongoose')
const  { Message, VoiceActivity  } = require('./DBSchemas')

enum Events
{
    // Increment only in powers of 2
    Messages  = 1,
    VoiceChat = 2,
    Activity  = 4
}   

export interface VoiceActivity
{
    channelId:  number,
    joinDate:   Date
}

class EventLogger
{
    bot:    DiscordBot
    flags:  Events
    dbURI:  String
    
    voiceUser: Map<number, VoiceActivity>
    
    constructor(bot: DiscordBot, dbURI: String, eventFlags: Events)
    {
        this.bot   = bot
        this.flags = eventFlags
        this.dbURI = dbURI
        
        this.voiceUser = new Map<number, VoiceActivity>()
    }

    Initialize()
    {
        return new Promise((resolve, reject) =>
        {
            mongoose.connect(this.dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
            
            .then(
                this.HookEvents(),

                resolve("MongoDB connection succesful")
            )   
            .catch((error: any) =>
            {
                reject (new Error("MongoDB connection failed: " + error))
            })
        })
    }

    HookEvents()
    {
        this.bot.on(DispatchEvents.MessageReactionAdd, (event: any) =>
        {
            if (this.flags && (this.flags & Events.Messages))
            {
                return;
            }

            Message.findOneAndUpdate(
            {
                message_id: event.d.message_id
            },
            {
                $push: {
                    reacts: event.d.emoji.name
                }
            }
            ).then(
                (success : any) => { },
                (error   : any) => { console.log("Error logging message reaction: " + error)  }
            )
        })
        
        this.bot.on(DispatchEvents.MessageReactionRemove, (event: any) =>
        {
            if (this.flags && (this.flags & Events.Messages))
            {
                return;
            }
            
            Message.findOneAndUpdate(
            {
                message_id: event.d.message_id
            },
            {
                $pull: {
                    reacts: event.d.emoji.name
                }
            }
            ).then(
                (success : any) => { },
                (error   : any) => { console.log("Error removing message reaction: " + error) }
            )
        })
        
        this.bot.on(DispatchEvents.MessageCreate, (message: any) =>
        {
            if (this.flags && !(this.flags & Events.Messages))
            {
                return;
            }

            // make sure the message is not sent from webhook
            // or ephemeral 
            if (!message.d.guild_id || !message.d.member)
            {
                return;
            }

            let author = message.d.author.global_name

            if (message.d.member.nick)
            {
                author = message.d.member.nick   
            }

            const msg = new Message({
                guild_id: message.d.guild_id,
                message_id: message.d.id,
                user_id: message.d.author.id,
                user_nick: author,
                content: message.d.content ? message.d.content : "",
            })
        
            msg.save().then(() => {}).catch((error : any) =>
            {
                console.log("Failed to log message: " + error)
            })
            
        })

        this.bot.on(DispatchEvents.VoiceStateUpdate, (event: any) =>
        {
            if (this.flags && !(this.flags & Events.VoiceChat))
            {
                return;
            }
            
            this.OnVoiceActivity(event)
        })
    }

    OnVoiceActivity(event : any)
    {
        if (!event.d.member)
        {
            return   
        }

        if (this.voiceUser.get(event.d.user_id))
        {
            let t2 = new Date().getTime()
            let t1 = this.voiceUser.get(event.d.user_id)!.joinDate.getTime()

            let duration = (t2 - t1!) / 1000
            
            const voiceActivity = new VoiceActivity(
            {
                user_id:             event.d.user_id,
                channel_id:          this.voiceUser.get(event.d.user_id)!.channelId,
                user:                event.d.member.nick ? event.d.member.nick : event.d.member.user.global_name ? event.d.member.user.global_name : event.d.member.user.username,
                duration_in_seconds: duration,
                join_date:           this.voiceUser.get(event.d.user_id)!.joinDate
            })
        
            voiceActivity.save().then(() => {}).catch((error : any) =>
            {
                console.log("Failed to log voice activity: " + error)
            })

            //console.log("User spent " + ((t2-(t1!))/1000) + " seconds on voice channel " + this.voiceUser.get(event.d.user_id)!.channelId); 
        }

        if (event.d.channel_id)
        {
            let activity = 
            {
                channelId: event.d.channel_id,
                joinDate:  new Date()
            }

            this.voiceUser.set(event.d.user_id, activity);    
            
            //console.log("User joined channel " + event.d.channel_id + " at " + activity.joinDate)
        }
        else
        {
            this.voiceUser.delete(event.d.user_id);    
        }
    }

}

module.exports = { EventLogger, Events }