import path from 'path';
import discord from 'discord.js';
import { EventEmitter } from 'events';
import * as I from './interface';

export class HaruBase extends EventEmitter {
  private client: discord.Client;
  private modules: I.Module[];
  private args: I.HaruBaseArgs;
  private command: any[];

  constructor(args: I.HaruBaseArgs) {
    super();

    this.args = args;
  }

  public async setup() {
    this.command = await import(path.join(this.args.modulePath, 'index.ts'));

    this.client = new discord.Client();
    this.client.on('ready', this.ready.bind(this));
    this.client.on('message', this.processMessage.bind(this));
    this.client.login(this.args.discordKey);
  }

  public ready(channel: discord.Channel) {
    this.registerMessage();
  }

  public registerMessage() {
    this.modules = Object.keys(this.command).map((key) => new this.command[key]());
  }

  private isExistChannelList(channels: string[], id: string) {
    return !!channels?.filter((x) => x === id).length;
  }

  public checkAvailableChannel(inst: I.Module, message: discord.Message) {
    const channels = inst.channels;

    // is channel whitelists
    if (this.isExistChannelList(channels, '*')) {
      return true;
    }

    const result = this.isExistChannelList(channels, message.channel.id);
    return result;
  }

  public processMessage(message: discord.Message) {
    if (!message.author.equals(this.client.user)) {
      this.modules
        .filter((inst) => inst.active)
        .every((inst) =>
          this.checkAvailableChannel(inst, message) ? inst.doMessage(this, message, this.parseCommand(message)) : true,
        );
    }
  }

  public parseCommand(message: discord.Message): I.CommandPair {
    const regex = /<@[^>].+>\s?/;
    const content = message.content.replace(regex, '').split(' ');
    return {
      command: content.shift()!.toLowerCase(),
      arguments: content,
    };
  }
}

export default HaruBase;
