// Centralised image paths and photographer credits
// All images self-hosted in public/images/blog/ for reliability
// Original sources: Unsplash (free to use under Unsplash License)

import type { BlogImage } from '../types/blog';

// Hero images for blog articles
export const IMAGES = {
  southernFrance: {
    hero: {
      src: '/images/blog/southern-france-hero.jpg',
      alt: 'Lavender fields in Provence, Southern France',
      credit: 'Léonard Cotte',
      creditUrl: 'https://unsplash.com/@leonardcotte',
    } as BlogImage,
    provenceRoad: {
      src: '/images/blog/provence-road.jpg',
      alt: 'Winding road through the French countryside',
      credit: 'Sébastien Goldberg',
      creditUrl: 'https://unsplash.com/@sebastiengoldberg',
    } as BlogImage,
    coteDazur: {
      src: '/images/blog/cote-dazur.jpg',
      alt: 'Turquoise waters of the French Riviera coastline',
      credit: 'Luca Bravo',
      creditUrl: 'https://unsplash.com/@lucabravo',
    } as BlogImage,
    camargue: {
      src: '/images/blog/camargue.jpg',
      alt: 'White horses in the Camargue wetlands',
      credit: 'Sébastien Goldberg',
      creditUrl: 'https://unsplash.com/@sebastiengoldberg',
    } as BlogImage,
  },

  firstTimeGuide: {
    hero: {
      src: '/images/blog/first-time-motorhome-hero.jpg',
      alt: 'Camper van parked beside a mountain lake at sunset',
      credit: 'Kevin Schmid',
      creditUrl: 'https://unsplash.com/@kevin_schmid',
    } as BlogImage,
    driving: {
      src: '/images/blog/driving.jpg',
      alt: 'Driving a camper van on a European mountain road',
      credit: 'Dino Reichmuth',
      creditUrl: 'https://unsplash.com/@dinoreichmuth',
    } as BlogImage,
    campsite: {
      src: '/images/blog/campsite.jpg',
      alt: 'Well-equipped European campsite at dawn',
      credit: 'Scott Goodwill',
      creditUrl: 'https://unsplash.com/@scottagoodwill',
    } as BlogImage,
  },

  portugalCampsites: {
    hero: {
      src: '/images/blog/portugal-campsites-hero.jpg',
      alt: 'Dramatic Algarve coastline cliffs in Portugal',
      credit: 'Daniel Seßler',
      creditUrl: 'https://unsplash.com/@danielsessler',
    } as BlogImage,
    algarve: {
      src: '/images/blog/algarve.jpg',
      alt: 'Golden sand beach on the Algarve coast',
      credit: 'Sean Oulashin',
      creditUrl: 'https://unsplash.com/@oulashin',
    } as BlogImage,
    alentejo: {
      src: '/images/blog/alentejo.jpg',
      alt: 'Rolling hills and cork trees in the Alentejo region',
      credit: 'Unsplash',
      creditUrl: 'https://unsplash.com',
    } as BlogImage,
  },

  motorhomeVsCampervan: {
    hero: {
      src: '/images/blog/motorhome-vs-campervan-hero.jpg',
      alt: 'Motorhome parked on a scenic mountain overlook',
      credit: 'Kevin Schmid',
      creditUrl: 'https://unsplash.com/@kevin_schmid',
    } as BlogImage,
  },

  italianCoast: {
    hero: {
      src: '/images/blog/italian-coast-hero.jpg',
      alt: 'Colourful buildings of Cinque Terre on the Italian coast',
      credit: 'Jack Ward',
      creditUrl: 'https://unsplash.com/@jackward',
    } as BlogImage,
  },

  wildCamping: {
    hero: {
      src: '/images/blog/wild-camping-hero.jpg',
      alt: 'Camper van parked in a remote mountain meadow at sunset',
      credit: 'Jake Ingle',
      creditUrl: 'https://unsplash.com/@jakeingle',
    } as BlogImage,
  },

  spainRoutes: {
    hero: {
      src: '/images/blog/spain-routes-hero.jpg',
      alt: 'Winding coastal road along the Spanish Mediterranean',
      credit: 'Willian Justen de Vasconcellos',
      creditUrl: 'https://unsplash.com/@willianjusten',
    } as BlogImage,
  },

  norwayFjords: {
    hero: {
      src: '/images/blog/norway-fjords-hero.jpg',
      alt: 'Norwegian fjord surrounded by dramatic mountain peaks',
      credit: 'Unsplash',
      creditUrl: 'https://unsplash.com',
    } as BlogImage,
  },

  europeanAmenities: {
    hero: {
      src: '/images/blog/campsite.jpg',
      alt: 'Modern European campsite with facilities',
      credit: 'Scott Goodwill',
      creditUrl: 'https://unsplash.com/@scottagoodwill',
    } as BlogImage,
  },

  croatiaCamping: {
    hero: {
      src: '/images/blog/croatia-coastal-hero.jpg',
      alt: 'Crystal clear Adriatic waters along the Croatian coast',
      credit: 'Unsplash',
      creditUrl: 'https://unsplash.com',
    } as BlogImage,
  },

  // Homepage welcome hero
  homepageHero: {
    src: '/images/blog/driving.jpg',
    alt: 'Camper van driving along a scenic European mountain road',
    credit: 'Dino Reichmuth',
    creditUrl: 'https://unsplash.com/@dinoreichmuth',
  } as BlogImage,
} as const;
