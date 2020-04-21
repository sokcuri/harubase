import { EventEmitter } from 'events';
import { Module, ModuleObject, HaruBaseArgs, CommandPair } from './interface';

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

  private isExistChannelList(channels: string[], id: string): boolean {
    return !!channels?.filter((x) => x === id).length;
  }

  public setup(): void {
    this.client = new discord.Client();
    this.client.on('ready', this.ready.bind(this));
    this.client.on('message', this.processMessage.bind(this));
    this.client.login(this.args.discordKey);
  }

  public async ready(channel: discord.Channel): Promise<void> {
    await this.registerMessage();
    this.emit('ready', channel);
  }

  public async registerMessage(): Promise<void> {
    for (const entry of this.args.moduleEntries) {
      const obj: ModuleObject = await import(entry.path);
      const [k, v] = Object.entries(obj)[0];
      if (entry.name.indexOf(k) === -1) {
        throw new Error('module name must be the same as the export function name');
      }
      this.modules.push(new v);
    }
  }

  public checkAvailableChannel(inst: Module, message: discord.Message): boolean {
    const channels = inst.channels;

    if (this.isExistChannelList(channels, '*')) {
      return true;
    }

    return this.isExistChannelList(channels, message.channel.id);
  }

  public processMessage(message: discord.Message): void {
    if (!message.author.equals(this.client.user)) {
      this.modules
        .filter((inst) => inst.active)
        .every(async (inst) => {
          return this.checkAvailableChannel(inst, message) ?
            await inst.doMessage(this, message, this.parseCommand(message)) : true;
      });
    }
    this.emit('message', message);
  }

  public parseCommand(message: discord.Message): CommandPair {
    const regex = /<@[^>].+>\s?/;
    const content = message.content.replace(regex, '').split(' ');
    return {
      command: content.shift()?.toLowerCase(),
      arguments: content,
    };
  }
}

export default HaruBase;
