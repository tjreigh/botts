import { Message } from 'discord.js';
import { BotClass } from './BotClass';
export declare abstract class Command {
    constructor(client: BotClass);
    client: BotClass;
    abstract name: string;
    aliases?: string[];
    ownerOnly?: boolean;
    abstract description: string;
    abstract run(message: Message, args: string[]): Promise<Message | void>;
    protected shouldHandle: boolean;
}
