// Blog/Guides content type definitions

export type BlogCategory =
  | 'destination-guides'
  | 'route-planning'
  | 'practical-guides'
  | 'campsite-guides'
  | 'vehicle-guides';

export interface BlogImage {
  src: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

export interface BlogSection {
  type: 'heading' | 'paragraph' | 'list' | 'tip' | 'warning' | 'image' | 'cta' | 'quote';
  content?: string;
  items?: string[];
  level?: 2 | 3;
  image?: BlogImage;
  waypoints?: Array<{ name: string; lat: number; lng: number }>;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  author: string;
  publishedDate: string;
  updatedDate?: string;
  category: BlogCategory;
  tags: string[];
  readingTime: number;
  heroImage: BlogImage;
  content: BlogSection[];
  relatedSlugs?: string[];
}
