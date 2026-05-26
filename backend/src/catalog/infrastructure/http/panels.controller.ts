import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { DiscontinuePanelUseCase } from '../../application/use-cases/discontinue-panel.use-case';
import { GetPanelUseCase } from '../../application/use-cases/get-panel.use-case';
import { ListPanelsUseCase } from '../../application/use-cases/list-panels.use-case';
import { RegisterPanelUseCase } from '../../application/use-cases/register-panel.use-case';
import { UpdatePanelUseCase } from '../../application/use-cases/update-panel.use-case';
import { RegisterPanelRequestDto } from './dto/register-panel.request.dto';
import { UpdatePanelRequestDto } from './dto/update-panel.request.dto';

@Controller('catalog/panels')
export class PanelsController {
  constructor(
    private readonly register: RegisterPanelUseCase,
    private readonly list: ListPanelsUseCase,
    private readonly getPanel: GetPanelUseCase,
    private readonly update: UpdatePanelUseCase,
    private readonly discontinue: DiscontinuePanelUseCase,
  ) {}

  @Post()
  @Roles(Role.INVENTORY_MANAGER)
  async create(@Body() dto: RegisterPanelRequestDto, @CurrentUser() user: JwtPayload) {
    return this.register.execute({
      tenantId: user.tenantId,
      brand: dto.brand,
      modelName: dto.modelName,
      specs: dto.specs,
      mapping: dto.mapping,
      unitCost: dto.unitCost,
    });
  }

  @Get()
  async listAll(@CurrentUser() user: JwtPayload, @Query('all') all?: string) {
    return this.list.execute(user.tenantId, all !== 'true');
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.getPanel.execute(id, user.tenantId);
  }

  @Patch(':id')
  @Roles(Role.INVENTORY_MANAGER)
  async updateOne(@Param('id') id: string, @Body() dto: UpdatePanelRequestDto, @CurrentUser() user: JwtPayload) {
    return this.update.execute({ id, tenantId: user.tenantId, ...dto });
  }

  @Delete(':id')
  @HttpCode(200)
  @Roles(Role.INVENTORY_MANAGER)
  async deleteOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.discontinue.execute(id, user.tenantId);
  }
}
