import type {ProjectMeta} from './project-store';

export type GalleryOrder = 'recent' | 'name';

export function projectGallery(items: readonly ProjectMeta[], options: {
  trash: boolean;
  query: string;
  folder: string;
  order: GalleryOrder;
}): {folders: string[]; projects: ProjectMeta[]; total: number};
