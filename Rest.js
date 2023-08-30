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
exports.Rest = void 0;
const https = require("https");
class Rest {
    constructor() {
    }
    /**
     *
     * @param {number} interactionId Interaction id fetched from the interaction data
     * @param {number} interactionToken Interaction token fetched from the interaction data
     * @param {string} content The response sent by the bot
     * @returns
     */
    SendInteractionResponse(interactionId, interactionToken, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqUrl = `https://discord.com/api/v10/interactions/${interactionId}/${interactionToken}/callback`;
            return fetch(reqUrl, {
                method: 'POST',
                body: JSON.stringify({
                    type: 4,
                    data: {
                        "content": content
                    }
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            }).catch((error) => console.log("InteractionResponse error"));
        });
    }
}
exports.Rest = Rest;
