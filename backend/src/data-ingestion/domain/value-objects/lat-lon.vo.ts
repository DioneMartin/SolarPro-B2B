export class LatLon {
  private constructor(
    readonly lat: number,
    readonly lon: number,
  ) {}

  static create(lat: number, lon: number): LatLon {
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    if (lon < -180 || lon > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    return new LatLon(lat, lon);
  }

  static rehydrate(lat: number, lon: number): LatLon {
    return new LatLon(lat, lon);
  }
}
