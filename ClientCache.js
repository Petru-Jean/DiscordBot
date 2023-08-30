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
exports.ClientCache = void 0;
class ClientCache {
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    GetGuildUser(guildId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.redisClient.hmGet(`guild#${guildId}:user#${userId}`, ["userId", "guildId", "username", "nickname", "joinDate"]).then((data) => {
                    if (!data[0]) {
                        return reject(undefined);
                    }
                    return resolve({
                        userId: data[0],
                        guildId: data[1],
                        username: data[2],
                        nickname: data[3],
                        joinDate: Number(data[4])
                    });
                }).catch((error) => reject(error));
            }));
        });
    }
    SetGuildUser(guildUser) {
        this.redisClient.hSet(`guild#${guildUser.guildId}:user#${guildUser.userId}`, Object.assign({}, guildUser));
    }
}
exports.ClientCache = ClientCache;
