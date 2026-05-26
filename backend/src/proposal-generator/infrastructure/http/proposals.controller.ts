import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
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
}

@Controller()
export class ProposalsController {
  constructor(
    private readonly generate: GenerateProposalUseCase,
    private readonly list: ListProposalsUseCase,
    private readonly get: GetProposalUseCase,
    private readonly deleteProposal: DeleteProposalUseCase,
    private readonly exportPdf: ExportProposalPdfUseCase,
  ) {}

  @Post('projects/:projectId/proposals')
  @Roles(Role.SOLAR_CONSULTANT)
  async generateProposal(
    @Param('projectId') projectId: string,
    @Body() dto: GenerateProposalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.generate.execute({
      projectId,
      tenantId: user.tenantId,
      createdBy: user.sub,
      ...dto,
    });
  }

  @Get('projects/:projectId/proposals')
  async listProposals(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.list.execute(projectId, user.tenantId);
  }

  @Get('proposals/:id')
  async getProposal(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.get.execute(id, user.tenantId);
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
}
