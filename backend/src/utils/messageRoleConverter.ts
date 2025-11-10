/**
 * MessageRole Converter Utility
 * Converts between Prisma MessageRole enum and shared MessageRole enum
 */

import { MessageRole } from '../types/shared';
import { MessageRole as PrismaMessageRole } from '@prisma/client';

export class MessageRoleConverter {
  /**
   * Convert shared MessageRole to Prisma MessageRole
   */
  static toPrisma(role: MessageRole): PrismaMessageRole {
    const roleMap: Record<MessageRole, PrismaMessageRole> = {
      [MessageRole.USER]: PrismaMessageRole.user,
      [MessageRole.ASSISTANT]: PrismaMessageRole.assistant,
      [MessageRole.SYSTEM]: PrismaMessageRole.system
    };
    
    return roleMap[role];
  }

  /**
   * Convert Prisma MessageRole to shared MessageRole
   */
  static toShared(role: PrismaMessageRole): MessageRole {
    const roleMap: Record<PrismaMessageRole, MessageRole> = {
      [PrismaMessageRole.user]: MessageRole.USER,
      [PrismaMessageRole.assistant]: MessageRole.ASSISTANT,
      [PrismaMessageRole.system]: MessageRole.SYSTEM
    };
    
    return roleMap[role];
  }
}

