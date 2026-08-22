import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class ProductivityScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateDailyScore(userId: string, date: Date) {
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
    );

    // Fetch active session
    const session = await this.prisma.workSession.findFirst({
      where: {
        userId,
        startTime: { gte: startOfDay, lt: endOfDay },
      },
      include: {
        breaks: true,
        idles: true,
        applications: true,
      },
    });

    if (!session) {
      return {
        score: 0,
        focusTime: 0,
        deepWorkTime: 0,
        contextSwitches: 0,
        interruptions: 0,
        productivityPercentage: 0,
      };
    }

    const focusTime = session.activeTime; // total active seconds
    const interruptions = session.breaks.length + session.idles.length;
    const contextSwitches = session.applications.length;

    // Deep work time = active time excluding breaks/idles (simplified)
    const deepWorkTime =
      session.productiveTime > 3600
        ? session.productiveTime
        : Math.round(session.activeTime * 0.8);

    const productivityPercentage =
      session.activeTime > 0
        ? Math.round((session.productiveTime / session.activeTime) * 100)
        : 0;

    // Overall score = productivity % - (context switches * 0.5) - (interruptions * 2) (bounded between 0 and 100)
    let score =
      productivityPercentage - contextSwitches * 0.5 - interruptions * 2;
    if (score < 0) score = 0;
    if (score > 100) score = 100;

    const record = await this.prisma.productivityScore.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfDay,
        },
      },
      update: {
        score,
        focusTime,
        deepWorkTime,
        contextSwitches,
        interruptions,
        productivityPercentage,
      },
      create: {
        userId,
        date: startOfDay,
        score,
        focusTime,
        deepWorkTime,
        contextSwitches,
        interruptions,
        productivityPercentage,
      },
    });

    return record;
  }
}
