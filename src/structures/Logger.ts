import pkg from 'chalk';
const { red, yellow, blue, magenta, green } = pkg;

export enum LogLevel {
	Error = 0,
	Warning,
	Info,
	Debug,
	Verbose,
}

type LevelStrings = keyof typeof LogLevel;

export class Logger {
	constructor(level: LogLevel = LogLevel.Info) {
		this.level = level;
	}

	public level: LogLevel;
	private colors = [red, yellow, blue, magenta, green];

	emit(message: any, level: LevelStrings | LogLevel = LogLevel.Info) {
		if (typeof level == 'string') level = LogLevel[level];
		if (level > this.level) return;
		console.log(this.colors[level](`[${LogLevel[level]}]`), message.toString());
	}
}
