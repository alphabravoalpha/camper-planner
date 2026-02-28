import { describe, it, expect } from 'vitest';
import { CampsiteService } from '../CampsiteService';

// Access private methods for testing via type cast
const service = new CampsiteService();
const servicePrivate = service as unknown as {
  resolveImageUrl: (tags: Record<string, string>) => string | undefined;
  calculateDataCompleteness: (tags: Record<string, string>) => 'minimal' | 'basic' | 'detailed';
  parseOSMElement: (element: {
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }) => ReturnType<typeof Object> | null;
};

describe('CampsiteService', () => {
  describe('resolveImageUrl', () => {
    it('should construct Wikimedia Commons thumbnail URL from wikimedia_commons tag', () => {
      const tags = { wikimedia_commons: 'File:Example_campsite.jpg' };
      const url = servicePrivate.resolveImageUrl(tags);

      expect(url).toBe('https://commons.wikimedia.org/w/thumb.php?f=Example_campsite.jpg&w=400');
    });

    it('should handle wikimedia_commons tag without File: prefix', () => {
      const tags = { wikimedia_commons: 'Campsite_photo.png' };
      const url = servicePrivate.resolveImageUrl(tags);

      expect(url).toBe('https://commons.wikimedia.org/w/thumb.php?f=Campsite_photo.png&w=400');
    });

    it('should use image:wikimedia tag as fallback', () => {
      const tags = { 'image:wikimedia': 'File:Fallback_image.jpg' };
      const url = servicePrivate.resolveImageUrl(tags);

      expect(url).toBe('https://commons.wikimedia.org/w/thumb.php?f=Fallback_image.jpg&w=400');
    });

    it('should prefer wikimedia_commons over image:wikimedia', () => {
      const tags = {
        wikimedia_commons: 'File:Primary.jpg',
        'image:wikimedia': 'File:Secondary.jpg',
      };
      const url = servicePrivate.resolveImageUrl(tags);

      expect(url).toContain('Primary.jpg');
    });

    it('should return direct HTTP image URL', () => {
      const tags = { image: 'https://example.com/photo.jpg' };
      const url = servicePrivate.resolveImageUrl(tags);

      expect(url).toBe('https://example.com/photo.jpg');
    });

    it('should ignore non-HTTP image values', () => {
      const tags = { image: 'some-local-path.jpg' };
      const url = servicePrivate.resolveImageUrl(tags);

      expect(url).toBeUndefined();
    });

    it('should return undefined when no image tags present', () => {
      const tags = { name: 'Test Campsite' };
      const url = servicePrivate.resolveImageUrl(tags);

      expect(url).toBeUndefined();
    });

    it('should encode special characters in Wikimedia filenames', () => {
      const tags = { wikimedia_commons: 'File:Camp site (2024).jpg' };
      const url = servicePrivate.resolveImageUrl(tags);

      expect(url).toContain('Camp%20site%20(2024).jpg');
    });
  });

  describe('calculateDataCompleteness', () => {
    it('should return "minimal" for tags with no name', () => {
      const tags = {};
      const result = servicePrivate.calculateDataCompleteness(tags);

      expect(result).toBe('minimal');
    });

    it('should return "minimal" for name-only tags', () => {
      const tags = { name: 'Basic Camp' };
      const result = servicePrivate.calculateDataCompleteness(tags);

      expect(result).toBe('minimal');
    });

    it('should return "basic" for name + one amenity', () => {
      const tags = { name: 'Camp A', drinking_water: 'yes' };
      const result = servicePrivate.calculateDataCompleteness(tags);

      expect(result).toBe('basic');
    });

    it('should return "basic" for name + contact info', () => {
      const tags = { name: 'Camp B', phone: '+33123456789' };
      const result = servicePrivate.calculateDataCompleteness(tags);

      expect(result).toBe('basic');
    });

    it('should return "basic" for name + website', () => {
      const tags = { name: 'Camp C', website: 'https://camp.com' };
      const result = servicePrivate.calculateDataCompleteness(tags);

      expect(result).toBe('basic');
    });

    it('should return "detailed" for name + 3 amenities + contact + hours', () => {
      const tags = {
        name: 'Full Camp',
        drinking_water: 'yes',
        electricity: 'yes',
        shower: 'yes',
        phone: '+33123456789',
        opening_hours: 'Apr-Oct 08:00-20:00',
      };
      const result = servicePrivate.calculateDataCompleteness(tags);

      expect(result).toBe('detailed');
    });

    it('should not count non-yes values as amenities', () => {
      const tags = {
        name: 'Camp D',
        drinking_water: 'no',
        electricity: 'no',
        shower: 'no',
        phone: '+33123456789',
        opening_hours: 'All year',
      };
      const result = servicePrivate.calculateDataCompleteness(tags);

      // Only has name + contact, no amenity count >= 3, so basic
      expect(result).toBe('basic');
    });

    it('should return "basic" when missing contact even with amenities', () => {
      const tags = {
        name: 'Camp E',
        drinking_water: 'yes',
        electricity: 'yes',
        shower: 'yes',
        toilets: 'yes',
        opening_hours: 'All year',
      };
      const result = servicePrivate.calculateDataCompleteness(tags);

      // Has name, 4 amenities, hours, but no contact => still basic (requires all 4 for detailed)
      expect(result).toBe('basic');
    });

    it('should accept email as contact', () => {
      const tags = {
        name: 'Camp F',
        drinking_water: 'yes',
        electricity: 'yes',
        shower: 'yes',
        email: 'info@camp.com',
        opening_hours: '24/7',
      };
      const result = servicePrivate.calculateDataCompleteness(tags);

      expect(result).toBe('detailed');
    });
  });

  describe('parseOSMElement — extended field extraction', () => {
    const baseElement = {
      id: 99999,
      lat: 45.0,
      lon: 6.0,
      tags: {
        tourism: 'camp_site',
        name: 'Test Extended Camp',
      },
    };

    it('should extract stars from tags', () => {
      const element = {
        ...baseElement,
        tags: { ...baseElement.tags, stars: '4' },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result).not.toBeNull();
      expect(result!.stars).toBe(4);
    });

    it('should extract description from tags', () => {
      const element = {
        ...baseElement,
        tags: { ...baseElement.tags, description: 'A lovely campsite by the river' },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result!.description).toBe('A lovely campsite by the river');
    });

    it('should fall back to description:en', () => {
      const element = {
        ...baseElement,
        tags: { ...baseElement.tags, 'description:en': 'English description' },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result!.description).toBe('English description');
    });

    it('should extract operator', () => {
      const element = {
        ...baseElement,
        tags: { ...baseElement.tags, operator: 'Municipality of Nice' },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result!.operator).toBe('Municipality of Nice');
    });

    it('should extract policies', () => {
      const element = {
        ...baseElement,
        tags: {
          ...baseElement.tags,
          dog: 'leashed',
          openfire: 'yes',
          bbq: 'yes',
          nudism: 'no',
        },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result!.policies).toEqual({
        dogs: 'leashed',
        fires: true,
        bbq: true,
        nudism: false,
      });
    });

    it('should extract capacity details', () => {
      const element = {
        ...baseElement,
        tags: {
          ...baseElement.tags,
          'capacity:pitches': '50',
          'capacity:tents': '30',
          'capacity:caravans': '20',
        },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result!.capacityDetails).toEqual({
        pitches: 50,
        tents: 30,
        caravans: 20,
      });
    });

    it('should extract power supply', () => {
      const element = {
        ...baseElement,
        tags: { ...baseElement.tags, power_supply: 'CEE 16A' },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result!.powerSupply).toBe('CEE 16A');
    });

    it('should extract structured address', () => {
      const element = {
        ...baseElement,
        tags: {
          ...baseElement.tags,
          'addr:street': 'Route de la Plage',
          'addr:city': 'Nice',
          'addr:postcode': '06000',
          'addr:country': 'FR',
        },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result!.structuredAddress).toEqual({
        street: 'Route de la Plage',
        city: 'Nice',
        postcode: '06000',
        country: 'FR',
      });
    });

    it('should extract new amenity booleans', () => {
      const element = {
        ...baseElement,
        tags: {
          ...baseElement.tags,
          sanitary_dump_station: 'yes',
          waste_disposal: 'yes',
          hot_water: 'yes',
          kitchen: 'no',
          picnic_table: 'yes',
          bbq: 'yes',
        },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result!.amenities.sanitary_dump_station).toBe(true);
      expect(result!.amenities.waste_disposal).toBe(true);
      expect(result!.amenities.hot_water).toBe(true);
      expect(result!.amenities.kitchen).toBe(false);
      expect(result!.amenities.picnic_table).toBe(true);
      expect(result!.amenities.bbq).toBe(true);
    });

    it('should default new amenity booleans to false when tags absent', () => {
      const result = servicePrivate.parseOSMElement(baseElement);

      expect(result!.amenities.sanitary_dump_station).toBe(false);
      expect(result!.amenities.waste_disposal).toBe(false);
      expect(result!.amenities.hot_water).toBe(false);
      expect(result!.amenities.kitchen).toBe(false);
      expect(result!.amenities.picnic_table).toBe(false);
      expect(result!.amenities.bbq).toBe(false);
    });

    it('should set dataCompleteness based on tags', () => {
      const minimalElement = {
        ...baseElement,
        tags: { tourism: 'camp_site' },
      };
      const minimalResult = servicePrivate.parseOSMElement(minimalElement);
      expect(minimalResult!.dataCompleteness).toBe('minimal');

      const basicElement = {
        ...baseElement,
        tags: {
          tourism: 'camp_site',
          name: 'Camp',
          drinking_water: 'yes',
        },
      };
      const basicResult = servicePrivate.parseOSMElement(basicElement);
      expect(basicResult!.dataCompleteness).toBe('basic');
    });

    it('should resolve Wikimedia image URL', () => {
      const element = {
        ...baseElement,
        tags: {
          ...baseElement.tags,
          wikimedia_commons: 'File:Camp_photo.jpg',
        },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result!.imageUrl).toContain('commons.wikimedia.org');
      expect(result!.imageUrl).toContain('Camp_photo.jpg');
    });

    it('should return null for elements without coordinates', () => {
      const element = { id: 1, tags: { tourism: 'camp_site', name: 'Test' } };
      const result = servicePrivate.parseOSMElement(element);

      expect(result).toBeNull();
    });

    it('should return null for disused campsites', () => {
      const element = {
        ...baseElement,
        tags: { ...baseElement.tags, disused: 'yes' },
      };
      const result = servicePrivate.parseOSMElement(element);

      expect(result).toBeNull();
    });
  });
});
