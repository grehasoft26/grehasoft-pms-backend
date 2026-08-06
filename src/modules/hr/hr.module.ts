import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HrRepository } from './repositories/hr.repository';
import { EmployeesService } from './services/employees.service';
import { AttendanceService } from './services/attendance.service';
import { LeavesService } from './services/leaves.service';
import { ShiftsService } from './services/shifts.service';
import { HolidaysService } from './services/holidays.service';
import { PerformanceService } from './services/performance.service';
import { TrainingService } from './services/training.service';
import { AssetsService } from './services/assets.service';
import { HrDashboardService } from './services/dashboard.service';

import { EmployeesController } from './controllers/employees.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { LeavesController } from './controllers/leaves.controller';
import { ShiftsController } from './controllers/shifts.controller';
import { HolidaysController } from './controllers/holidays.controller';
import { PerformanceController } from './controllers/performance.controller';
import { TrainingController } from './controllers/training.controller';
import { AssetsController } from './controllers/assets.controller';
import { HrDashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    EmployeesController,
    AttendanceController,
    LeavesController,
    ShiftsController,
    HolidaysController,
    PerformanceController,
    TrainingController,
    AssetsController,
    HrDashboardController,
  ],
  providers: [
    HrRepository,
    EmployeesService,
    AttendanceService,
    LeavesService,
    ShiftsService,
    HolidaysService,
    PerformanceService,
    TrainingService,
    AssetsService,
    HrDashboardService,
  ],
  exports: [
    HrRepository,
    EmployeesService,
    AttendanceService,
    LeavesService,
    ShiftsService,
    HolidaysService,
    PerformanceService,
    TrainingService,
    AssetsService,
    HrDashboardService,
  ],
})
export class HrModule {}
