export type Site = 'youtube' | 'instagram' | 'tiktok';
export interface Adapter {
  site: Site;
  selector: string;
  metadata: string;
  concealment: {
    titles: string;
    thumbnails: string;
    preserve: string;
  };
}
export interface ConcealmentTargets {
  titles: HTMLElement[];
  thumbnails: HTMLElement[];
  metadata: HTMLElement[];
}
