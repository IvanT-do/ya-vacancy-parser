import { json } from "express"
import {CronJob} from "cron";
import axios from "axios";
import {VacanciesResponse, VacancyResult} from "./types/VacancyData";
import {Vacancy} from "./entity/Vacancy";
import {TelegramTarget} from "./entity/TelegramTarget";

require("dotenv").config();

const express = require("express");
const {dataSource} = require("./app-data-source");
const TelegramBot = require('node-telegram-bot-api');

dataSource
    .initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err)
    })

const app = express();
const port = process.env.PORT;

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

        console.log(chatCount)

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

app.use(json());

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

CronJob.from({
    cronTime: "* */1 * * *",
    onTick: async () => {
        const fetchByUrl = async (url: string) => {
            const { data } = await axios.get<VacanciesResponse>(url);

            if(data.next){
                return data.results.concat(await fetchByUrl(data.next));
            }

            return data.results;
        }

        const results = await fetchByUrl("https://yandex.ru/jobs/api/publications/?page_size=20&cities=nizhniy-novgorod&public_professions=frontend-developer&v=0&v=2");
        let alreadyInList = [];

        try{
            const dbList = await dataSource
                .getRepository(Vacancy)
                .createQueryBuilder("vacancy")
                .getMany();

            alreadyInList = dbList.map(item => item.externalId);
        }
        catch{}

        const newItems = results.filter(vacancy => alreadyInList.indexOf(vacancy.id) === -1);

        if(newItems.length){
            const getUrl = (vacancy: VacancyResult) => {
                const title = vacancy.title.toLowerCase().replace(/\s/g, "-");
                return `https://yandex.ru/jobs/vacancies/${title}-${vacancy.id}`
            }

            const targets = await dataSource
                .getRepository(TelegramTarget)
                .createQueryBuilder("target")
                .getMany();

            console.log("Найдено", newItems.length, "новых вакансий");

            targets.forEach(user => {
                newItems.forEach((vacancy) => {
                    const message = `<b>Новая вакансия в Яндексе!\n«${vacancy.title}»</b>\n${vacancy.short_summary}\n${getUrl(vacancy)}`;
                    bot.sendMessage(user.chatId, message, {
                        parse_mode: "HTML",
                        entities: [{
                            type: "url",
                            offset: 0,
                            length: 1,
                            url: getUrl(vacancy)
                        }]
                    })
                })
            })

            await dataSource
                .createQueryBuilder()
                .insert()
                .into(Vacancy)
                .values(newItems.map(val => ({
                    externalId: val.id,
                    title: val.title,
                    summary: val.short_summary,
                    url: getUrl(val),
                    dateCreate: new Date()
                })))
                .execute();
        }
    },
    start: true,
    timeZone: 'Europe/Moscow'
})