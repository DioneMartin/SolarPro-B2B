import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AlertPolicy } from '../../domain/entities/alert-policy.entity';
import type { StrategyKind, PolicyConfig, WeatherBasedConfig } from '../../domain/entities/alert-policy.entity';
import { ALERT_POLICY_REPOSITORY } from '../../domain/repositories/alert-policy.repository';
import type { AlertPolicyRepository } from '../../domain/repositories/alert-policy.repository';
import { PolicyNotAllowedError } from '../../domain/errors/policy-not-allowed.error';

// Cross-module port — minimal read on project data
export interface ProjectStatusReaderPort {
  getStatus(projectId: string, tenantId: string): Promise<string | null>;
  getCoords(projectId: string, tenantId: string): Promise<{ lat: number; lon: number } | null>;
}
export const PROJECT_STATUS_READER_PORT = 'PROJECT_STATUS_READER_PORT';

interface Input {
  tenantId: string;
  projectId: string;
  strategyKind: StrategyKind;
  config: PolicyConfig;
}

@Injectable()
export class CreateAlertPolicyUseCase {
  constructor(
    @Inject(ALERT_POLICY_REPOSITORY)
    private readonly repo: AlertPolicyRepository,
    @Inject(PROJECT_STATUS_READER_PORT)
    private readonly projectStatusReader: ProjectStatusReaderPort,
  ) {}

  async execute(input: Input): Promise<AlertPolicy> {
    const status = await this.projectStatusReader.getStatus(input.projectId, input.tenantId);
    if (status !== 'APPROVED') {
      throw new PolicyNotAllowedError(input.projectId);
    }

    // For WEATHER_BASED policies, fill in coordinates from the project if not supplied
    let effectiveConfig = input.config;
    if (input.strategyKind === 'WEATHER_BASED') {
      const weatherConfig = input.config as WeatherBasedConfig;
      const hasCoordsInConfig =
        weatherConfig.coords?.lat != null && weatherConfig.coords?.lon != null;

      if (!hasCoordsInConfig) {
        const projectCoords = await this.projectStatusReader.getCoords(
          input.projectId,
          input.tenantId,
        );
        if (!projectCoords) {
          throw new BadRequestException(
            'No hay coordenadas en el proyecto. Agrega latitud/longitud al crear el proyecto o proporciónalas manualmente.',
          );
        }
        effectiveConfig = { ...weatherConfig, coords: projectCoords };
      }
    }

    const policy = AlertPolicy.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      projectId: input.projectId,
      strategyKind: input.strategyKind,
      config: effectiveConfig,
    });

    await this.repo.save(policy);
    return policy;
  }
}
