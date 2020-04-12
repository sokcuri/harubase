import HaruBase from '.';
import discord from 'discord.js';

export * from '.';

export interface Module {
  active: boolean;
  name: string;

  channels: string[];

  doMessage: (harubase: HaruBase, message: discord.Message, commandPair?: CommandPair) => boolean;
}

export interface CommandPair {
  command: string;
  arguments?: string[];
}

export interface HaruBaseArgs {
  discordKey: string;
  modulePath: string;
}
