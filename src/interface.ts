import HaruBase from '.';
import discord from 'discord.js';
import { Entry } from 'fast-glob';

export * from '.';

export interface Module {
  active: boolean;
  name: string;

  channels: string[];

  doMessage: (harubase: HaruBase, message: discord.Message, commandPair?: CommandPair) => Promise<boolean>;
}

type Newable = new(...args: never[]) => never;

export interface ModuleObject {
  [name: string]: Module & Newable;
}

export interface CommandPair {
  command: string;
  arguments?: string[];
}

export interface HaruBaseArgs {
  discordKey: string;
  moduleEntries: Entry[];
}
