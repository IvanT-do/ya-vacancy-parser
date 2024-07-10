import { json } from "express"
import {CronJob} from "cron";
import axios from "axios";
import {VacanciesResponse, VacancyResult} from "./types/VacancyData";
import {Vacancy} from "./entity/Vacancy";

const express = require("express");
require("dotenv").config();

const dataSource = require("./app-data-source").myDataSource;

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

app.use(json());

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

CronJob.from({
    cronTime: "* * * */1 * *",
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
            console.log(dbList)
        }
        catch{}

        const newItems = results.filter(vacancy => alreadyInList.indexOf(vacancy.id) === -1);

        if(newItems.length){
            const getUrl = (vacancy: VacancyResult) => {
                const title = vacancy.title.toLowerCase().replace(/\s/g, "-");
                return `https://yandex.ru/jobs/vacancies/${title}-${vacancy.id}`
            }

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