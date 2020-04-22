import discord from 'discord.js';
import { Entry } from 'fast-glob';

export * from '.';

export interface Module {
  active: boolean;
  name: string;

  channels: string[];
  message: (msg: discord.Message, cmd: string, args: string[]) => Promise<boolean>;
}

type Newable = new(...args: never[]) => never;

export interface ModuleObject {
  [name: string]: Module & Newable;
}

export interface HaruBaseArgs {
  discordKey: string;
  moduleEntries: Entry[];
}
