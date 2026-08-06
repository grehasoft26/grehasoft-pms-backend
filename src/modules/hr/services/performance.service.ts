import { Injectable, NotFoundException } from '@nestjs/common';
import { HrRepository } from '../repositories/hr.repository';
import { CreateGoalDto, UpdateGoalProgressDto, CreateReviewCycleDto, CreatePerformanceReviewDto, UpdatePerformanceReviewDto, CreatePipDto } from '../dto/performance.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class PerformanceService {
  constructor(
    private readonly repository: HrRepository,
    private readonly logger: LoggerService
  ) {}

  async createGoal(employeeProfileId: string, dto: CreateGoalDto, context: RequestContext) {
    const goal = await this.repository.createGoal({
      employeeProfileId,
      title: dto.title,
      kpi: dto.kpi || '',
      competencies: dto.competencies || '',
      targetDate: new Date(dto.targetDate),
    });
    this.logger.audit(context.userId, 'Create Goal', 'performanceGoal', goal, { after: goal });
    return goal;
  }

  async updateGoalProgress(id: string, dto: UpdateGoalProgressDto, context: RequestContext) {
    const goal = await this.repository.updateGoalProgress(id, dto.progress);
    this.logger.audit(context.userId, 'Update Goal Progress', 'performanceGoal', goal, { after: goal });
    return goal;
  }

  async getGoals(employeeProfileId: string) {
    return this.repository.findGoals(employeeProfileId);
  }

  async createCycle(dto: CreateReviewCycleDto, context: RequestContext) {
    const cycle = await this.repository.createReviewCycle({
      name: dto.name,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
    this.logger.audit(context.userId, 'Create Review Cycle', 'performanceCycle', cycle, { after: cycle });
    return cycle;
  }

  async getCycles() {
    return this.repository.findCycles();
  }

  async submitSelfReview(dto: CreatePerformanceReviewDto, context: RequestContext) {
    const review = await this.repository.createReview({
      employeeProfileId: dto.employeeProfileId,
      cycleId: dto.cycleId,
      managerId: dto.managerId,
      selfRating: dto.selfRating || null,
      selfFeedback: dto.selfFeedback || '',
      status: 'SUBMITTED',
    });
    this.logger.audit(context.userId, 'Submit Self Review', 'performanceReview', review, { after: review });
    return review;
  }

  async submitManagerReview(id: string, dto: UpdatePerformanceReviewDto, context: RequestContext) {
    const before = await this.repository.findReviewById(id);
    if (!before) throw new NotFoundException('Performance review record not found');

    const updated = await this.repository.updateReview(id, {
      managerRating: dto.managerRating,
      managerFeedback: dto.managerFeedback,
      finalRating: dto.finalRating ?? dto.managerRating,
      finalFeedback: dto.finalFeedback ?? dto.managerFeedback,
      status: dto.status || 'FINALIZED',
    });

    this.logger.audit(context.userId, 'Submit Manager Review', 'performanceReview', updated, { before, after: updated });
    return updated;
  }

  // Performance Improvement Plan (PIP)
  async createPip(reviewId: string, dto: CreatePipDto, context: RequestContext) {
    const review = await this.repository.findReviewById(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    const pip = await this.repository.createPip({
      reviewId,
      goals: dto.goals,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      status: 'ACTIVE',
    });

    this.logger.audit(context.userId, 'Activate Performance Improvement Plan (PIP)', 'pip', pip, { after: pip });
    return pip;
  }

  async getReviewById(id: string) {
    return this.repository.findReviewById(id);
  }

  async getReviews(filters: { employeeProfileId?: string; cycleId?: string }) {
    return this.repository.findReviews(filters);
  }
}
