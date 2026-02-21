// Centralised image URLs and photographer credits
// All images sourced from Unsplash (free to use under Unsplash License)

import type { BlogImage } from '../types/blog';

// Hero images for blog articles
export const IMAGES = {
  southernFrance: {
    hero: {
      src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&q=80&auto=format',
      alt: 'Lavender fields in Provence, Southern France',
      credit: 'Léonard Cotte',
      creditUrl: 'https://unsplash.com/@leonardcotte',
    } as BlogImage,
    provenceRoad: {
      src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format',
      alt: 'Winding road through the French countryside',
      credit: 'Sébastien Goldberg',
      creditUrl: 'https://unsplash.com/@sebastiengoldberg',
    } as BlogImage,
    coteDazur: {
      src: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1200&q=80&auto=format',
      alt: 'Turquoise waters of the French Riviera coastline',
      credit: 'Luca Bravo',
      creditUrl: 'https://unsplash.com/@lucabravo',
    } as BlogImage,
    camargue: {
      src: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&q=80&auto=format',
      alt: 'White horses in the Camargue wetlands',
      credit: 'Sébastien Goldberg',
      creditUrl: 'https://unsplash.com/@sebastiengoldberg',
    } as BlogImage,
  },

  firstTimeGuide: {
    hero: {
      src: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=1600&q=80&auto=format',
      alt: 'Camper van parked beside a mountain lake at sunset',
      credit: 'Kevin Schmid',
      creditUrl: 'https://unsplash.com/@kevin_schmid',
    } as BlogImage,
    driving: {
      src: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80&auto=format',
      alt: 'Driving a camper van on a European mountain road',
      credit: 'Dino Reichmuth',
      creditUrl: 'https://unsplash.com/@dinoreichmuth',
    } as BlogImage,
    campsite: {
      src: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80&auto=format',
      alt: 'Well-equipped European campsite at dawn',
      credit: 'Scott Goodwill',
      creditUrl: 'https://unsplash.com/@scottagoodwill',
    } as BlogImage,
  },

  portugalCampsites: {
    hero: {
      src: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1600&q=80&auto=format',
      alt: 'Dramatic Algarve coastline cliffs in Portugal',
      credit: 'Daniel Seßler',
      creditUrl: 'https://unsplash.com/@danielsessler',
    } as BlogImage,
    algarve: {
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format',
      alt: 'Golden sand beach on the Algarve coast',
      credit: 'Sean Oulashin',
      creditUrl: 'https://unsplash.com/@oulashin',
    } as BlogImage,
    alentejo: {
      src: 'https://images.unsplash.com/photo-1593692495155-a9f60e203880?w=1200&q=80&auto=format',
      alt: 'Rolling hills and cork trees in the Alentejo region',
      credit: 'Ricardo Resende',
      creditUrl: 'https://unsplash.com/@rfrphoto',
    } as BlogImage,
  },

  motorhomeVsCampervan: {
    hero: {
      src: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1600&q=80&auto=format',
      alt: 'Motorhome parked on a scenic mountain overlook',
      credit: 'Kevin Schmid',
      creditUrl: 'https://unsplash.com/@kevin_schmid',
    } as BlogImage,
  },

  italianCoast: {
    hero: {
      src: 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=1600&q=80&auto=format',
      alt: 'Colourful buildings of Cinque Terre on the Italian coast',
      credit: 'Jack Ward',
      creditUrl: 'https://unsplash.com/@jackward',
    } as BlogImage,
  },

  wildCamping: {
    hero: {
      src: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=1600&q=80&auto=format',
      alt: 'Camper van parked in a remote mountain meadow at sunset',
      credit: 'Jake Ingle',
      creditUrl: 'https://unsplash.com/@jakeingle',
    } as BlogImage,
  },

  spainRoutes: {
    hero: {
      src: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=1600&q=80&auto=format',
      alt: 'Winding coastal road along the Spanish Mediterranean',
      credit: 'Willian Justen de Vasconcellos',
      creditUrl: 'https://unsplash.com/@willianjusten',
    } as BlogImage,
  },

  norwayFjords: {
    hero: {
      src: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1600&q=80&auto=format',
      alt: 'Norwegian fjord surrounded by dramatic mountain peaks',
      credit: 'John O\'Nolan',
      creditUrl: 'https://unsplash.com/@johnonolan',
    } as BlogImage,
  },

  europeanAmenities: {
    hero: {
      src: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600&q=80&auto=format',
      alt: 'Modern European campsite with facilities',
      credit: 'Scott Goodwill',
      creditUrl: 'https://unsplash.com/@scottagoodwill',
    } as BlogImage,
  },

  croatiaCamping: {
    hero: {
      src: 'https://images.unsplash.com/photo-1555990538-1e6d0e037516?w=1600&q=80&auto=format',
      alt: 'Crystal clear Adriatic waters along the Croatian coast',
      credit: 'Reiseuhu',
      creditUrl: 'https://unsplash.com/@reiseuhu',
    } as BlogImage,
  },

  // Homepage welcome hero
  homepageHero: {
    src: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80&auto=format',
    alt: 'Camper van driving along a scenic European mountain road',
    credit: 'Dino Reichmuth',
    creditUrl: 'https://unsplash.com/@dinoreichmuth',
  } as BlogImage,
} as const;
