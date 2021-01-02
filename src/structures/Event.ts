import { BotClass } from './BotClass';

export abstract class Event {
	constructor(client: BotClass) {
		this.client = client;
	}

	client!: BotClass;
	abstract name: string;
	abstract once: boolean;
	abstract run(...args: any[]): void;
}
