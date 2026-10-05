export interface IGeoPoint {
  lat: number;
  lng: number;
}

export interface ILocationDetails {
  address: string;
  landmark?: string;
  city: string;
  district: string;
  pincode: string;
  state: string;
  lat: number;
  lng: number;
}

export interface IMapProvider {
  getNavigationUrl(destination: IGeoPoint, origin?: IGeoPoint): string;
  getStaticMapPreviewUrl(location: IGeoPoint): string;
  calculateDistanceKm(point1: IGeoPoint, point2: IGeoPoint): number;
}

export class DefaultMapProvider implements IMapProvider {
  /**
   * Generates standard Google Maps & OpenStreetMap navigation links
   * allowing the Jacquard worker to launch mobile navigation to the loom site.
   */
  getNavigationUrl(destination: IGeoPoint, origin?: IGeoPoint): string {
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
  }

  getStaticMapPreviewUrl(location: IGeoPoint): string {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01}%2C${location.lat - 0.01}%2C${location.lng + 0.01}%2C${location.lat + 0.01}&layer=mapnik&marker=${location.lat}%2C${location.lng}`;
  }

  // Haversine formula
  calculateDistanceKm(p1: IGeoPoint, p2: IGeoPoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(p2.lat - p1.lat);
    const dLng = this.deg2rad(p2.lng - p1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(p1.lat)) *
        Math.cos(this.deg2rad(p2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export class MapService {
  private static instance: IMapProvider;

  public static getInstance(): IMapProvider {
    if (!MapService.instance) {
      MapService.instance = new DefaultMapProvider();
    }
    return MapService.instance;
  }
}
