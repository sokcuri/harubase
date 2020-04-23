import { EventEmitter } from 'events';
import { Module, ModuleObject, HaruBaseArgs } from './interface';

import discord from 'discord.js';

export class HaruBase extends EventEmitter {
  private client: discord.Client;
  private modules: Module[];
  private args: HaruBaseArgs;

  constructor(args: HaruBaseArgs) {
    super();

    this.args = args;
    this.modules = [];
  }

  public setup(): void {
    this.modules = [];

    this.client = new discord.Client();
    this.client.once('ready', () => this.init());
    this.client.on('ready', (channel: discord.Channel) => this.ready(channel));
    this.client.on('message', (message: discord.Message) => this.message(message));
    this.client.login(this.args.discordKey);
  }

  private async init(): Promise<void> {
    await this.register();
  }

  private async ready(channel: discord.Channel): Promise<void> {
    this.emit('ready', channel);
  }

  private async message(message: discord.Message): Promise<void> {
    const checkExistChannel = (channels: string[], id: string): boolean => {
      return !!channels?.filter((x) => x === id).length;
    };

    const checkAvailableChannel = (inst: Module, message: discord.Message): boolean => {
      return checkExistChannel(inst.channels, '*') ||
        checkExistChannel(inst.channels, message.channel.id);
    };

    const getActiveModules = (): Module[] => {
      return this.modules.filter((inst) => inst.active);
    };

    if (!message.author.equals(this.client.user)) {
      for (const inst of getActiveModules()) {
        if (checkAvailableChannel(inst, message)) {
          const { cmd, args } = this.parse(message);
          const result = await inst.message(message, cmd, args);
          if (result) break;
        }
      }
    }
    this.emit('message', message);
  }

  private async register(): Promise<void> {
    for (const entry of this.args.moduleEntries) {
      const obj: ModuleObject = await import(entry.path);
      const [k, v] = Object.entries(obj)[0];
      if (entry.name.indexOf(k) === -1) {
        throw new Error('module name must be the same as the export function name');
      }
      this.modules.push(new v);
    }
  }

  private parse(message: discord.Message) {
    const regex = /<@[^>].+>\s?/;
    const args = message.content.replace(regex, '').split(' ');
    const cmd = args.shift()?.toLowerCase();
    return { cmd, args };
  }
}

export default HaruBase;
