import { Injectable, BadRequestException } from '@nestjs/common';
import { HrRepository } from '../repositories/hr.repository';
import { CreateHolidayDto } from '../dto/holidays.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class HolidaysService {
  constructor(
    private readonly repository: HrRepository,
    private readonly logger: LoggerService,
  ) {}

  async createHoliday(dto: CreateHolidayDto, context: RequestContext) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    const existing = await this.repository.findHolidayByDate(date);
    if (existing)
      throw new BadRequestException(
        'A holiday is already configured on this date',
      );

    const holiday = await this.repository.createHoliday({
      name: dto.name,
      date,
      type: dto.type,
    });

    this.logger.audit(context.userId, 'Create Holiday', 'holiday', holiday, {
      after: holiday,
    });
    return holiday;
  }

  async getHolidays() {
    return this.repository.findHolidays();
  }
}
