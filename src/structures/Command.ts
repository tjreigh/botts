import { Message } from 'discord.js';
import { BotClass } from './BotClass';

export abstract class Command {
	constructor(client: BotClass) {
		this.client = client;
	}

	client!: BotClass;
	abstract name: string;
	aliases?: string[];
	ownerOnly?: boolean = false;
	abstract description: string;
	abstract run(message: Message, args: string[]): Promise<Message | void> | void;
	protected shouldHandle = true;
}
