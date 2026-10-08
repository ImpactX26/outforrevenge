import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string): Promise<any[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string): Promise<any | null> {
    const notif = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (notif) {
      return this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    }
    return null;
  }
}
