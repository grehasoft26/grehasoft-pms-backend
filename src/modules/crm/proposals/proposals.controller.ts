import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProposalsService } from './proposals.service';
import {
  CreateProposalDto,
  UpdateProposalDto,
  ProposalFilterDto,
  CreateProposalTemplateDto,
  UpdateProposalTemplateDto,
  SubmitProposalApprovalDto,
  ReviewProposalApprovalDto,
} from './dto/proposals.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Proposals')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('proposals')
  @Permissions('proposals.create')
  @ApiOperation({ summary: 'Create a new Proposal' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProposalDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.proposalsService.create(dto, context);
    return { message: 'Proposal created successfully', data };
  }

  @Get('proposals')
  @Permissions('proposals.read')
  @ApiOperation({
    summary: 'Get all Proposals with advanced search, filter, and pagination',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query() query: ProposalFilterDto) {
    const { data, totalCount } = await this.proposalsService.getMany(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Proposals retrieved successfully',
      data,
      meta: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  @Get('proposals/:id')
  @Permissions('proposals.read')
  @ApiOperation({
    summary: 'Get specific Proposal details including versions and approvals',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.proposalsService.getById(id);
    return { message: 'Proposal details retrieved successfully', data };
  }

  @Patch('proposals/:id')
  @Permissions('proposals.update')
  @ApiOperation({ summary: 'Update Proposal details and line items' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.proposalsService.update(id, dto, context);
    return { message: 'Proposal updated successfully', data };
  }

  @Delete('proposals/:id')
  @Permissions('proposals.delete')
  @ApiOperation({ summary: 'Soft delete a Proposal' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.proposalsService.delete(id, context);
    return { message: 'Proposal deleted successfully' };
  }

  // PDF Operations
  @Post('proposals/:id/pdf')
  @Permissions('proposals.pdf')
  @ApiOperation({
    summary:
      'Generate and upload physical PDF document with metadata versioning',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async generatePdf(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.proposalsService.generatePdf(id, context);
    return { message: 'Proposal PDF generated successfully', data };
  }

  @Get('proposals/:id/pdf/download')
  @Permissions('proposals.read')
  @ApiOperation({ summary: 'Download the generated physical PDF file' })
  async download(
    @Param('id') id: string,
    @Query('versionId') versionId: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    console.log('[PDF DOWNLOAD] Request received');
    console.log(
      '[PDF DOWNLOAD] Authenticated user:',
      (req as any).user ? (req as any).user.email : 'NO USER',
    );
    console.log('[PDF DOWNLOAD] Loading proposal');
    const prop = await this.proposalsService.getById(id);
    
    console.log('[PDF DOWNLOAD] Generating PDF');
    const payload = {
      title: prop.title,
      currency: prop.currency,
      items: prop.items,
      templateId: prop.templateId,
      opportunityId: prop.opportunityId,
      builderConfig: prop.builderConfig,
      proposalNumber: prop.proposalNumber,
    };
    const fileStream = await this.proposalsService.previewPdf(payload, false);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="proposal_${prop.proposalNumber}.pdf"`,
    );
    console.log('[PDF DOWNLOAD] Sending PDF response');
    fileStream.pipe(res);
  }

  @Post('proposals/:id/send')
  @Permissions('proposals.update')
  @ApiOperation({ summary: 'Send Proposal PDF to Client via Email' })
  @ApiResponse({ type: SuccessResponseDto })
  async send(
    @Param('id') id: string,
    @Body('email') email: string,
    @Body('subject') subject: string,
    @Body('message') message: string,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.proposalsService.send(
      id,
      { email, subject, message },
      context,
    );
    return { message: 'Proposal sent successfully', data };
  }

  @Post('proposals/preview-pdf')
  @Permissions('proposals.read')
  @ApiOperation({ summary: 'Generate temporary proposal preview PDF' })
  async previewPdf(@Body() body: any, @Res() res: Response) {
    console.log('[PDF PREVIEW] Request received');
    console.log('[PDF PREVIEW] Body keys:', Object.keys(body || {}));
    
    console.log('[PDF PREVIEW] Starting PDF generation');
    const fileStream = await this.proposalsService.previewPdf(body);
    console.log('[PDF PREVIEW] PDF generated');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="proposal_preview.pdf"',
    );
    console.log('[PDF PREVIEW] Sending PDF response');
    fileStream.pipe(res);
  }

  @Public()
  @Get('public/proposals/:id/pdf/download')
  @ApiOperation({ summary: 'Public token-based download of proposal PDF' })
  async downloadPublic(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const prop = await this.proposalsService.getById(id);
    const fileStream = await this.proposalsService.getFileStreamPublic(
      id,
      token,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="proposal_${prop.proposalNumber}.pdf"`,
    );
    fileStream.pipe(res);
  }

  // Multi-Level Proposal Approvals
  @Post('proposals/:id/submit-approval')
  @Permissions('proposals.update')
  @ApiOperation({ summary: 'Submit proposal for Level Approval review' })
  @ApiResponse({ type: SuccessResponseDto })
  async submitApproval(
    @Param('id') id: string,
    @Body() dto: SubmitProposalApprovalDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.proposalsService.submitApproval(id, dto, context);
    return { message: 'Proposal submitted for approval successfully', data };
  }

  @Post('proposal-approvals/:approvalId/review')
  @Permissions('proposals.approve')
  @ApiOperation({
    summary: 'Review (Approve/Reject) a proposal approval level step',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async reviewApproval(
    @Param('approvalId') approvalId: string,
    @Body() dto: ReviewProposalApprovalDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.proposalsService.reviewApproval(
      approvalId,
      dto,
      context,
    );
    return { message: 'Proposal approval step reviewed successfully', data };
  }

  // Client Conversion endpoint
  @Post('opportunities/:opportunityId/convert-client')
  @Permissions('opportunities.convert')
  @ApiOperation({
    summary:
      'Convert opportunity with accepted proposal into Client in Clients Module',
  })
  @ApiResponse({ type: SuccessResponseDto })
  async convertToClient(
    @Param('opportunityId') opportunityId: string,
    @Body('categoryId') categoryId: string,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.proposalsService.convertToClient(
      opportunityId,
      categoryId,
      context,
    );
    return { message: 'Opportunity successfully converted to Client', data };
  }

  // Proposal Templates Endpoints
  @Post('proposal-templates')
  @Permissions('proposal-templates.create')
  @ApiOperation({ summary: 'Create Proposal Template' })
  @ApiResponse({ type: SuccessResponseDto })
  async createTemplate(
    @Body() dto: CreateProposalTemplateDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.proposalsService.createTemplate(dto, context);
    return { message: 'Proposal Template created successfully', data };
  }

  @Get('proposal-templates')
  @Permissions('proposal-templates.read')
  @ApiOperation({ summary: 'Get all proposal templates' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTemplates() {
    const data = await this.proposalsService.getTemplates();
    return { message: 'Proposal Templates retrieved successfully', data };
  }

  @Get('proposal-templates/:templateId')
  @Permissions('proposal-templates.read')
  @ApiOperation({ summary: 'Get specific proposal template' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTemplateById(@Param('templateId') templateId: string) {
    const data = await this.proposalsService.getTemplateById(templateId);
    return { message: 'Proposal Template retrieved successfully', data };
  }

  @Patch('proposal-templates/:templateId')
  @Permissions('proposal-templates.update')
  @ApiOperation({ summary: 'Update Proposal Template' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() dto: UpdateProposalTemplateDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.proposalsService.updateTemplate(
      templateId,
      dto,
      context,
    );
    return { message: 'Proposal Template updated successfully', data };
  }

  @Delete('proposal-templates/:templateId')
  @Permissions('proposal-templates.delete')
  @ApiOperation({ summary: 'Delete Proposal Template' })
  @ApiResponse({ type: SuccessResponseDto })
  async deleteTemplate(
    @Param('templateId') templateId: string,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    await this.proposalsService.deleteTemplate(templateId, context);
    return { message: 'Proposal Template deleted successfully' };
  }
}
