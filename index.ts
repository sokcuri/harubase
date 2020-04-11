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
        console.log('bot ready');
        this.registerMessage();
    }

    public registerMessage() {
        this.modules = Object.keys(this.command)
            .map(key => new this.command[key]());
    }

    public checkAvailableChannel(inst: I.Module, message: discord.Message) {
        const channels = inst.channels;

        const isExistChannelList = (channels: string[], id: string) => {
            return !!channels?.filter(x => x === id).length;
        };

        // 모든 채널 화이트리스트
        if (isExistChannelList(channels, '*')) {
            return true;
        }

        const result = isExistChannelList(channels, message.channel.id);
        if (!result) {
            console.log('checkAvailableChannel', inst.name, 'isExistChannelList = false');
        }
        return result;
    }

    public processMessage(message: discord.Message) {
        message.author.equals(this.client.user) ? '' :
            this.modules
                .filter(inst => inst.active)
                .every(
                    inst => this.checkAvailableChannel(inst, message) ?
                    inst.doMessage(this, message, this.parseCommand(message)) : true);
    }

    public parseCommand(message: discord.Message): I.CommandPair {
        const regex = /<@[^>].+>\s?/;
        const content = message.content.replace(regex, '').split(' ');
        return {
            command: content.shift()!.toLowerCase(),
            arguments: content
        };
    }
};

export default HaruBase;