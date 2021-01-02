import * as fs from 'fs';
import path from 'path';
import {
	Client,
	ClientOptions,
	ClientUser,
	Collection,
	Message,
	PartialMessage,
	Snowflake,
} from 'discord.js';
import { Command } from './Command';
import { Logger, LogLevel } from './Logger';
import { Event } from './Event';

interface _BotOptions extends ClientOptions {
	commandFolder: string;
	eventFolder: string;
	logLevel?: LogLevel;
}

export class BotClass extends Client {
	constructor(prefix: string, token: string, owners: Snowflake[], options: _BotOptions) {
		super(options);
		this.logger = new Logger(options.logLevel);
		this.prefix = prefix;
		this.token = token;
		this.owners = owners;
		this.commandFolder = path.resolve(options.commandFolder);
		this.eventFolder = path.resolve(options.eventFolder);
		this.init();
	}

	prefix: string;
	token: string;
	logger: Logger;
	user!: ClientUser;
	private owners: Snowflake[];
	private commands: Collection<string, Command> = new Collection();
	private events: Collection<string, Event> = new Collection();
	protected readonly commandFolder: string;
	protected readonly eventFolder: string;

	async init() {
		try {
			await this.registerCommands();
			await this.eventDispatcher();
			this.on('message', message => this.commandDispatcher(message));
			this.on('messageUpdate', message => this.commandDispatcher(message));
			await this.login(this.token);

			setInterval(() => {
				this.logger.emit(`[ws] Heartbeat ping: ${this.ws.ping}`);
			}, 30000);
		} catch (error) {
			throw this.logger.emit(
				`Uncaught error while attempting init sequence: \n${error}`,
				LogLevel.Error
			);
		}
	}

	async registerCommands() {
		const commandFiles = fs.readdirSync(this.commandFolder).filter(file => file.endsWith('.js'));
		this.logger.emit(`commandfiles = ${commandFiles}`, LogLevel.Verbose);

		for (const file of commandFiles) {
			const fullPath = path.resolve(path.join(this.commandFolder, file));
			this.logger.emit(`fullPath = ${fullPath}`, LogLevel.Verbose);
			this.logger.emit(`Attempting to register commands in ${fullPath}`, LogLevel.Debug);
			let command!: Command;

			try {
				command = new (await import(fullPath)).default(this);
			} catch (error) {
				this.logger.emit(`Error while registering commands: \n${error}`, LogLevel.Error);
			}

			this.logger.emit(`command = ${command.name}`, LogLevel.Verbose);
			this.commands.set(command.name, command);

			command.aliases?.forEach((alias: string) => {
				/* Clone command without using slow Object.setPrototypeOf()
				This isn't clean but registers aliases as first-class commands,
				simplifying the command search in the dispatcher */
				const newCmd = Object.assign(Object.create(Object.getPrototypeOf(command)), command);
				newCmd.name = alias;
				this.commands.set(alias, newCmd);
			});
		}
	}

	async eventDispatcher() {
		const eventFiles = fs.readdirSync(this.eventFolder).filter(file => file.endsWith('.js'));

		for (const file of eventFiles) {
			const fullPath = path.resolve(path.join(this.eventFolder, file));
			const event = new (await import(fullPath)).default(this);
			const eName: string = event.name || file;
			const once: boolean = event.once;

			this[once ? 'once' : 'on'](eName, (...args) => {
				event.run(...args);
				this.logger.emit(`dispatched event with name ${eName}`, LogLevel.Debug);
			});
		}
	}

	async commandDispatcher(message: Message | PartialMessage) {
		if (
			message.partial ||
			!message.content.startsWith(this.prefix) ||
			message.content.length < this.prefix.length ||
			message.author.bot
		)
			return;

		const args = message.content.slice(this.prefix.length).split(' ');
		const command = args.shift()?.toLowerCase() as string;
		if (!this.commands.has(command)) return;

		if (command === 'reload') {
			await this.registerCommands();
			message.reply('reloaded');
		} else if (command === 'unload') {
			const hasCmd = this.commands.has(args[0]);
			this.logger.emit(`hasCmd ${hasCmd}`, LogLevel.Verbose);
			if (!hasCmd) return;
			this.commands.delete(args[0]);
			this.logger.emit(Array.from(this.commands.keys()).toString(), LogLevel.Verbose);
			message.reply('unloaded');
		} else if (command === 'reinit') {
			await this.init();
			message.reply('reinit');
		}

		this.logger.emit(
			`commandKeys = ${Array.from(this.commands.keys())
				.join(', ')
				.toString()}`,
			LogLevel.Verbose
		);

		// Simpler search mentioned in registerCommands()
		const cmd = this.commands.find(cmd => cmd.name === command);
		if (!cmd)
			throw this.logger.emit(`Could not find command with name ${command}`, LogLevel.Warning);

		if (cmd.ownerOnly && !this.owners.includes(message.author.id)) return;
		cmd.run(message, args);
		this.logger.emit(`dispatched command with name ${cmd.name}`, LogLevel.Debug);
	}
}
