import { Client, ClientOptions, ClientUser, Message, PartialMessage, Snowflake } from 'discord.js';
import { Logger, LogLevel } from './Logger';
interface _BotOptions extends ClientOptions {
    commandFolder: string;
    eventFolder: string;
    logLevel?: LogLevel;
}
export declare class BotClass extends Client {
    constructor(prefix: string, token: string, owners: Snowflake[], options: _BotOptions);
    prefix: string;
    token: string;
    logger: Logger;
    user: ClientUser;
    private owners;
    private commands;
    private events;
    protected readonly commandFolder: string;
    protected readonly eventFolder: string;
    init(): Promise<void>;
    registerCommands(): Promise<void>;
    eventDispatcher(): Promise<void>;
    commandDispatcher(message: Message | PartialMessage): Promise<void>;
}
export {};
