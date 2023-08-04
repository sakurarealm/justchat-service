import { Context, Schema, Service } from "koishi";
import {
  JustChatServer,
  SendChatMessage,
  SendListMessage,
  SimpleClient,
} from "@sakurarealm/justchat-mc";
import { v4 as uuidv4 } from "uuid";

declare module "koishi" {
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
  port: Schema.number()
    .default(38080)
    .description("JustChat服务器监听的端口")
    .required(),
  host: Schema.string().description("JustChat服务器监听的地址"),
  maxConnections: Schema.number().description("JustChat服务器最大连接数"),
  name: Schema.string().description("JustChat服务器名称"),
  id: Schema.string().description("JustChat服务器UUID"),
});

export class JustChatService extends Service {
  private config: Config;
  private server: JustChatServer;

  public constructor(ctx: Context, cfg: Config) {
    super(ctx, "justchat", true);
    this.config = cfg;
    this.server = new JustChatServer({
      port: this.config.port,
      host: this.config.host || "0.0.0.0",
      maxConnections: this.config.maxConnections || 100,
      name: this.config.name || "JustChat Server",
      id: this.config.id || uuidv4(),
    });
  }

  protected async start(): Promise<void> {
    await this.server.start();
  }

  protected async stop(): Promise<void> {
    return await new Promise<void>((resolve, reject) => {
      this.server.close((err: any) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  // 获取客户端列表
  // Get client list
  public getClientList() {
    return this.server.getClientList();
  }

  // 发送聊天消息
  // Send a chat message
  public sendChatMessage(message: SendChatMessage, client: SimpleClient) {
    return this.server.sendChatMessage(message, client);
  }

  // 发送列表消息
  // Send a list message
  public sendListMessage(message: SendListMessage, client: SimpleClient) {
    return this.server.sendListMessage(message, client);
  }

  // 为单个客户端注册消息监听器
  // Register a message listener for a single client
  public registerChatListener(
    client: SimpleClient,
    listener: (message: any) => void
  ) {
    return this.server.on(
      "chat",
      (message: SendChatMessage, cli: SimpleClient) => {
        if (client.name === cli.name && client.uuid === cli.uuid)
          listener(message);
      }
    );
  }

  // 为单个客户端注册列表包监听器
  // Register a list message listener for a single client
  public registerListListener(
    client: SimpleClient,
    listener: (message: any) => void
  ) {
    return this.server.on(
      "list",
      (message: SendListMessage, cli: SimpleClient) => {
        if (client.name === cli.name && client.uuid === cli.uuid)
          listener(message);
      }
    );
  }

  // 注册“新客户端注册”监听器
  // Register a listener for "new client registered" event
  public addRegistrationListener(listener: (cli: SimpleClient) => void) {
    return this.server.on("register", listener);
  }
}

export const name = "@justchat/service";

export function apply(ctx: Context, config: Config) {
  ctx.plugin(JustChatService, config);
}
