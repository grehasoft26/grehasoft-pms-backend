import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { HrRepository } from '../repositories/hr.repository';
import { CreateCourseDto, EnrollEmployeeDto, CompleteTrainingDto } from '../dto/training.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { TimelineEventType } from '@prisma/client';

@Injectable()
export class TrainingService {
  constructor(
    private readonly repository: HrRepository,
    private readonly logger: LoggerService
  ) {}

  async createCourse(dto: CreateCourseDto, context: RequestContext) {
    const course = await this.repository.createCourse({
      title: dto.title,
      description: dto.description || '',
      durationHours: dto.durationHours,
      isMandatory: dto.isMandatory ?? false,
      isExternal: dto.isExternal ?? false,
    });
    this.logger.audit(context.userId, 'Create Training Course', 'trainingCourse', course, { after: course });
    return course;
  }

  async enrollEmployee(employeeProfileId: string, dto: EnrollEmployeeDto, context: RequestContext) {
    const profile = await this.repository.findProfileById(employeeProfileId);
    if (!profile) throw new NotFoundException('Employee profile not found');

    const course = await this.repository.findCourseById(dto.courseId);
    if (!course) throw new NotFoundException('Training Course not found');

    const enrollment = await this.repository.enrollEmployee({
      employeeProfileId,
      courseId: dto.courseId,
      status: 'ENROLLED',
    });



    this.logger.audit(context.userId, 'Enroll Employee in Training', 'trainingEnrollment', enrollment, { after: enrollment });
    return enrollment;
  }

  async completeTraining(enrollmentId: string, dto: CompleteTrainingDto, context: RequestContext) {
    const enrollment = await this.repository.findEnrollmentById(enrollmentId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (enrollment.status === 'COMPLETED') {
      throw new BadRequestException('Training is already completed');
    }

    const updated = await this.repository.updateEnrollment(enrollmentId, 'COMPLETED', new Date(dto.completionDate));

    // Save Training Certificate
    const certificate = await this.repository.createCertificate({
      enrollmentId,
      certificateNumber: dto.certificateNumber,
      issueDate: new Date(dto.issueDate),
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      renewalReminded: false,
    });

    // Timeline event: AWARD
    await this.repository.createTimelineEvent(
      enrollment.employeeProfileId,
      TimelineEventType.AWARD,
      `Earned certificate: ${dto.certificateNumber} for course: ${enrollment.course.title}`
    );

    this.logger.audit(context.userId, 'Complete Training & Issue Certificate', 'trainingCertificate', certificate, { after: certificate });
    return { enrollment: updated, certificate };
  }

  // Renewal expiration query
  async getExpiredCertificates() {
    const now = new Date();
    return this.repository.prisma.trainingCertificate.findMany({
      where: {
        expiryDate: { lt: now },
        renewalReminded: false,
      },
      include: { enrollment: { include: { course: true, employeeProfile: { include: { user: true } } } } },
    });
  }

  async getCourses() {
    return this.repository.findCourses();
  }

  async getEnrollments(employeeProfileId: string) {
    return this.repository.prisma.trainingEnrollment.findMany({
      where: { employeeProfileId },
      include: { course: true, certificate: true },
    });
  }
}
