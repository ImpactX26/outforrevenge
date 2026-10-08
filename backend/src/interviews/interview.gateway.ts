import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InterviewsService } from './interviews.service';

interface RoomSession {
  activeQuestion?: any;
  currentCode: string;
  language: string;
  participants: Map<string, { userId: string; role: string; socketId: string }>;
}

@WebSocketGateway({
  namespace: '/interview',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class InterviewGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InterviewGateway.name);
  private readonly roomSessions = new Map<string, RoomSession>();

  constructor(private readonly interviewsService: InterviewsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Socket client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket client disconnected: ${client.id}`);
    // Remove client from any active room tracking
    for (const [roomId, session] of this.roomSessions.entries()) {
      for (const [userId, p] of session.participants.entries()) {
        if (p.socketId === client.id) {
          session.participants.delete(userId);
          client.to(`room_${roomId}`).emit('participant:left', {
            userId,
            socketId: client.id,
            remainingCount: session.participants.size,
          });
          break;
        }
      }
    }
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; role: string },
  ) {
    const { roomId, userId, role } = data;
    const roomChannel = `room_${roomId}`;

    client.join(roomChannel);

    if (!this.roomSessions.has(roomId)) {
      this.roomSessions.set(roomId, {
        currentCode: '',
        language: 'typescript',
        participants: new Map(),
      });
    }

    const session = this.roomSessions.get(roomId)!;
    session.participants.set(userId, { userId, role, socketId: client.id });

    this.logger.log(`User ${userId} (${role}) joined room ${roomId} via socket ${client.id}`);

    // Notify room of participant join
    client.to(roomChannel).emit('participant:joined', {
      userId,
      role,
      socketId: client.id,
      participantsCount: session.participants.size,
    });

    // Send current session state to newly joined user
    client.emit('room:state', {
      roomId,
      currentCode: session.currentCode,
      language: session.language,
      activeQuestion: session.activeQuestion,
      participants: Array.from(session.participants.values()),
    });
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = data;
    const roomChannel = `room_${roomId}`;
    client.leave(roomChannel);

    const session = this.roomSessions.get(roomId);
    if (session) {
      session.participants.delete(userId);
      client.to(roomChannel).emit('participant:left', {
        userId,
        socketId: client.id,
        remainingCount: session.participants.size,
      });
    }
  }

  // --- WebRTC Signaling ---

  @SubscribeMessage('media:offer')
  handleMediaOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; offer: any; senderId: string },
  ) {
    client.to(`room_${data.roomId}`).emit('media:offer', {
      offer: data.offer,
      senderId: data.senderId,
      senderSocketId: client.id,
    });
  }

  @SubscribeMessage('media:answer')
  handleMediaAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; answer: any; senderId: string; targetSocketId?: string },
  ) {
    if (data.targetSocketId) {
      client.to(data.targetSocketId).emit('media:answer', {
        answer: data.answer,
        senderId: data.senderId,
        senderSocketId: client.id,
      });
    } else {
      client.to(`room_${data.roomId}`).emit('media:answer', {
        answer: data.answer,
        senderId: data.senderId,
        senderSocketId: client.id,
      });
    }
  }

  @SubscribeMessage('media:ice')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; candidate: any; senderId: string; targetSocketId?: string },
  ) {
    if (data.targetSocketId) {
      client.to(data.targetSocketId).emit('media:ice', {
        candidate: data.candidate,
        senderId: data.senderId,
      });
    } else {
      client.to(`room_${data.roomId}`).emit('media:ice', {
        candidate: data.candidate,
        senderId: data.senderId,
      });
    }
  }

  // --- Collaborative Monaco Code Editor Sync ---

  @SubscribeMessage('code:update')
  handleCodeUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; code: string; language?: string; senderId: string },
  ) {
    const session = this.roomSessions.get(data.roomId);
    if (session) {
      session.currentCode = data.code;
      if (data.language) session.language = data.language;
    }

    client.to(`room_${data.roomId}`).emit('code:update', {
      code: data.code,
      language: data.language,
      senderId: data.senderId,
    });
  }

  @SubscribeMessage('code:cursor')
  handleCursorUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; position: any; senderId: string },
  ) {
    client.to(`room_${data.roomId}`).emit('code:cursor', {
      position: data.position,
      senderId: data.senderId,
    });
  }

  @SubscribeMessage('code:run')
  async handleCodeRun(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; challengeId: string; userId: string; language: string; code: string },
  ) {
    const roomChannel = `room_${data.roomId}`;
    this.server.to(roomChannel).emit('code:running', { userId: data.userId });

    const result = await this.interviewsService.runCode(
      data.roomId,
      data.userId,
      data.challengeId,
      data.language,
      data.code,
    );

    this.server.to(roomChannel).emit('code:result', {
      userId: data.userId,
      result,
    });
  }

  // --- Chat Messages ---

  @SubscribeMessage('chat:message')
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; senderId: string; senderName: string; text: string; role: string },
  ) {
    const message = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    this.server.to(`room_${data.roomId}`).emit('chat:message', message);
  }

  // --- Interview Flow & Questions ---

  @SubscribeMessage('interview:question')
  handleQuestionBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; question: any },
  ) {
    const session = this.roomSessions.get(data.roomId);
    if (session) {
      session.activeQuestion = data.question;
    }
    this.server.to(`room_${data.roomId}`).emit('interview:question', data.question);
  }

  @SubscribeMessage('interview:state')
  handleStateBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; state: string },
  ) {
    this.server.to(`room_${data.roomId}`).emit('interview:state', data.state);
  }
}
