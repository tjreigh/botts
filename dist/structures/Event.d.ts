import { BotClass } from './BotClass';
export declare abstract class Event {
    constructor(client: BotClass);
    client: BotClass;
    once: boolean;
    abstract name: string;
    abstract run(...args: any[]): void;
}
