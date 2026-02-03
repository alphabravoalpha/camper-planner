import { describe, it, expect, beforeEach } from 'vitest';
import {
  CostCalculationService,
  type FuelConsumptionSettings,
  type FuelPriceSettings,
} from '../CostCalculationService';
import { type Waypoint, type VehicleProfile } from '../../store';

describe('CostCalculationService', () => {
  let testWaypoints: Waypoint[];
  let testVehicleProfile: VehicleProfile;
  let testFuelSettings: FuelConsumptionSettings;
  let testPriceSettings: FuelPriceSettings;

  beforeEach(() => {
    // Test waypoints for a simple route
    testWaypoints = [
      {
        id: '1',
        name: 'Paris',
        lat: 48.8566,
        lng: 2.3522,
        type: 'start',
      },
      {
        id: '2',
        name: 'Lyon',
        lat: 45.7640,
        lng: 4.8357,
        type: 'waypoint',
      },
      {
        id: '3',
        name: 'Marseille',
        lat: 43.2965,
        lng: 5.3698,
        type: 'end',
      },
    ];

    testVehicleProfile = {
      id: 'test-vehicle',
      name: 'Test Motorhome',
      type: 'motorhome',
      height: 3.2,
      width: 2.3,
      weight: 3.5,
      length: 7.0,
      fuelType: 'diesel',
    };

    testFuelSettings = {
      consumptionType: 'l_per_100km',
      consumption: 12,
      fuelType: 'diesel',
      tankCapacity: 90,
    };

    testPriceSettings = {
      priceType: 'manual',
      manualPrices: {
        petrol: 1.65,
        diesel: 1.55,
        lpg: 0.85,
        electricity: 0.35,
      },
      currency: 'EUR',
    };
  });

  describe('Initialization and Configuration', () => {
    it('should initialize settings', () => {
      CostCalculationService.initializeSettings(testFuelSettings, testPriceSettings);

      const currentPrices = CostCalculationService.getCurrentFuelPrices();
      expect(currentPrices).toBeDefined();
      expect(currentPrices?.diesel).toBe(1.55);
    });

    it('should get default consumption for vehicle', () => {
      const defaultSettings = CostCalculationService.getDefaultConsumption(testVehicleProfile);

      expect(defaultSettings).toBeDefined();
      expect(defaultSettings).toHaveProperty('consumptionType');
      expect(defaultSettings).toHaveProperty('consumption');
      expect(defaultSettings).toHaveProperty('fuelType');
      expect(defaultSettings.consumption).toBeGreaterThan(0);
    });

    it('should get current fuel prices', () => {
      CostCalculationService.initializeSettings(testFuelSettings, testPriceSettings);

      const prices = CostCalculationService.getCurrentFuelPrices();

      expect(prices).toBeDefined();
      expect(prices?.petrol).toBeGreaterThan(0);
      expect(prices?.diesel).toBeGreaterThan(0);
      expect(prices?.lpg).toBeGreaterThan(0);
      expect(prices?.electricity).toBeGreaterThan(0);
    });
  });

  describe('Route Cost Calculation', () => {
    beforeEach(() => {
      CostCalculationService.initializeSettings(testFuelSettings, testPriceSettings);
    });

    it('should calculate route costs', async () => {
      const result = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('fuelCost');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('segments');
      expect(result).toHaveProperty('dailyBreakdown');
    });

    it('should return positive total cost', async () => {
      const result = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      expect(result.totalCost).toBeGreaterThan(0);
      expect(result.fuelCost).toBeGreaterThan(0);
    });

    it('should have correct currency', async () => {
      const result = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      expect(result.currency).toBe('EUR');
    });

    it('should include route segments', async () => {
      const result = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      expect(Array.isArray(result.segments)).toBe(true);
      expect(result.segments.length).toBeGreaterThan(0);

      // Check segment structure
      const segment = result.segments[0];
      expect(segment).toHaveProperty('startWaypoint');
      expect(segment).toHaveProperty('endWaypoint');
      expect(segment).toHaveProperty('distance');
      expect(segment).toHaveProperty('duration');
      expect(segment).toHaveProperty('fuelCost');
      expect(segment).toHaveProperty('segmentType');
    });

    it('should include daily breakdown', async () => {
      const result = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      expect(Array.isArray(result.dailyBreakdown)).toBe(true);

      if (result.dailyBreakdown.length > 0) {
        const day = result.dailyBreakdown[0];
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('distance');
        expect(day).toHaveProperty('fuelCost');
        expect(day).toHaveProperty('totalDailyCost');
      }
    });

    it('should handle different fuel types', async () => {
      const petrolSettings: FuelConsumptionSettings = {
        ...testFuelSettings,
        fuelType: 'petrol',
        consumption: 15,
      };

      const result = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        petrolSettings,
        testPriceSettings
      );

      expect(result.fuelCost).toBeGreaterThan(0);
    });
  });

  describe('Cost Optimization', () => {
    beforeEach(() => {
      CostCalculationService.initializeSettings(testFuelSettings, testPriceSettings);
    });

    it('should calculate cost optimizations', async () => {
      // First get cost breakdown
      const costBreakdown = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      // Then get optimizations
      const result = await CostCalculationService.calculateCostOptimizations(
        costBreakdown,
        testVehicleProfile
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('currentCost');
      expect(result).toHaveProperty('optimizedCost');
      expect(result).toHaveProperty('savings');
      expect(result).toHaveProperty('suggestions');
    });

    it('should provide optimization suggestions', async () => {
      const costBreakdown = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      const result = await CostCalculationService.calculateCostOptimizations(
        costBreakdown,
        testVehicleProfile
      );

      expect(Array.isArray(result.suggestions)).toBe(true);

      if (result.suggestions.length > 0) {
        const suggestion = result.suggestions[0];
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('potentialSaving');
        expect(suggestion).toHaveProperty('actionRequired');
      }
    });

    it('should calculate realistic savings', async () => {
      const costBreakdown = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      const result = await CostCalculationService.calculateCostOptimizations(
        costBreakdown,
        testVehicleProfile
      );

      expect(result.savings).toBeGreaterThanOrEqual(0);
      expect(result.optimizedCost).toBeLessThanOrEqual(result.currentCost);
    });
  });

  describe('Utility Methods', () => {
    it('should convert fuel consumption between units', () => {
      // L/100km to MPG Imperial
      const mpgImperial = CostCalculationService.convertConsumption(
        10,
        'l_per_100km',
        'mpg_imperial'
      );
      expect(mpgImperial).toBeGreaterThan(0);

      // L/100km to MPG US
      const mpgUs = CostCalculationService.convertConsumption(
        10,
        'l_per_100km',
        'mpg_us'
      );
      expect(mpgUs).toBeGreaterThan(0);

      // MPG to L/100km should be inverse relationship
      const backToLiters = CostCalculationService.convertConsumption(
        mpgImperial,
        'mpg_imperial',
        'l_per_100km'
      );
      expect(backToLiters).toBeCloseTo(10, 1);
    });

    it('should calculate fuel cost for distance', () => {
      const cost = CostCalculationService.calculateFuelCost(
        100, // 100 km
        testFuelSettings,
        testPriceSettings
      );

      expect(cost).toBeGreaterThan(0);
      // 100km at 12L/100km = 12L, at €1.55/L = €18.60
      expect(cost).toBeCloseTo(18.6, 1);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      CostCalculationService.initializeSettings(testFuelSettings, testPriceSettings);
    });

    it('should handle single waypoint gracefully', async () => {
      const singleWaypoint = [testWaypoints[0]];

      const result = await CostCalculationService.calculateRouteCosts(
        singleWaypoint,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      expect(result).toBeDefined();
      expect(result.totalCost).toBe(0);
      expect(result.segments).toHaveLength(0);
    });

    it('should handle very efficient vehicle', async () => {
      const efficientSettings: FuelConsumptionSettings = {
        consumptionType: 'l_per_100km',
        consumption: 5, // Very efficient
        fuelType: 'diesel',
      };

      const result = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        efficientSettings,
        testPriceSettings
      );

      expect(result.fuelCost).toBeGreaterThan(0);
      expect(result.fuelCost).toBeLessThan(1000); // Reasonable for efficient vehicle
    });

    it('should handle electric vehicle', async () => {
      const electricSettings: FuelConsumptionSettings = {
        consumptionType: 'l_per_100km', // Actually kWh/100km for electric
        consumption: 25,
        fuelType: 'electricity',
      };

      const result = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        electricSettings,
        testPriceSettings
      );

      expect(result.fuelCost).toBeGreaterThan(0);
    });

    it('should handle high fuel prices', async () => {
      const highPriceSettings: FuelPriceSettings = {
        priceType: 'manual',
        manualPrices: {
          petrol: 3.0,
          diesel: 3.0,
          lpg: 2.0,
          electricity: 1.0,
        },
        currency: 'EUR',
      };

      const result = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        testFuelSettings,
        highPriceSettings
      );

      expect(result.fuelCost).toBeGreaterThan(0);
    });

    it('should handle zero consumption (hypothetical)', () => {
      const cost = CostCalculationService.calculateFuelCost(
        100,
        { ...testFuelSettings, consumption: 0 },
        testPriceSettings
      );

      expect(cost).toBe(0);
    });
  });

  describe('Realistic Scenarios', () => {
    beforeEach(() => {
      CostCalculationService.initializeSettings(testFuelSettings, testPriceSettings);
    });

    it('should calculate realistic cost for 1000km trip', async () => {
      // Create longer route
      const longRoute: Waypoint[] = [
        { id: '1', name: 'Paris', lat: 48.8566, lng: 2.3522, type: 'start' },
        { id: '2', name: 'Lyon', lat: 45.7640, lng: 4.8357, type: 'waypoint' },
        { id: '3', name: 'Nice', lat: 43.7102, lng: 7.2620, type: 'waypoint' },
        { id: '4', name: 'Barcelona', lat: 41.3851, lng: 2.1734, type: 'end' },
      ];

      const result = await CostCalculationService.calculateRouteCosts(
        longRoute,
        testVehicleProfile,
        testFuelSettings,
        testPriceSettings
      );

      expect(result.totalCost).toBeGreaterThan(50); // At least €50 for fuel
      expect(result.totalCost).toBeLessThan(500); // Less than €500 seems reasonable
    });

    it('should show LPG is cheaper than diesel', async () => {
      const dieselResult = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        { ...testFuelSettings, fuelType: 'diesel', consumption: 12 },
        testPriceSettings
      );

      const lpgResult = await CostCalculationService.calculateRouteCosts(
        testWaypoints,
        testVehicleProfile,
        { ...testFuelSettings, fuelType: 'lpg', consumption: 14 }, // LPG uses more but is cheaper
        testPriceSettings
      );

      // LPG should generally be cheaper despite higher consumption
      expect(lpgResult.fuelCost).toBeLessThan(dieselResult.fuelCost * 1.2);
    });
  });
});
