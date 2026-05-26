import { Controller, Post, Body, Param, Get, Patch, UseInterceptors, UploadedFile, Req, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  async recordManualConsumption(
    @Param('projectId') projectId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const result = await this.recordManual.execute({
      tenantId,
      projectId,
      months: body.months,
    });
    return { id: result.id, status: result.status };
  }

  @Post('projects/:projectId/consumption/upload')
  @HttpCode(202)
  @UseInterceptors(FileInterceptor('file'))
  async uploadConsumption(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const result = await this.uploadExtract.execute({
      tenantId,
      projectId,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
    });
    return { recordId: result.id, status: result.status };
  }

  @Get('consumption/:id')
  async getRecord(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const record = await this.getConsumption.execute(id, tenantId);
    return {
      id: record.id,
      status: record.status,
      months: record.months.map(m => ({ year: m.year, month: m.month, kwh: m.kwh })),
    };
  }

  @Patch('consumption/:id')
  async updateRecord(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    const record = await this.update.execute({
      id,
      tenantId,
      months: body.months,
    });
    return { id: record.id, status: record.status };
  }
}
