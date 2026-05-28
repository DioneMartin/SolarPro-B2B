import { Body, Controller, Delete, Get, HttpCode, Inject, NotFoundException, Param, Post, Put, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { BLOB_STORAGE_PORT } from '../../../data-ingestion/application/ports/blob-storage.port';
import type { BlobStoragePort } from '../../../data-ingestion/application/ports/blob-storage.port';
import { IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { GenerateProposalUseCase } from '../../application/use-cases/generate-proposal.use-case';
import { ListProposalsUseCase } from '../../application/use-cases/list-proposals.use-case';
import { GetProposalUseCase } from '../../application/use-cases/get-proposal.use-case';
import { DeleteProposalUseCase } from '../../application/use-cases/delete-proposal.use-case';
import { ExportProposalPdfUseCase } from '../../application/use-cases/export-proposal-pdf.use-case';
import { RejectProposalUseCase } from '../../application/use-cases/reject-proposal.use-case';
import { toProposalOutput } from '../../application/use-cases/proposal-output.helper';
import type { CriterionDto } from '../../application/factories/proposal-query.factory';

class CriterionRequestDto implements CriterionDto {
  @IsString()
  type!: CriterionDto['type'];

  @IsOptional() @IsString()
  brand?: string;

  @IsOptional() @IsNumber()
  min?: number;

  @IsOptional() @IsNumber()
  max?: number;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CriterionRequestDto)
  children?: CriterionRequestDto[];
}

class GenerateProposalDto {
  @IsOptional() @IsNumber() @Min(1) @Max(200)
  energyDemandTargetPct?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(50)
  horizonYears?: number;

  @IsOptional() @IsNumber() @Min(0)
  energyInflationPctPerYear?: number;

  @IsOptional() @IsNumber() @Min(0.1) @Max(1)
  systemLossFactor?: number;

  @IsOptional() @IsNumber() @Min(0)
  discountRatePct?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  brandWhitelist?: string[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CriterionRequestDto)
  criteria?: CriterionRequestDto[];

  @IsOptional() @IsNumber() @Min(0)
  pricePerKwh?: number;
}

@Controller()
export class ProposalsController {
  constructor(
    private readonly generate: GenerateProposalUseCase,
    private readonly list: ListProposalsUseCase,
    private readonly get: GetProposalUseCase,
    private readonly deleteProposal: DeleteProposalUseCase,
    private readonly exportPdf: ExportProposalPdfUseCase,
    private readonly rejectProposalUc: RejectProposalUseCase,
    @Inject(BLOB_STORAGE_PORT) private readonly blobStorage: BlobStoragePort,
  ) {}

  @Post('projects/:projectId/proposals')
  @Roles(Role.SOLAR_CONSULTANT)
  async generateProposal(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateProposalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const proposal = await this.generate.execute({
      projectId,
      tenantId: user.tenantId,
      createdBy: user.sub,
      ...dto,
    });
    return toProposalOutput(proposal);
  }

  @Get('proposals')
  async listAll(@CurrentUser() user: JwtPayload) {
    const proposals = await this.list.executeAll(user.tenantId);
    return proposals.map(toProposalOutput);
  }

  @Get('projects/:projectId/proposals')
  async listProposals(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const proposals = await this.list.execute(projectId, user.tenantId);
    return proposals.map(toProposalOutput);
  }

  @Get('proposals/:id')
  async getProposal(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const proposal = await this.get.execute(id, user.tenantId);
    return toProposalOutput(proposal);
  }

  @Delete('proposals/:id')
  @HttpCode(200)
  @Roles(Role.SOLAR_CONSULTANT)
  async deleteOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.deleteProposal.execute(id, user.tenantId);
    return { deleted: true };
  }

  @Post('proposals/:id/export')
  @Roles(Role.SOLAR_CONSULTANT)
  async exportToPdf(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.exportPdf.execute(id, user.tenantId);
  }

  @Put('proposals/:id/reject')
  @Roles(Role.SOLAR_CONSULTANT)
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rejectProposalUc.execute(id, user.tenantId);
  }

  @Get('proposals/:id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const proposal = await this.get.execute(id, user.tenantId);
    if (!proposal.exportedPdfRef) {
      throw new NotFoundException('PDF no exportado aún. Exporta la propuesta primero.');
    }
    const buffer = await this.blobStorage.read(proposal.exportedPdfRef);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="propuesta-${id.slice(0, 8)}.pdf"`,
    });
    return new StreamableFile(buffer);
  }
}
