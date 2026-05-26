import { Controller, Post, Body, Param, Get, Patch, UseInterceptors, UploadedFile, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { RecordManualConsumptionUseCase } from '../../application/use-cases/record-manual-consumption.use-case';
import { UploadAndExtractConsumptionUseCase } from '../../application/use-cases/upload-and-extract-consumption.use-case';
import { UpdateConsumptionUseCase } from '../../application/use-cases/update-consumption.use-case';
import { GetConsumptionUseCase } from '../../application/use-cases/get-consumption.use-case';

@Controller()
export class ConsumptionController {
  constructor(
    private readonly recordManual: RecordManualConsumptionUseCase,
    private readonly uploadExtract: UploadAndExtractConsumptionUseCase,
    private readonly update: UpdateConsumptionUseCase,
    private readonly getConsumption: GetConsumptionUseCase,
  ) {}

  @Post('projects/:projectId/consumption/manual')
  @Roles(Role.SOLAR_CONSULTANT, Role.INVENTORY_MANAGER)
  async recordManualConsumption(
    @Param('projectId') projectId: string,
    @Body() body: any,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.recordManual.execute({
      tenantId: user.tenantId,
      projectId,
      months: body.months,
    });
    return { id: result.id, status: result.status };
  }

  @Post('projects/:projectId/consumption/upload')
  @HttpCode(202)
  @Roles(Role.SOLAR_CONSULTANT, Role.INVENTORY_MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadConsumption(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.uploadExtract.execute({
      tenantId: user.tenantId,
      projectId,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
    });
    return { recordId: result.id, status: result.status };
  }

  @Get('consumption/:id')
  async getRecord(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const record = await this.getConsumption.execute(id, user.tenantId);
    return {
      id: record.id,
      status: record.status,
      months: record.months.map(m => ({ year: m.year, month: m.month, kwh: m.kwh })),
    };
  }

  @Patch('consumption/:id')
  @Roles(Role.SOLAR_CONSULTANT, Role.INVENTORY_MANAGER)
  async updateRecord(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: JwtPayload,
  ) {
    const record = await this.update.execute({
      id,
      tenantId: user.tenantId,
      months: body.months,
    });
    return { id: record.id, status: record.status };
  }
}
