// Blog post registry and helper functions

import type { BlogPost, BlogCategory } from '../../types/blog';

import bestCamperRoutesSouthernFrance from './best-camper-routes-southern-france';
import firstTimeMotorhomeGuide from './first-time-motorhome-guide-europe';
import bestFreeCampsitesPortugal from './best-free-campsites-portugal';
import motorhomeVsCampervan from './motorhome-vs-campervan-guide';
import italianCoast from './camping-italian-coast-guide';
import wildCampingEurope from './wild-camping-europe-rules';
import spainRoutes from './spain-camper-routes';
import norwayFjords from './norway-fjords-campervan';
import europeanAmenities from './european-campsite-amenities-guide';
import croatiaCamping from './croatia-coastal-camping';

export const blogPosts: BlogPost[] = [
  bestCamperRoutesSouthernFrance,
  firstTimeMotorhomeGuide,
  bestFreeCampsitesPortugal,
  motorhomeVsCampervan,
  italianCoast,
  wildCampingEurope,
  spainRoutes,
  norwayFjords,
  europeanAmenities,
  croatiaCamping,
];

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find((p) => p.slug === slug);

export const getPostsByCategory = (cat: BlogCategory): BlogPost[] =>
  blogPosts.filter((p) => p.category === cat);

export const getRecentPosts = (limit: number = 6): BlogPost[] =>
  [...blogPosts]
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, limit);

export const getRelatedPosts = (post: BlogPost, limit: number = 3): BlogPost[] =>
  blogPosts
    .filter(
      (p) =>
        p.slug !== post.slug &&
        (p.category === post.category || post.relatedSlugs?.includes(p.slug))
    )
    .slice(0, limit);

export const BLOG_CATEGORIES: Record<BlogCategory, { name: string; description: string }> = {
  'destination-guides': {
    name: 'Destination Guides',
    description: 'In-depth guides to European camping destinations',
  },
  'route-planning': {
    name: 'Route Planning',
    description: 'Tips and itineraries for planning your camper route',
  },
  'practical-guides': {
    name: 'Practical Guides',
    description: 'Essential advice for camper travel in Europe',
  },
  'campsite-guides': {
    name: 'Campsite Guides',
    description: 'Finding the best campsites across Europe',
  },
  'vehicle-guides': {
    name: 'Vehicle Guides',
    description: 'Choosing and managing your motorhome or campervan',
  },
};
