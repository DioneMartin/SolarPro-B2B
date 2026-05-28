export type StrategyKind = 'TIME_BASED' | 'WEATHER_BASED';

export interface ScheduleItem {
  kind: 'PANEL_CLEANING' | 'INVERTER_CHECK';
  cron: string;    // standard 5-field cron expression
  leadDays: number;
}

export interface TimeBasedConfig {
  schedule: ScheduleItem[];
}

export interface WeatherThresholds {
  aqiAbove?: number;
  pollenAbove?: number;
  windGustKmhAbove?: number;
  rainMmInDayAbove?: number;
  snowExpected?: boolean;
}

export interface WeatherBasedConfig {
  coords: { lat: number; lon: number };
  thresholds: WeatherThresholds;
  pollIntervalMinutes: number;
}

export type PolicyConfig = TimeBasedConfig | WeatherBasedConfig;

interface CreateAlertPolicyProps {
  id: string;
  tenantId: string;
  projectId: string;
  strategyKind: StrategyKind;
  config: PolicyConfig;
}

interface RehydrateAlertPolicyProps extends CreateAlertPolicyProps {
  enabled: boolean;
  mutedByUsers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class AlertPolicy {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly projectId: string,
    readonly strategyKind: StrategyKind,
    private _config: PolicyConfig,
    private _enabled: boolean,
    private _mutedByUsers: string[],
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: CreateAlertPolicyProps): AlertPolicy {
    const now = new Date();
    return new AlertPolicy(
      props.id,
      props.tenantId,
      props.projectId,
      props.strategyKind,
      props.config,
      true,
      [],
      now,
      now,
    );
  }

  static rehydrate(props: RehydrateAlertPolicyProps): AlertPolicy {
    return new AlertPolicy(
      props.id,
      props.tenantId,
      props.projectId,
      props.strategyKind,
      props.config,
      props.enabled,
      props.mutedByUsers ?? [],
      props.createdAt,
      props.updatedAt,
    );
  }

  get config(): PolicyConfig {
    return this._config;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get mutedByUsers(): string[] {
    return [...this._mutedByUsers];
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  enable(): void {
    this._enabled = true;
    this._updatedAt = new Date();
  }

  disable(): void {
    this._enabled = false;
    this._updatedAt = new Date();
  }

  muteForUser(userId: string): void {
    if (!this._mutedByUsers.includes(userId)) {
      this._mutedByUsers.push(userId);
      this._updatedAt = new Date();
    }
  }

  unmuteForUser(userId: string): void {
    const idx = this._mutedByUsers.indexOf(userId);
    if (idx >= 0) {
      this._mutedByUsers.splice(idx, 1);
      this._updatedAt = new Date();
    }
  }

  isMutedForUser(userId: string): boolean {
    return this._mutedByUsers.includes(userId);
  }

  updateConfig(config: PolicyConfig): void {
    this._config = config;
    this._updatedAt = new Date();
  }
}
