// Trip Templates Service
// Phase 5.3: Pre-defined trip templates for common European routes

import { type TripTemplate, type Trip, type TripMetadata, type TripData } from './TripStorageService';

const EUROPEAN_TRIP_TEMPLATES: TripTemplate[] = [
  {
    metadata: {
      id: 'template_grand_tour_europe',
      name: 'Grand Tour of Europe',
      description: 'A comprehensive journey through Europe\'s most iconic destinations, perfect for first-time visitors.',
      category: 'leisure',
      tags: ['classic', 'cities', 'culture', 'history', 'long-trip'],
      duration: 21,
      difficulty: 'moderate',
      season: 'spring',
      countries: ['France', 'Germany', 'Austria', 'Italy', 'Switzerland'],
      estimatedCost: 2800,
      currency: 'EUR',
      isTemplate: true,
      isPublic: true
    },
    data: {
      waypoints: [
        { id: 'gt1', lat: 48.8566, lng: 2.3522, name: 'Paris, France', type: 'waypoint' },
        { id: 'gt2', lat: 50.1109, lng: 8.6821, name: 'Frankfurt, Germany', type: 'waypoint' },
        { id: 'gt3', lat: 48.2082, lng: 16.3738, name: 'Vienna, Austria', type: 'waypoint' },
        { id: 'gt4', lat: 46.0569, lng: 11.1212, name: 'Bolzano, Italy', type: 'waypoint' },
        { id: 'gt5', lat: 45.4642, lng: 9.1900, name: 'Milan, Italy', type: 'waypoint' },
        { id: 'gt6', lat: 46.2044, lng: 6.1432, name: 'Geneva, Switzerland', type: 'waypoint' },
        { id: 'gt7', lat: 47.3769, lng: 8.5417, name: 'Zurich, Switzerland', type: 'waypoint' },
        { id: 'gt8', lat: 48.1351, lng: 11.5820, name: 'Munich, Germany', type: 'waypoint' }
      ],
      routePreferences: {
        avoidTolls: false,
        avoidFerries: false,
        preferScenic: true,
        fuelEfficient: false
      },
      campsiteSelections: []
    },
    templateInfo: {
      templateId: 'grand_tour_europe',
      title: 'Grand Tour of Europe',
      description: 'Experience Europe\'s cultural capitals and stunning Alpine scenery',
      highlights: [
        'Paris - City of Light and romance',
        'Vienna - Imperial architecture and coffee culture',
        'Swiss Alps - Breathtaking mountain landscapes',
        'Milan - Fashion and design capital',
        'Munich - Bavarian culture and Oktoberfest'
      ],
      recommendedMonths: [4, 5, 6, 9, 10], // April-June, September-October
      estimatedDuration: 21,
      difficultyReason: 'Long distances and some mountain driving required',
      author: 'Camper Planner',
      popularity: 95
    }
  },

  {
    metadata: {
      id: 'template_mediterranean_coast',
      name: 'Mediterranean Coastal Adventure',
      description: 'Follow the stunning Mediterranean coastline from France to Spain.',
      category: 'adventure',
      tags: ['coastal', 'beaches', 'warm-weather', 'scenic', 'food'],
      duration: 14,
      difficulty: 'easy',
      season: 'summer',
      countries: ['France', 'Spain'],
      estimatedCost: 1800,
      currency: 'EUR',
      isTemplate: true,
      isPublic: true
    },
    data: {
      waypoints: [
        { id: 'mc1', lat: 43.7102, lng: 7.2620, name: 'Nice, France', type: 'waypoint' },
        { id: 'mc2', lat: 43.5428, lng: 5.3708, name: 'Marseille, France', type: 'waypoint' },
        { id: 'mc3', lat: 43.6047, lng: 1.4442, name: 'Toulouse, France', type: 'waypoint' },
        { id: 'mc4', lat: 41.3851, lng: 2.1734, name: 'Barcelona, Spain', type: 'waypoint' },
        { id: 'mc5', lat: 39.4699, lng: -0.3763, name: 'Valencia, Spain', type: 'waypoint' },
        { id: 'mc6', lat: 37.3891, lng: -5.9845, name: 'Seville, Spain', type: 'waypoint' },
        { id: 'mc7', lat: 36.7213, lng: -4.4214, name: 'Málaga, Spain', type: 'waypoint' }
      ],
      routePreferences: {
        avoidTolls: false,
        avoidFerries: false,
        preferScenic: true,
        fuelEfficient: false
      },
      campsiteSelections: []
    },
    templateInfo: {
      templateId: 'mediterranean_coast',
      title: 'Mediterranean Coastal Adventure',
      description: 'Sun, sea, and spectacular coastal scenery along the Mediterranean',
      highlights: [
        'French Riviera - Glamorous coastal towns',
        'Barcelona - Gaudí architecture and vibrant culture',
        'Valencia - Paella birthplace and beaches',
        'Andalusia - Moorish architecture and flamenco',
        'Costa del Sol - Pristine beaches and resorts'
      ],
      recommendedMonths: [5, 6, 7, 8, 9], // May-September
      estimatedDuration: 14,
      difficultyReason: 'Easy coastal driving with good infrastructure',
      author: 'Camper Planner',
      popularity: 88
    }
  },

  {
    metadata: {
      id: 'template_scandinavian_fjords',
      name: 'Scandinavian Fjords Expedition',
      description: 'Explore the dramatic fjords and midnight sun of Norway and Sweden.',
      category: 'adventure',
      tags: ['fjords', 'nature', 'dramatic-scenery', 'northern-lights', 'challenging'],
      duration: 18,
      difficulty: 'challenging',
      season: 'summer',
      countries: ['Norway', 'Sweden', 'Denmark'],
      estimatedCost: 3200,
      currency: 'EUR',
      isTemplate: true,
      isPublic: true
    },
    data: {
      waypoints: [
        { id: 'sf1', lat: 55.6761, lng: 12.5683, name: 'Copenhagen, Denmark', type: 'waypoint' },
        { id: 'sf2', lat: 57.7089, lng: 11.9746, name: 'Gothenburg, Sweden', type: 'waypoint' },
        { id: 'sf3', lat: 59.9139, lng: 10.7522, name: 'Oslo, Norway', type: 'waypoint' },
        { id: 'sf4', lat: 62.4722, lng: 6.1492, name: 'Ålesund, Norway', type: 'waypoint' },
        { id: 'sf5', lat: 69.6492, lng: 18.9553, name: 'Tromsø, Norway', type: 'waypoint' },
        { id: 'sf6', lat: 71.1695, lng: 25.7847, name: 'North Cape, Norway', type: 'waypoint' },
        { id: 'sf7', lat: 64.1835, lng: -21.8456, name: 'Reykjavik, Iceland', type: 'waypoint' }
      ],
      routePreferences: {
        avoidTolls: true,
        avoidFerries: false,
        preferScenic: true,
        fuelEfficient: true
      },
      campsiteSelections: []
    },
    templateInfo: {
      templateId: 'scandinavian_fjords',
      title: 'Scandinavian Fjords Expedition',
      description: 'Journey to the edge of the world through spectacular Nordic landscapes',
      highlights: [
        'Geirangerfjord - UNESCO World Heritage dramatic fjord',
        'Lofoten Islands - Picturesque fishing villages',
        'Midnight Sun - 24-hour daylight in summer',
        'North Cape - Northernmost point of Europe',
        'Northern Lights - Aurora viewing opportunities'
      ],
      recommendedMonths: [6, 7, 8], // June-August only
      estimatedDuration: 18,
      difficultyReason: 'Mountain roads, ferry crossings, and extreme weather conditions',
      author: 'Camper Planner',
      popularity: 76
    }
  },

  {
    metadata: {
      id: 'template_eastern_europe_discovery',
      name: 'Eastern Europe Discovery',
      description: 'Discover the hidden gems and rich history of Eastern Europe.',
      category: 'leisure',
      tags: ['history', 'culture', 'castles', 'budget-friendly', 'off-beaten-path'],
      duration: 16,
      difficulty: 'moderate',
      season: 'spring',
      countries: ['Czech Republic', 'Slovakia', 'Hungary', 'Poland', 'Austria'],
      estimatedCost: 1400,
      currency: 'EUR',
      isTemplate: true,
      isPublic: true
    },
    data: {
      waypoints: [
        { id: 'ee1', lat: 50.0755, lng: 14.4378, name: 'Prague, Czech Republic', type: 'waypoint' },
        { id: 'ee2', lat: 48.1486, lng: 17.1077, name: 'Bratislava, Slovakia', type: 'waypoint' },
        { id: 'ee3', lat: 47.4979, lng: 19.0402, name: 'Budapest, Hungary', type: 'waypoint' },
        { id: 'ee4', lat: 50.0647, lng: 19.9450, name: 'Kraków, Poland', type: 'waypoint' },
        { id: 'ee5', lat: 52.2297, lng: 21.0122, name: 'Warsaw, Poland', type: 'waypoint' },
        { id: 'ee6', lat: 50.2649, lng: 19.0238, name: 'Katowice, Poland', type: 'waypoint' },
        { id: 'ee7', lat: 48.2082, lng: 16.3738, name: 'Vienna, Austria', type: 'waypoint' }
      ],
      routePreferences: {
        avoidTolls: true,
        avoidFerries: true,
        preferScenic: true,
        fuelEfficient: true
      },
      campsiteSelections: []
    },
    templateInfo: {
      templateId: 'eastern_europe_discovery',
      title: 'Eastern Europe Discovery',
      description: 'Uncover the architectural treasures and stories of Central Europe',
      highlights: [
        'Prague - Fairy-tale castle and medieval streets',
        'Budapest - Thermal baths and Danube views',
        'Kraków - UNESCO World Heritage old town',
        'Salzburg - Mozart\'s birthplace and baroque beauty',
        'Hallstatt - Picture-perfect lakeside village'
      ],
      recommendedMonths: [4, 5, 6, 9, 10], // Spring and early autumn
      estimatedDuration: 16,
      difficultyReason: 'Some narrow mountain roads and varying road conditions',
      author: 'Camper Planner',
      popularity: 72
    }
  },

  {
    metadata: {
      id: 'template_romantic_getaway',
      name: 'Romantic European Getaway',
      description: 'A perfect romantic journey through Europe\'s most enchanting destinations.',
      category: 'romantic',
      tags: ['romantic', 'wine', 'luxury', 'intimate', 'couples'],
      duration: 10,
      difficulty: 'easy',
      season: 'spring',
      countries: ['France', 'Italy'],
      estimatedCost: 2200,
      currency: 'EUR',
      isTemplate: true,
      isPublic: true
    },
    data: {
      waypoints: [
        { id: 'rg1', lat: 48.8566, lng: 2.3522, name: 'Paris, France', type: 'waypoint' },
        { id: 'rg2', lat: 47.3220, lng: 5.0415, name: 'Dijon, France', type: 'waypoint' },
        { id: 'rg3', lat: 45.7640, lng: 4.8357, name: 'Lyon, France', type: 'waypoint' },
        { id: 'rg4', lat: 43.7102, lng: 7.2620, name: 'Nice, France', type: 'waypoint' },
        { id: 'rg5', lat: 43.7696, lng: 11.2558, name: 'Florence, Italy', type: 'waypoint' },
        { id: 'rg6', lat: 41.9028, lng: 12.4964, name: 'Rome, Italy', type: 'waypoint' },
        { id: 'rg7', lat: 45.4408, lng: 12.3155, name: 'Venice, Italy', type: 'waypoint' }
      ],
      routePreferences: {
        avoidTolls: false,
        avoidFerries: false,
        preferScenic: true,
        fuelEfficient: false
      },
      campsiteSelections: []
    },
    templateInfo: {
      templateId: 'romantic_getaway',
      title: 'Romantic European Getaway',
      description: 'Wine, dine, and fall in love all over again in Europe\'s most romantic cities',
      highlights: [
        'Paris - Seine cruises and Eiffel Tower sunsets',
        'Burgundy - World-class wine tasting',
        'French Riviera - Luxury and Mediterranean charm',
        'Tuscany - Rolling hills and vineyard tours',
        'Venice - Gondola rides and intimate canal-side dining'
      ],
      recommendedMonths: [4, 5, 6, 9, 10], // Mild weather months
      estimatedDuration: 10,
      difficultyReason: 'Easy driving with excellent infrastructure',
      author: 'Camper Planner',
      popularity: 84
    }
  },

  {
    metadata: {
      id: 'template_family_adventure',
      name: 'Family Adventure Through Europe',
      description: 'Kid-friendly destinations with theme parks, beaches, and educational experiences.',
      category: 'family',
      tags: ['family', 'kids', 'theme-parks', 'beaches', 'educational'],
      duration: 14,
      difficulty: 'easy',
      season: 'summer',
      countries: ['Netherlands', 'Germany', 'Austria', 'Switzerland'],
      estimatedCost: 2400,
      currency: 'EUR',
      isTemplate: true,
      isPublic: true
    },
    data: {
      waypoints: [
        { id: 'fa1', lat: 52.3676, lng: 4.9041, name: 'Amsterdam, Netherlands', type: 'waypoint' },
        { id: 'fa2', lat: 51.6978, lng: 5.2981, name: 'Efteling (Kaatsheuvel), Netherlands', type: 'waypoint' },
        { id: 'fa3', lat: 50.7753, lng: 6.0839, name: 'Cologne, Germany', type: 'waypoint' },
        { id: 'fa4', lat: 48.1371, lng: 11.5754, name: 'Munich, Germany', type: 'waypoint' },
        { id: 'fa5', lat: 47.2692, lng: 11.4041, name: 'Innsbruck, Austria', type: 'waypoint' },
        { id: 'fa6', lat: 46.8182, lng: 8.2275, name: 'Interlaken, Switzerland', type: 'waypoint' },
        { id: 'fa7', lat: 47.0502, lng: 8.3093, name: 'Lucerne, Switzerland', type: 'waypoint' }
      ],
      routePreferences: {
        avoidTolls: false,
        avoidFerries: true,
        preferScenic: false,
        fuelEfficient: true
      },
      campsiteSelections: []
    },
    templateInfo: {
      templateId: 'family_adventure',
      title: 'Family Adventure Through Europe',
      description: 'Create magical memories with activities and attractions perfect for all ages',
      highlights: [
        'Efteling - Fairy-tale theme park in Netherlands',
        'Neuschwanstein Castle - Real-life Disney castle',
        'Swiss Alps - Cable car rides and mountain adventures',
        'Lake Lucerne - Boat trips and scenic beauty',
        'Salzburg - Sound of Music tours and historic sites'
      ],
      recommendedMonths: [6, 7, 8], // Summer holidays
      estimatedDuration: 14,
      difficultyReason: 'Easy family-friendly routes with good facilities',
      author: 'Camper Planner',
      popularity: 79
    }
  },

  {
    metadata: {
      id: 'template_british_isles_explorer',
      name: 'British Isles Explorer',
      description: 'Discover the diverse landscapes and cultures of Britain and Ireland.',
      category: 'adventure',
      tags: ['islands', 'castles', 'whisky', 'dramatic-scenery', 'english-speaking'],
      duration: 20,
      difficulty: 'moderate',
      season: 'summer',
      countries: ['United Kingdom', 'Ireland'],
      estimatedCost: 2600,
      currency: 'EUR',
      isTemplate: true,
      isPublic: true
    },
    data: {
      waypoints: [
        { id: 'bi1', lat: 51.5074, lng: -0.1278, name: 'London, England', type: 'waypoint' },
        { id: 'bi2', lat: 55.9533, lng: -3.1883, name: 'Edinburgh, Scotland', type: 'waypoint' },
        { id: 'bi3', lat: 57.4778, lng: -4.2247, name: 'Inverness, Scotland', type: 'waypoint' },
        { id: 'bi4', lat: 56.8198, lng: -5.1052, name: 'Isle of Skye, Scotland', type: 'waypoint' },
        { id: 'bi5', lat: 54.5973, lng: -5.9301, name: 'Belfast, Northern Ireland', type: 'waypoint' },
        { id: 'bi6', lat: 53.3498, lng: -6.2603, name: 'Dublin, Ireland', type: 'waypoint' },
        { id: 'bi7', lat: 51.8985, lng: -8.4756, name: 'Cork, Ireland', type: 'waypoint' },
        { id: 'bi8', lat: 53.2707, lng: -9.0568, name: 'Galway, Ireland', type: 'waypoint' }
      ],
      routePreferences: {
        avoidTolls: true,
        avoidFerries: false,
        preferScenic: true,
        fuelEfficient: true
      },
      campsiteSelections: []
    },
    templateInfo: {
      templateId: 'british_isles_explorer',
      title: 'British Isles Explorer',
      description: 'From London\'s bustle to Scotland\'s highlands and Ireland\'s green landscapes',
      highlights: [
        'Edinburgh Castle - Historic fortress and royal residence',
        'Scottish Highlands - Dramatic mountains and lochs',
        'Isle of Skye - Rugged beauty and Gaelic culture',
        'Giant\'s Causeway - Natural wonder of basalt columns',
        'Ring of Kerry - Ireland\'s most scenic drive'
      ],
      recommendedMonths: [5, 6, 7, 8, 9], // Warmer months
      estimatedDuration: 20,
      difficultyReason: 'Narrow roads in Scotland and Ireland, ferry crossings required',
      author: 'Camper Planner',
      popularity: 68
    }
  }
];

export class TripTemplatesService {
  /**
   * Get all available trip templates
   */
  static getTemplates(): TripTemplate[] {
    return EUROPEAN_TRIP_TEMPLATES;
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: string): TripTemplate[] {
    return EUROPEAN_TRIP_TEMPLATES.filter(template =>
      template.metadata.category === category
    );
  }

  /**
   * Get templates by difficulty
   */
  static getTemplatesByDifficulty(difficulty: 'easy' | 'moderate' | 'challenging'): TripTemplate[] {
    return EUROPEAN_TRIP_TEMPLATES.filter(template =>
      template.metadata.difficulty === difficulty
    );
  }

  /**
   * Get templates by season
   */
  static getTemplatesBySeason(season: 'spring' | 'summer' | 'autumn' | 'winter' | 'year_round'): TripTemplate[] {
    return EUROPEAN_TRIP_TEMPLATES.filter(template =>
      template.metadata.season === season
    );
  }

  /**
   * Get templates by duration range
   */
  static getTemplatesByDuration(minDays: number, maxDays: number): TripTemplate[] {
    return EUROPEAN_TRIP_TEMPLATES.filter(template =>
      template.metadata.duration >= minDays && template.metadata.duration <= maxDays
    );
  }

  /**
   * Get templates by budget range
   */
  static getTemplatesByBudget(minCost: number, maxCost: number): TripTemplate[] {
    return EUROPEAN_TRIP_TEMPLATES.filter(template =>
      template.metadata.estimatedCost >= minCost && template.metadata.estimatedCost <= maxCost
    );
  }

  /**
   * Search templates by keywords
   */
  static searchTemplates(query: string): TripTemplate[] {
    const searchTerm = query.toLowerCase();
    return EUROPEAN_TRIP_TEMPLATES.filter(template =>
      template.metadata.name.toLowerCase().includes(searchTerm) ||
      template.metadata.description.toLowerCase().includes(searchTerm) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      template.metadata.countries.some(country => country.toLowerCase().includes(searchTerm)) ||
      template.templateInfo.highlights.some(highlight => highlight.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get template by ID
   */
  static getTemplate(templateId: string): TripTemplate | null {
    return EUROPEAN_TRIP_TEMPLATES.find(template =>
      template.metadata.id === templateId || template.templateInfo.templateId === templateId
    ) || null;
  }

  /**
   * Convert template to trip format for saving
   */
  static templateToTrip(template: TripTemplate, customName?: string): Omit<Trip, 'timestamps'> {
    const newTripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      metadata: {
        ...template.metadata,
        id: newTripId,
        name: customName || template.metadata.name,
        isTemplate: false,
        isPublic: false
      },
      data: template.data,
      sharing: {
        originalTripId: template.metadata.id,
        sharedBy: 'template',
        sharedAt: new Date()
      }
    };
  }

  /**
   * Get popular templates (sorted by popularity)
   */
  static getPopularTemplates(limit: number = 5): TripTemplate[] {
    return EUROPEAN_TRIP_TEMPLATES
      .sort((a, b) => b.templateInfo.popularity - a.templateInfo.popularity)
      .slice(0, limit);
  }

  /**
   * Get templates suitable for current month
   */
  static getSeasonalTemplates(): TripTemplate[] {
    const currentMonth = new Date().getMonth() + 1; // 1-12

    return EUROPEAN_TRIP_TEMPLATES.filter(template =>
      template.templateInfo.recommendedMonths.includes(currentMonth)
    );
  }

  /**
   * Get template statistics
   */
  static getTemplateStats() {
    const stats = {
      total: EUROPEAN_TRIP_TEMPLATES.length,
      byCategory: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      bySeason: {} as Record<string, number>,
      averageDuration: 0,
      averageCost: 0,
      priceRange: { min: Infinity, max: 0 },
      durationRange: { min: Infinity, max: 0 }
    };

    EUROPEAN_TRIP_TEMPLATES.forEach(template => {
      // Category stats
      stats.byCategory[template.metadata.category] = (stats.byCategory[template.metadata.category] || 0) + 1;

      // Difficulty stats
      stats.byDifficulty[template.metadata.difficulty] = (stats.byDifficulty[template.metadata.difficulty] || 0) + 1;

      // Season stats
      stats.bySeason[template.metadata.season] = (stats.bySeason[template.metadata.season] || 0) + 1;

      // Price range
      stats.priceRange.min = Math.min(stats.priceRange.min, template.metadata.estimatedCost);
      stats.priceRange.max = Math.max(stats.priceRange.max, template.metadata.estimatedCost);

      // Duration range
      stats.durationRange.min = Math.min(stats.durationRange.min, template.metadata.duration);
      stats.durationRange.max = Math.max(stats.durationRange.max, template.metadata.duration);
    });

    // Calculate averages
    stats.averageDuration = EUROPEAN_TRIP_TEMPLATES.reduce((sum, t) => sum + t.metadata.duration, 0) / stats.total;
    stats.averageCost = EUROPEAN_TRIP_TEMPLATES.reduce((sum, t) => sum + t.metadata.estimatedCost, 0) / stats.total;

    return stats;
  }

  /**
   * Get all unique countries from templates
   */
  static getTemplateCountries(): string[] {
    const countries = new Set<string>();
    EUROPEAN_TRIP_TEMPLATES.forEach(template => {
      template.metadata.countries.forEach(country => countries.add(country));
    });
    return Array.from(countries).sort();
  }

  /**
   * Get all unique tags from templates
   */
  static getTemplateTags(): string[] {
    const tags = new Set<string>();
    EUROPEAN_TRIP_TEMPLATES.forEach(template => {
      template.metadata.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }
}

// Export singleton instance
export const tripTemplatesService = new TripTemplatesService();