import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface ActivityNotification {
  type: string;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    const token =
      client.handshake.auth?.token ??
      client.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const tenantId = payload.tenantId as string;
      await client.join(`tenant:${tenantId}`);
      this.logger.log(`Notification client ${client.id} joined tenant:${tenantId}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Notification client ${client.id} disconnected`);
  }

  pushToTenant(tenantId: string, notification: ActivityNotification): void {
    this.server.to(`tenant:${tenantId}`).emit('notification', notification);
  }
}
