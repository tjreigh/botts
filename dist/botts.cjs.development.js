'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

function _interopNamespace(e) {
	if (e && e.__esModule) { return e; } else {
		var n = {};
		if (e) {
			Object.keys(e).forEach(function (k) {
				var d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: function () {
						return e[k];
					}
				});
			});
		}
		n['default'] = e;
		return n;
	}
}

var fs = require('fs');
var path = _interopDefault(require('path'));
var discord_js = require('discord.js');
var pkg = _interopDefault(require('chalk'));

const {
  red,
  yellow,
  blue,
  magenta,
  green
} = pkg;

(function (LogLevel) {
  LogLevel[LogLevel["Error"] = 0] = "Error";
  LogLevel[LogLevel["Warning"] = 1] = "Warning";
  LogLevel[LogLevel["Info"] = 2] = "Info";
  LogLevel[LogLevel["Debug"] = 3] = "Debug";
  LogLevel[LogLevel["Verbose"] = 4] = "Verbose";
})(exports.LogLevel || (exports.LogLevel = {}));

class Logger {
  constructor(level = exports.LogLevel.Info) {
    this.colors = [red, yellow, blue, magenta, green];
    this.level = level;
  }

  emit(message, level = exports.LogLevel.Info) {
    if (typeof level == 'string') level = exports.LogLevel[level];
    if (level > this.level) return;
    console.log(this.colors[level](`[${exports.LogLevel[level]}]`), message.toString());
  }

}

class BotClass extends discord_js.Client {
  constructor(prefix, token, owners, options) {
    super(options);
    this.commands = new discord_js.Collection();
    this.events = new discord_js.Collection();
    this.logger = new Logger(options.logLevel);
    this.prefix = prefix;
    this.token = token;
    this.owners = owners;
    this.commandFolder = path.resolve(options.commandFolder);
    this.eventFolder = path.resolve(options.eventFolder);
    this.init();
  }

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
      throw this.logger.emit(`Uncaught error while attempting init sequence: \n${error}`, exports.LogLevel.Error);
    }
  }

  async registerCommands() {
    const commandFiles = fs.readdirSync(this.commandFolder).filter(file => file.endsWith('.js'));
    this.logger.emit(`commandfiles = ${commandFiles}`, exports.LogLevel.Verbose);

    for (const file of commandFiles) {
      var _command$aliases;

      const fullPath = path.resolve(path.join(this.commandFolder, file));
      this.logger.emit(`fullPath = ${fullPath}`, exports.LogLevel.Verbose);
      this.logger.emit(`Attempting to register commands in ${fullPath}`, exports.LogLevel.Debug);
      let command;

      try {
        command = new (await new Promise(function (resolve) { resolve(_interopNamespace(require(fullPath))); })).default(this);
      } catch (error) {
        this.logger.emit(`Error while registering commands: \n${error}`, exports.LogLevel.Error);
      }

      this.logger.emit(`command = ${command.name}`, exports.LogLevel.Verbose);
      this.commands.set(command.name, command);
      (_command$aliases = command.aliases) == null ? void 0 : _command$aliases.forEach(alias => {
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
      const event = new (await new Promise(function (resolve) { resolve(_interopNamespace(require(fullPath))); })).default(this);
      const eName = event.name || file;
      const once = event.once;
      this[once ? 'once' : 'on'](eName, (...args) => {
        event.run(...args);
        this.logger.emit(`dispatched event with name ${eName}`, exports.LogLevel.Debug);
      });
    }
  }

  async commandDispatcher(message) {
    var _args$shift;

    if (message.partial || !message.content.startsWith(this.prefix) || message.content.length < this.prefix.length || message.author.bot) return;
    const args = message.content.slice(this.prefix.length).split(' ');
    const command = (_args$shift = args.shift()) == null ? void 0 : _args$shift.toLowerCase();
    if (!this.commands.has(command)) return;

    if (command === 'reload') {
      await this.registerCommands();
      message.reply('reloaded');
    } else if (command === 'unload') {
      const hasCmd = this.commands.has(args[0]);
      this.logger.emit(`hasCmd ${hasCmd}`, exports.LogLevel.Verbose);
      if (!hasCmd) return;
      this.commands.delete(args[0]);
      this.logger.emit(Array.from(this.commands.keys()).toString(), exports.LogLevel.Verbose);
      message.reply('unloaded');
    } else if (command === 'reinit') {
      await this.init();
      message.reply('reinit');
    }

    this.logger.emit(`commandKeys = ${Array.from(this.commands.keys()).join(', ').toString()}`, exports.LogLevel.Verbose); // Simpler search mentioned in registerCommands()

    const cmd = this.commands.find(cmd => cmd.name === command);
    if (!cmd) throw this.logger.emit(`Could not find command with name ${command}`, exports.LogLevel.Warning);
    if (cmd.ownerOnly && !this.owners.includes(message.author.id)) return;
    cmd.run(message, args);
    this.logger.emit(`dispatched command with name ${cmd.name}`, exports.LogLevel.Debug);
  }

}

class Command {
  constructor(client) {
    this.ownerOnly = false;
    this.shouldHandle = true;
    this.client = client;
  }

}

class Event {
  constructor(client) {
    this.once = false;
    this.client = client;
  }

}

exports.BotClass = BotClass;
exports.Command = Command;
exports.Event = Event;
exports.Logger = Logger;
//# sourceMappingURL=botts.cjs.development.js.map
