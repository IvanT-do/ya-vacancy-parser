import {TelegramTarget} from "./entity/TelegramTarget";

const {dataSource} = require("./app-data-source");
const TelegramBot = require('node-telegram-bot-api');

export function start() {
    const bot = new TelegramBot(process.env.BOT_API_KEY, {
        polling: true
    });

    bot.on("text", async (msg) => {
        if(!msg.from.is_bot && msg.chat.id === msg.from.id && msg.text === "/start"){
            const chatCount = await dataSource
                .getRepository(TelegramTarget)
                .createQueryBuilder("target")
                .where("target.chatId = :id", {id: msg.chat.id})
                .getCount();

            if(chatCount === 0){
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(TelegramTarget)
                    .values({
                        chatId: msg.chat.id,
                        firstName: msg.from.first_name,
                        lastName: msg.from.last_name
                    })
                    .execute();

                await bot.sendMessage(msg.chat.id, "Вы подписались на уведомления о новых вакансиях!");
            }
        }
    });

    return bot;
}