import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { ProposalFilterDto } from './dto/proposals.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProposalsRepository {
  constructor(public readonly prisma: PrismaService) {}

  async create(data: Prisma.ProposalUncheckedCreateInput) {
    return this.prisma.proposal.create({
      data,
      include: {
        opportunity: true,
        template: true,
        items: true,
      },
    });
  }

  async findMany(filters: ProposalFilterDto) {
    const where: Prisma.ProposalWhereInput = {};

    if (filters.isDeleted === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { proposalNumber: { contains: filters.search } },
      ];
    }

    if (filters.status) where.status = filters.status;
    if (filters.opportunityId) where.opportunityId = filters.opportunityId;

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      this.prisma.proposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          opportunity: true,
          template: true,
          items: true,
        },
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return { data, totalCount };
  }

  async findById(id: string) {
    return this.prisma.proposal.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: {
            stage: true,
            owner: true,
            lead: true,
            client: true,
          },
        },
        template: true,
        items: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            creator: { select: { firstName: true, lastName: true } },
          },
        },
        approvals: {
          orderBy: { level: 'asc' },
          include: {
            approver: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ProposalUncheckedUpdateInput) {
    return this.prisma.proposal.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
      include: {
        opportunity: true,
        template: true,
        items: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.proposal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  async restore(id: string) {
    return this.prisma.proposal.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  async generateProposalNumber() {
    const currentYear = new Date().getFullYear();
    const prefix = `PROP-${currentYear}-`;

    const lastProposal = await this.prisma.proposal.findFirst({
      where: {
        proposalNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        proposalNumber: 'desc',
      },
      select: {
        proposalNumber: true,
      },
    });

    let sequence = 1;
    if (lastProposal && lastProposal.proposalNumber) {
      const parts = lastProposal.proposalNumber.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        }
      }
    }

    return `${prefix}${String(sequence).padStart(6, '0')}`;
  }

  // Proposal Items
  async deleteProposalItems(proposalId: string) {
    return this.prisma.proposalItem.deleteMany({
      where: { proposalId },
    });
  }

  async createProposalItem(data: Prisma.ProposalItemUncheckedCreateInput) {
    return this.prisma.proposalItem.create({ data });
  }

  // Proposal Versions
  async createVersion(data: Prisma.ProposalVersionUncheckedCreateInput) {
    return this.prisma.proposalVersion.create({ data });
  }

  async getVersions(proposalId: string) {
    return this.prisma.proposalVersion.findMany({
      where: { proposalId },
      orderBy: { versionNumber: 'desc' },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });
  }

  // Proposal Approvals
  async createApproval(data: Prisma.ProposalApprovalUncheckedCreateInput) {
    return this.prisma.proposalApproval.create({ data });
  }

  async getApprovals(proposalId: string) {
    return this.prisma.proposalApproval.findMany({
      where: { proposalId },
      orderBy: { level: 'asc' },
      include: { approver: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findApprovalById(id: string) {
    return this.prisma.proposalApproval.findUnique({
      where: { id },
    });
  }

  async updateApproval(id: string, data: Prisma.ProposalApprovalUncheckedUpdateInput) {
    return this.prisma.proposalApproval.update({
      where: { id },
      data,
    });
  }

  // Proposal Templates
  async createTemplate(data: Prisma.ProposalTemplateCreateInput) {
    return this.prisma.proposalTemplate.create({ data });
  }

  async getTemplates() {
    return this.prisma.proposalTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async getTemplateById(id: string) {
    return this.prisma.proposalTemplate.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async getTemplateByName(name: string) {
    return this.prisma.proposalTemplate.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async updateTemplate(id: string, data: Prisma.ProposalTemplateUpdateInput) {
    return this.prisma.proposalTemplate.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  async deleteTemplate(id: string, userId: string) {
    return this.prisma.proposalTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }
}
