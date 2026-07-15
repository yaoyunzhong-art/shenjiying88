/**
 * realtime.service.ts — Realtime Service (canonical name)
 *
 * 🐜 V18: WebSocket实时通信+房间管理服务
 * - createRoom() — 创建实时聊天/协作房间
 * - joinRoom() — 加入房间
 * - leaveRoom() — 离开房间
 * - sendMessage() — 发送消息
 * - getRoomStatus() — 查询房间状态
 * - listRooms() — 列出活跃房间
 */

import { Injectable, Logger } from '@nestjs/common';
import { CollabService } from './collab.service';

// ==================== 类型定义 ====================

export interface RoomParticipant {
  userId: string;
  joinedAt: number;
  role: 'owner' | 'editor' | 'viewer';
  lastActive: number;
}

export interface Room {
  roomId: string;
  name: string;
  docId: string;
  ownerId: string;
  participants: RoomParticipant[];
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  status: 'active' | 'archived' | 'closed';
}

export interface RoomMessage {
  messageId: string;
  roomId: string;
  userId: string;
  content: string;
  type: 'text' | 'operation' | 'system';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface RoomStatus {
  roomId: string;
  name: string;
  status: string;
  participantCount: number;
  participants: RoomParticipant[];
  messageCount: number;
  createdAt: number;
  lastActivity: number;
}

export interface SendMessageResult {
  messageId: string;
  deliveredTo: string[];
  timestamp: number;
}

// ==================== RealtimeService ====================

/**
 * RealtimeService — WebSocket实时通信+房间管理服务
 *
 * 管理多人实时协作房间：
 * 1. createRoom — 创建一个新的协作房间
 * 2. joinRoom — 用户加入现有房间
 * 3. leaveRoom — 用户离开房间
 * 4. sendMessage — 在房间内发送消息
 * 5. getRoomStatus — 获取房间详细状态
 * 6. listRooms — 列出所有活跃房间
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly rooms = new Map<string, Room>();
  private readonly messages = new Map<string, RoomMessage[]>();

  constructor(private readonly collabService: CollabService) {}

  /**
   * createRoom — 创建一个新的实时协作房间
   *
   * @param name 房间名称
   * @param ownerId 创建者用户ID
   * @param docId 关联的协作文档ID
   * @returns 新创建的房间对象
   */
  createRoom(name: string, ownerId: string, docId: string): Room {
    const roomId = `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();

    const room: Room = {
      roomId,
      name,
      docId,
      ownerId,
      participants: [
        {
          userId: ownerId,
          joinedAt: now,
          role: 'owner',
          lastActive: now,
        },
      ],
      createdAt: now,
      lastActivity: now,
      messageCount: 0,
      status: 'active',
    };

    this.rooms.set(roomId, room);
    this.messages.set(roomId, []);

    // 也创建底层的 CollabService 会话
    try {
      this.collabService.createSession(docId, ownerId);
    } catch {
      // 会话可能已存在，忽略
    }

    this.logger.log(`Room created: ${roomId} "${name}" by ${ownerId}`);
    return room;
  }

  /**
   * joinRoom — 用户加入一个已存在的房间
   *
   * @param roomId 房间ID
   * @param userId 用户ID
   * @param role 加入角色（默认为 viewer）
   * @returns 更新后的房间对象
   */
  joinRoom(roomId: string, userId: string, role: 'owner' | 'editor' | 'viewer' = 'viewer'): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }
    if (room.status !== 'active') {
      throw new Error(`Room ${roomId} is ${room.status}, cannot join`);
    }

    const existingIndex = room.participants.findIndex((p) => p.userId === userId);
    if (existingIndex >= 0) {
      // 更新现有参与者信息
      room.participants[existingIndex].lastActive = Date.now();
      room.participants[existingIndex].role = role;
    } else {
      room.participants.push({
        userId,
        joinedAt: Date.now(),
        role,
        lastActive: Date.now(),
      });
    }

    room.lastActivity = Date.now();

    // 同步加入底层的 collab session
    try {
      this.collabService.joinSession(roomId, userId);
    } catch {
      // session 不存在则忽略
    }

    this.logger.log(`User ${userId} joined room ${roomId}`);
    return room;
  }

  /**
   * leaveRoom — 用户离开房间
   *
   * @param roomId 房间ID
   * @param userId 用户ID
   * @returns 更新后的房间对象
   */
  leaveRoom(roomId: string, userId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const participantIndex = room.participants.findIndex((p) => p.userId === userId);
    if (participantIndex < 0) {
      throw new Error(`User ${userId} is not in room ${roomId}`);
    }

    room.participants.splice(participantIndex, 1);
    room.lastActivity = Date.now();

    // 如果房间空了，自动标记为 archived
    if (room.participants.length === 0) {
      room.status = 'archived';
      this.logger.log(`Room ${roomId} archived (no participants left)`);
    }

    try {
      this.collabService.leaveSession(roomId, userId);
    } catch {
      // ignore
    }

    this.logger.log(`User ${userId} left room ${roomId}`);
    return room;
  }

  /**
   * sendMessage — 在房间内发送消息
   *
   * @param roomId 房间ID
   * @param userId 发送者用户ID
   * @param content 消息内容
   * @param type 消息类型（text | operation | system）
   * @param metadata 附加元数据
   * @returns 发送结果（含消息ID和送达用户列表）
   */
  async sendMessage(
    roomId: string,
    userId: string,
    content: string,
    type: 'text' | 'operation' | 'system' = 'text',
    metadata?: Record<string, unknown>,
  ): Promise<SendMessageResult> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }
    if (room.status !== 'active') {
      throw new Error(`Room ${roomId} is ${room.status}, cannot send messages`);
    }

    const isParticipant = room.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new Error(`User ${userId} is not a participant of room ${roomId}`);
    }

    const message: RoomMessage = {
      messageId: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      roomId,
      userId,
      content,
      type,
      timestamp: Date.now(),
      metadata,
    };

    const roomMessages = this.messages.get(roomId) ?? [];
    roomMessages.push(message);
    this.messages.set(roomId, roomMessages);

    room.messageCount = roomMessages.length;
    room.lastActivity = Date.now();

    // 更新发送者的最后活跃时间
    const sender = room.participants.find((p) => p.userId === userId);
    if (sender) {
      sender.lastActive = Date.now();
    }

    if (type === 'operation') {
      try {
        this.collabService.broadcastChange(roomId, userId, metadata ?? {});
      } catch {
        // ignore
      }
    }

    const deliveredTo = room.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.userId);

    this.logger.log(`Message sent in room ${roomId}: type=${type} from=${userId}`);
    return { messageId: message.messageId, deliveredTo, timestamp: message.timestamp };
  }

  /**
   * getRoomStatus — 获取房间的详细状态信息
   *
   * @param roomId 房间ID
   * @returns 房间状态对象
   */
  getRoomStatus(roomId: string): RoomStatus {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    return {
      roomId: room.roomId,
      name: room.name,
      status: room.status,
      participantCount: room.participants.length,
      participants: [...room.participants],
      messageCount: room.messageCount,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity,
    };
  }

  /**
   * listRooms — 列出所有活跃房间（支持按状态过滤）
   *
   * @param statusFilter 可选的状态过滤器
   * @returns 房间列表
   */
  listRooms(statusFilter?: 'active' | 'archived' | 'closed'): RoomStatus[] {
    const allRooms = Array.from(this.rooms.values());

    const filtered = statusFilter
      ? allRooms.filter((r) => r.status === statusFilter)
      : allRooms;

    return filtered
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .map((room) => ({
        roomId: room.roomId,
        name: room.name,
        status: room.status,
        participantCount: room.participants.length,
        participants: [...room.participants],
        messageCount: room.messageCount,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
      }));
  }

  /**
   * getRoomMessages — 获取房间的消息历史
   *
   * @param roomId 房间ID
   * @param limit 返回数量上限
   * @returns 消息列表
   */
  getRoomMessages(roomId: string, limit: number = 50): RoomMessage[] {
    const roomMessages = this.messages.get(roomId);
    if (!roomMessages) {
      throw new Error(`Room ${roomId} not found`);
    }
    return roomMessages.slice(-limit);
  }

  /**
   * getRoom — 获取原始房间对象
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * closeRoom — 关闭房间
   */
  closeRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.status = 'closed';
    room.lastActivity = Date.now();
    this.logger.log(`Room ${roomId} closed`);
    return true;
  }
}
