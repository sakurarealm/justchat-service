import { Context, Schema, Service } from "koishi";
import { JustChatServer } from 'justchat-mc'
import { v4 as uuidv4 } from "uuid";

declare module 'koishi' {
    interface Context {
        justchat: JustChatService;
    }
}

interface Config {
    port: number;
    host?: string;
    maxConnections?: number;
    name?: string;
    id?: string;
}

export const Config = Schema.object({
    port: Schema.number().default(38080).description("JustChat服务器监听的端口").required(),
    host: Schema.string().description("JustChat服务器监听的地址"),
    maxConnections: Schema.number().description("JustChat服务器最大连接数"),
    name: Schema.string().description("JustChat服务器名称"),
    id: Schema.string().description("JustChat服务器UUID")
});

export class JustChatService extends Service {
    private config: Config;
    private server: JustChatServer;

    public constructor(ctx: Context, cfg: Config){
        super(ctx, 'justchat', true);
        this.config = cfg;
        this.server = new JustChatServer({
            port: this.config.port,
            host: this.config.host || '0.0.0.0',
            maxConnections: this.config.maxConnections || 100,
            name: this.config.name || 'JustChat Server',
            id: this.config.id || uuidv4()
        });
    }

    protected async start(): Promise<void> {
        await this.server.start();
    }

    protected async stop(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.server.close((err: any) => {
                if(err) reject(err);
                else resolve();
            });
        });
    }

    public getClientList(){
        return this.server.getClientList();
    }
}

export const name = 'justchat-service';

export function apply(ctx: Context, config: Config){
    ctx.plugin(JustChatService, config);
}