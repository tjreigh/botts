import { BotClass } from './BotClass';

export abstract class Event {
	constructor(client: BotClass) {
		this.client = client;
	}

	client: BotClass;
	once: boolean = false;
	abstract name: string;
	abstract run(...args: any[]): void;
}
