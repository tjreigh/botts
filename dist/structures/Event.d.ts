import { BotClass } from './BotClass';
export declare abstract class Event {
    constructor(client: BotClass);
    client: BotClass;
    abstract name: string;
    abstract once: boolean;
    abstract run(...args: any[]): void;
}
