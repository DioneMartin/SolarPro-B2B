export interface ClockPort {
  now(): Date;
}

export const CLOCK_PORT = 'CLOCK_PORT';
