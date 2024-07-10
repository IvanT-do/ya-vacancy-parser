import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Vacancy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    externalId: number;

    @Column()
    title: string;

    @Column({type: "text"})
    summary: string;

    @Column()
    url: string;

    @Column()
    dateCreate: Date;
}