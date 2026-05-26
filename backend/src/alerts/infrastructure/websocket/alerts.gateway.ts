import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ namespace: '/alerts', cors: { origin: '*' } })
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(AlertsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      this.logger.warn(`WS client ${client.id} rejected — no token`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const tenantId = payload.tenantId as string;
      await client.join(`tenant:${tenantId}`);
      this.logger.log(`WS client ${client.id} connected to tenant:${tenantId}`);
    } catch {
      this.logger.warn(`WS client ${client.id} rejected — invalid token`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WS client ${client.id} disconnected`);
  }

  pushToTenant(tenantId: string, payload: Record<string, unknown>): void {
    this.server.to(`tenant:${tenantId}`).emit('alert', payload);
  }
}
