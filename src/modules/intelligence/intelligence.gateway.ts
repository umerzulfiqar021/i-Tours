import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class IntelligenceGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(IntelligenceGateway.name);

  /**
   * Notifies clients that insights for a specific trip are ready.
   * @param tripId The ID of the trip plan
   * @param data The generated insights and hotels
   */
  emitInsightsReady(tripId: number, data: any) {
    this.logger.log(`Emitting trip_insights_ready event for trip ${tripId}`);
    this.server.emit('trip_insights_ready', {
      tripId,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}
