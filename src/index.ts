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

  private isExistChannelList(channels: string[], id: string): boolean {
    return !!channels?.filter((x) => x === id).length;
  }

  private getActiveModules(): Module[] {
    return this.modules.filter((inst) => inst.active);
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

  public async processMessage(message: discord.Message): Promise<void> {
    if (!message.author.equals(this.client.user)) {
      for (const inst of this.getActiveModules()) {
        if (this.checkAvailableChannel(inst, message)) {
          const { cmd, args } = this.parseCommand(message);
          const result = await inst.message(message, cmd, args);
          if (result) break;
        }
      }
    }
    this.emit('message', message);
  }

  public parseCommand(message: discord.Message) {
    const regex = /<@[^>].+>\s?/;
    const args = message.content.replace(regex, '').split(' ');
    const cmd = args.shift()?.toLowerCase();
    return { cmd, args };
  }
}

export default HaruBase;
