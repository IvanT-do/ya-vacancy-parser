import { DataSource } from "typeorm"
import {Vacancy} from "./entity/Vacancy";
import {TelegramTarget} from "./entity/TelegramTarget";

const [host, port] = (process.env.DATABASE_HOST ?? ":").split(":")

export const dataSource = new DataSource({
    type: "mysql",
    host,
    port: Number(port),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [Vacancy, TelegramTarget],
    logging: true,
    synchronize: true
})