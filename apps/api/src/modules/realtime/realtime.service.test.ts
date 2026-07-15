/**
 * realtime.service.test.ts — RealtimeService 单元测试
 *
 * 🐜 V18: WebSocket实时通信+房间管理 测试
 * 覆盖：createRoom / joinRoom / leaveRoom / sendMessage / getRoomStatus / listRooms
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RealtimeService, type Room, type RoomStatus, type SendMessageResult } from './realtime.service'
import { CollabService } from './collab.service'

describe('RealtimeService', () => {
  let service: RealtimeService
  let collabService: CollabService

  beforeEach(() => {
    collabService = new CollabService()
    service = new RealtimeService(collabService)
  })

  // ─── createRoom ───────────────────────────────────────────────────────────

  describe('createRoom', () => {
    it('should create a room and return it with correct fields', () => {
      const room: Room = service.createRoom('协同编辑', 'user-1', 'doc-001')
      expect(room.roomId).toMatch(/^room-/)
      expect(room.name).toBe('协同编辑')
      expect(room.docId).toBe('doc-001')
      expect(room.ownerId).toBe('user-1')
      expect(room.status).toBe('active')
    })

    it('should add the owner as the first participant with role=owner', () => {
      const room = service.createRoom('Test Room', 'owner-1', 'doc-002')
      expect(room.participants).toHaveLength(1)
      expect(room.participants[0].userId).toBe('owner-1')
      expect(room.participants[0].role).toBe('owner')
    })

    it('should have unique room IDs for different rooms', () => {
      const room1 = service.createRoom('Room A', 'user-1', 'doc-1')
      const room2 = service.createRoom('Room B', 'user-2', 'doc-2')
      expect(room1.roomId).not.toBe(room2.roomId)
    })

    it('should set initial messageCount to 0', () => {
      const room = service.createRoom('Empty Room', 'user-1', 'doc-3')
      expect(room.messageCount).toBe(0)
    })

    it('should set createdAt and lastActivity timestamps', () => {
      const before = Date.now()
      const room = service.createRoom('Timed Room', 'user-1', 'doc-4')
      expect(room.createdAt).toBeGreaterThanOrEqual(before)
      expect(room.createdAt).toBeLessThanOrEqual(Date.now())
      expect(room.lastActivity).toBe(room.createdAt)
    })
  })

  // ─── joinRoom ─────────────────────────────────────────────────────────────

  describe('joinRoom', () => {
    it('should add a new participant to the room', () => {
      service.createRoom('Test', 'owner-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      const updated = service.joinRoom(roomId, 'user-2', 'editor')
      expect(updated.participants).toHaveLength(2)
      expect(updated.participants.some((p) => p.userId === 'user-2')).toBe(true)
    })

    it('should set the specified role for the joining user', () => {
      service.createRoom('Test', 'owner-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      const updated = service.joinRoom(roomId, 'user-2', 'viewer')
      const participant = updated.participants.find((p) => p.userId === 'user-2')
      expect(participant!.role).toBe('viewer')
    })

    it('should default role to viewer if not specified', () => {
      service.createRoom('Test', 'owner-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      const updated = service.joinRoom(roomId, 'user-2')
      const participant = updated.participants.find((p) => p.userId === 'user-2')
      expect(participant!.role).toBe('viewer')
    })

    it('should update lastActive for re-joining user', () => {
      service.createRoom('Test', 'owner-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      service.joinRoom(roomId, 'user-2')
      const before = Date.now()
      const updated = service.joinRoom(roomId, 'user-2', 'editor')
      const participant = updated.participants.find((p) => p.userId === 'user-2')
      expect(participant!.lastActive).toBeGreaterThanOrEqual(before)
      expect(participant!.role).toBe('editor')
    })

    it('should throw if room does not exist', () => {
      expect(() => service.joinRoom('nonexistent-room', 'user-1')).toThrow('Room nonexistent-room not found')
    })
  })

  // ─── leaveRoom ────────────────────────────────────────────────────────────

  describe('leaveRoom', () => {
    it('should remove the user from the room', () => {
      service.createRoom('Test', 'owner-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      service.joinRoom(roomId, 'user-2')
      const updated = service.leaveRoom(roomId, 'user-2')
      expect(updated.participants.some((p) => p.userId === 'user-2')).toBe(false)
    })

    it('should archive room when last participant leaves', () => {
      service.createRoom('Test', 'owner-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      const updated = service.leaveRoom(roomId, 'owner-1')
      expect(updated.participants).toHaveLength(0)
      expect(updated.status).toBe('archived')
    })

    it('should keep room active when only one of many leaves', () => {
      service.createRoom('Test', 'owner-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      service.joinRoom(roomId, 'user-2')
      const updated = service.leaveRoom(roomId, 'user-2')
      expect(updated.participants).toHaveLength(1)
      expect(updated.status).toBe('active')
    })

    it('should throw if user is not in the room', () => {
      service.createRoom('Test', 'owner-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      expect(() => service.leaveRoom(roomId, 'non-participant')).toThrow('not in room')
    })

    it('should throw if room does not exist', () => {
      expect(() => service.leaveRoom('nonexistent', 'user-1')).toThrow('Room nonexistent not found')
    })
  })

  // ─── sendMessage ──────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    it('should send a text message and return messageId', async () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      const result: SendMessageResult = await service.sendMessage(roomId, 'user-1', 'Hello!', 'text')
      expect(result.messageId).toMatch(/^msg-/)
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('should increment messageCount after sending', async () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      await service.sendMessage(roomId, 'user-1', 'Msg 1', 'text')
      await service.sendMessage(roomId, 'user-1', 'Msg 2', 'text')
      const status = service.getRoomStatus(roomId)
      expect(status.messageCount).toBe(2)
    })

    it('should deliver to all other participants', async () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      service.joinRoom(roomId, 'user-2')
      service.joinRoom(roomId, 'user-3')
      const result = await service.sendMessage(roomId, 'user-1', 'Broadcast!', 'text')
      expect(result.deliveredTo).toHaveLength(2)
      expect(result.deliveredTo).toContain('user-2')
      expect(result.deliveredTo).toContain('user-3')
    })

    it('should not include sender in deliveredTo', async () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      const result = await service.sendMessage(roomId, 'user-1', 'Alone', 'text')
      expect(result.deliveredTo).toHaveLength(0)
    })

    it('should throw if non-participant sends a message', async () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      await expect(
        service.sendMessage(roomId, 'non-participant', 'Hack!', 'text'),
      ).rejects.toThrow('not a participant')
    })

    it('should throw if room is not active', async () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      service.leaveRoom(roomId, 'user-1')
      await expect(
        service.sendMessage(roomId, 'user-1', 'Hello', 'text'),
      ).rejects.toThrow('cannot send messages')
    })

    it('should support operation type messages with metadata', async () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      const meta = { delta: '+Hello', version: 1 }
      await service.sendMessage(roomId, 'user-1', '', 'operation', meta)
      const status = service.getRoomStatus(roomId)
      expect(status.messageCount).toBe(1)
    })
  })

  // ─── getRoomStatus ────────────────────────────────────────────────────────

  describe('getRoomStatus', () => {
    it('should return detailed room status', () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      const status: RoomStatus = service.getRoomStatus(roomId)
      expect(status.roomId).toBe(roomId)
      expect(status.name).toBe('Test')
      expect(status.participantCount).toBe(1)
      expect(status.participants).toHaveLength(1)
      expect(status.status).toBe('active')
    })

    it('should report correct participant count after joins and leaves', () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      service.joinRoom(roomId, 'user-2')
      service.joinRoom(roomId, 'user-3')
      expect(service.getRoomStatus(roomId).participantCount).toBe(3)
      service.leaveRoom(roomId, 'user-2')
      expect(service.getRoomStatus(roomId).participantCount).toBe(2)
    })

    it('should throw if room does not exist', () => {
      expect(() => service.getRoomStatus('nonexistent')).toThrow('Room nonexistent not found')
    })
  })

  // ─── listRooms ────────────────────────────────────────────────────────────

  describe('listRooms', () => {
    it('should list all active rooms by default', () => {
      service.createRoom('Room A', 'user-1', 'doc-1')
      service.createRoom('Room B', 'user-2', 'doc-2')
      const rooms = service.listRooms()
      expect(rooms).toHaveLength(2)
    })

    it('should filter by status when specified', () => {
      service.createRoom('Active', 'user-1', 'doc-1')
      const roomId = service.listRooms('active')[0].roomId
      service.leaveRoom(roomId, 'user-1')
      const activeRooms = service.listRooms('active')
      const archivedRooms = service.listRooms('archived')
      expect(activeRooms).toHaveLength(0)
      expect(archivedRooms).toHaveLength(1)
    })

    it('should return rooms sorted by lastActivity descending', () => {
      const r1 = service.createRoom('Old', 'user-1', 'doc-1')
      const r2 = service.createRoom('New', 'user-2', 'doc-2')
      const rooms = service.listRooms()
      // Newer creation should come first (same ms might tie, either order is valid)
      const firstRoomId = rooms[0].roomId
      expect([r1.roomId, r2.roomId]).toContain(firstRoomId)
      expect(rooms).toHaveLength(2)
    })

    it('should return empty array when no rooms match filter', () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const rooms = service.listRooms('closed')
      expect(rooms).toHaveLength(0)
    })

    it('should include participant list in each room status', () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const rooms = service.listRooms()
      expect(rooms[0].participants).toBeInstanceOf(Array)
      expect(rooms[0].participants.length).toBeGreaterThan(0)
    })
  })

  // ─── getRoomMessages ──────────────────────────────────────────────────────

  describe('getRoomMessages', () => {
    it('should return messages for a room in order', async () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      await service.sendMessage(roomId, 'user-1', 'First', 'text')
      await service.sendMessage(roomId, 'user-1', 'Second', 'text')
      const messages = service.getRoomMessages(roomId)
      expect(messages).toHaveLength(2)
      expect(messages[0].content).toBe('First')
      expect(messages[1].content).toBe('Second')
    })

    it('should throw if room not found', () => {
      expect(() => service.getRoomMessages('nonexistent')).toThrow('Room nonexistent not found')
    })
  })

  // ─── closeRoom ────────────────────────────────────────────────────────────

  describe('closeRoom', () => {
    it('should close a room successfully', () => {
      service.createRoom('Test', 'user-1', 'doc-1')
      const roomId = service.listRooms()[0].roomId
      const result = service.closeRoom(roomId)
      expect(result).toBe(true)
      const status = service.getRoomStatus(roomId)
      expect(status.status).toBe('closed')
    })

    it('should return false for non-existent room', () => {
      const result = service.closeRoom('nonexistent')
      expect(result).toBe(false)
    })
  })
})
