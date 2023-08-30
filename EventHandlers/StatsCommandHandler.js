"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsCommandHandler = void 0;
const DBSchemas_1 = require("../DBSchemas");
const CommandHandler_1 = require("../CommandHandler");
/**
 * @classdesc Sends various user and server stats as a response to the /stats command
 */
class StatsCommandHandler extends CommandHandler_1.CommandHandler {
    constructor(client) {
        super(client, "stats");
    }
    GetServerStatsFormatted(guildId) {
        return __awaiter(this, void 0, void 0, function* () {
            let statsText = "Nu exista stats pentru server";
            yield Promise.all([
                //Find total number of messages sent
                DBSchemas_1.Message.find({ guild_id: guildId }).count(),
                // Find User who sent most messages
                DBSchemas_1.Message.aggregate([
                    {
                        $match: {
                            guild_id: guildId
                        }
                    },
                    {
                        $group: {
                            _id: "$user_id",
                            count: {
                                $sum: 1
                            }
                        }
                    },
                    {
                        $sort: {
                            "count": -1
                        }
                    }
                ]).limit(1),
                // Find User who spent most time on Voice Chat
                DBSchemas_1.VoiceActivity.aggregate([
                    {
                        $match: {
                            guild_id: guildId
                        }
                    },
                    {
                        $group: {
                            _id: "$user_id",
                            count: {
                                $sum: "$duration_in_ms"
                            }
                        }
                    },
                    {
                        $sort: {
                            "count": -1
                        }
                    }
                ]).limit(1),
                // Find longest voice chat session
                DBSchemas_1.VoiceActivity.find({ guild_id: guildId }).sort({ duration_in_ms: -1 }).limit(1)
            ])
                .then((data) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c;
                let msgCount = data[0];
                let mostMsgSent = (_a = data[1][0]) !== null && _a !== void 0 ? _a : 0;
                let vcMostTimeSpent = (_b = data[2][0]) !== null && _b !== void 0 ? _b : 0;
                let longestVcSession = (_c = data[3][0]) !== null && _c !== void 0 ? _c : 0;
                // Fetch user data for every user 
                yield Promise.allSettled([
                    // User who sent most messages
                    this.client.cache.GetGuildUser(guildId, mostMsgSent ? mostMsgSent._id : 0),
                    // User who spent most time on VC
                    this.client.cache.GetGuildUser(guildId, vcMostTimeSpent ? vcMostTimeSpent._id : 0),
                    // User who had the longest VC sesion
                    this.client.cache.GetGuildUser(guildId, longestVcSession ? mostMsgSent.user_id : 0)
                ]).then((users) => {
                    var _a, _b, _c;
                    users[0] = users[0].value;
                    users[1] = users[1].value;
                    users[2] = users[2].value;
                    let textMostMsg = users[0] ? (`${(_a = users[0].nickname) !== null && _a !== void 0 ? _a : users[0].username}  ${mostMsgSent.count}`) : "0";
                    let textMostVcTime = users[1] ? (` ${(_b = users[1].nickname) !== null && _b !== void 0 ? _b : users[1].username}  ${this.msToTime(vcMostTimeSpent.count)}`) : "0";
                    let textLongestVc = users[2] ? (` ${(_c = users[2].nickname) !== null && _c !== void 0 ? _c : users[2].username}  ${this.msToTime(longestVcSession.duration_in_ms)}`) : "0";
                    statsText = `Afisez stats pentru **server**\n`;
                    statsText += `Mesaje trimise în total:       **${msgCount}**\n`;
                    statsText += `Cele mai multe mesaje trimise: **${textMostMsg}**\n`;
                    statsText += `Cel mai mult timp petrecut pe voice: **${textMostVcTime}**\n`;
                    statsText += `Cea mai lunga sesiune de voice:      **${textLongestVc}**\n`;
                }).catch((error) => console.log(error));
            }));
            return Promise.resolve(statsText);
        });
    }
    GetUserStatsFormatted(guildId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let statsText = "Nu exista stats pentru acest utilizator";
            yield Promise.allSettled([
                this.client.cache.GetGuildUser(guildId, userId),
                DBSchemas_1.Message.find({ guild_id: guildId, user_id: userId }).count(),
                // Total time spent on VoiceChat
                DBSchemas_1.VoiceActivity.aggregate([
                    {
                        $match: {
                            guild_id: guildId,
                            user_id: userId
                        }
                    },
                    {
                        $group: {
                            _id: "$user_id",
                            TotalTimeSpent: { $sum: "$duration_in_ms" }
                        },
                    }
                ])
            ]).then((data) => {
                let guildUser = data[0].value;
                let messageCount = data[1].value;
                // Check if user spent time on VoiceChat
                let vcTimeSpent = data[2].value.length ? data[2].value[0] : 0;
                if (guildUser) {
                    let joinDate = Date.now(); //guildUser.joinDate;
                    let daysInGuild = Math.max(1, Date.now() - joinDate);
                    let dailyMsgCount = Math.round(messageCount / daysInGuild);
                    let dailyVoiceTime = vcTimeSpent / daysInGuild;
                    statsText = `Se afiseaza stats pentru  **${guildUser.nickname.length ? guildUser.nickname : guildUser.username}** \n`;
                    statsText += `Mesaje trimise în total: **${messageCount}**\n`;
                    statsText += `Mesaje trimise zilnic:   **${dailyMsgCount}**\n`;
                    statsText += `Timp petrecut pe Voice Chat: **${this.msToTime(vcTimeSpent)}**\n`;
                    statsText += `Activitate zilnică pe Voice: **${this.msToTime(dailyVoiceTime)}**`;
                }
            })
                .catch((error) => {
                console.log(error);
            });
            return Promise.resolve(statsText);
        });
    }
    OnCommand(parsedJsonData) {
        return __awaiter(this, void 0, void 0, function* () {
            let interactionId = parsedJsonData.d.id;
            let interactionToken = parsedJsonData.d.token;
            let stats = "A aparut o eroare, te rog sa incerci din nou.";
            let guildId = parsedJsonData.d.guild_id;
            if (parsedJsonData.d.data.options) {
                let userId = parsedJsonData.d.data.options[0].value;
                yield this.GetUserStatsFormatted(guildId, userId).then((data) => stats = data);
            }
            else {
                yield this.GetServerStatsFormatted(guildId).then((data) => stats = data);
            }
            this.client.rest.SendInteractionResponse(interactionId, interactionToken, stats);
        });
    }
    msToTime(s) {
        var pad = (n, z = 1) => ('00' + n).slice(-z);
        return pad(s / 3.6e6 | 0) + 'h : ' + pad((s % 3.6e6) / 6e4 | 0) + 'm';
    }
}
exports.StatsCommandHandler = StatsCommandHandler;
