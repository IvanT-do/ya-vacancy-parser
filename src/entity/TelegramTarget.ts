import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class TelegramTarget{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    chatId: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;
}