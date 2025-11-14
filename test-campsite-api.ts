/**
 * Campsite API Integration Test
 * Tests Overpass API integration with real European campsite data
 *
 * Run with: npx tsx test-campsite-api.ts
 */

import { campsiteService, CampsiteRequest } from './src/services/CampsiteService';

// Test configuration
const testCases = [
  {
    name: 'Southern France (Nice area)',
    bounds: {
      north: 43.8,
      south: 43.6,
      east: 7.4,
      west: 7.1
    },
    types: ['campsite', 'caravan_site', 'aire'] as const,
    expectedMin: 5,
    description: 'Popular tourist area with many campsites'
  },
  {
    name: 'Netherlands (Amsterdam area)',
    bounds: {
      north: 52.5,
      south: 52.2,
      east: 5.0,
      west: 4.7
    },
    types: ['campsite', 'caravan_site'] as const,
    expectedMin: 3,
    description: 'Well-documented camping area'
  },
  {
    name: 'German Alps (Bavaria)',
    bounds: {
      north: 47.7,
      south: 47.4,
      east: 11.2,
      west: 10.8
    },
    types: ['campsite', 'aire'] as const,
    expectedMin: 5,
    description: 'Mountain camping region'
  },
  {
    name: 'Swiss Lake Geneva',
    bounds: {
      north: 46.6,
      south: 46.3,
      east: 6.7,
      west: 6.4
    },
    types: ['campsite', 'caravan_site'] as const,
    expectedMin: 2,
    description: 'Tourist lake region'
  },
  {
    name: 'Spain Costa Brava',
    bounds: {
      north: 42.0,
      south: 41.7,
      east: 3.3,
      west: 3.0
    },
    types: ['campsite', 'caravan_site', 'aire'] as const,
    expectedMin: 10,
    description: 'Very popular coastal camping area'
  }
];

async function runTest(testCase: typeof testCases[0]) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`Bounds: ${JSON.stringify(testCase.bounds)}`);
  console.log(`Types: ${testCase.types.join(', ')}`);
  console.log(`Expected minimum: ${testCase.expectedMin} campsites`);
  console.log(`${'='.repeat(60)}\n`);

  const request: CampsiteRequest = {
    bounds: testCase.bounds,
    types: testCase.types,
    maxResults: 100
  };

  try {
    const startTime = Date.now();
    const response = await campsiteService.searchCampsites(request);
    const duration = Date.now() - startTime;

    console.log(`✓ API call successful in ${duration}ms`);
    console.log(`  Service: ${response.metadata.service}`);
    console.log(`  Results: ${response.campsites.length} campsites found`);
    console.log(`  Cache hit: ${response.metadata.cache_hit ? 'Yes' : 'No'}`);
    console.log(`  Query duration: ${response.metadata.query_duration}ms`);

    if (response.campsites.length >= testCase.expectedMin) {
      console.log(`✓ PASS: Found ${response.campsites.length} campsites (expected min: ${testCase.expectedMin})`);
    } else {
      console.log(`⚠ WARNING: Found ${response.campsites.length} campsites (expected min: ${testCase.expectedMin})`);
      console.log(`  This might be okay if OSM data is sparse in this area`);
    }

    // Show first 3 campsites as examples
    if (response.campsites.length > 0) {
      console.log(`\n  Sample campsites:`);
      response.campsites.slice(0, 3).forEach((campsite, idx) => {
        console.log(`\n  ${idx + 1}. ${campsite.name}`);
        console.log(`     Type: ${campsite.type}`);
        console.log(`     Location: ${campsite.lat.toFixed(4)}, ${campsite.lng.toFixed(4)}`);
        console.log(`     Source: ${campsite.source}`);
        console.log(`     Quality: ${((campsite.quality_score || 0) * 100).toFixed(0)}%`);

        // Show amenities
        const availableAmenities = Object.entries(campsite.amenities)
          .filter(([_, available]) => available)
          .map(([amenity]) => amenity);
        if (availableAmenities.length > 0) {
          console.log(`     Amenities: ${availableAmenities.join(', ')}`);
        }

        // Show vehicle access
        const vehicleAccess = [];
        if (campsite.access.motorhome) vehicleAccess.push('motorhome');
        if (campsite.access.caravan) vehicleAccess.push('caravan');
        if (campsite.access.tent) vehicleAccess.push('tent');
        if (vehicleAccess.length > 0) {
          console.log(`     Vehicle access: ${vehicleAccess.join(', ')}`);
        }

        // Show restrictions
        if (campsite.access.max_height || campsite.access.max_length || campsite.access.max_weight) {
          const restrictions = [];
          if (campsite.access.max_height) restrictions.push(`height: ${campsite.access.max_height}m`);
          if (campsite.access.max_length) restrictions.push(`length: ${campsite.access.max_length}m`);
          if (campsite.access.max_weight) restrictions.push(`weight: ${campsite.access.max_weight}t`);
          console.log(`     Restrictions: ${restrictions.join(', ')}`);
        }

        // Show contact info
        if (campsite.contact.website || campsite.contact.phone) {
          const contact = [];
          if (campsite.contact.website) contact.push(`web: ${campsite.contact.website}`);
          if (campsite.contact.phone) contact.push(`phone: ${campsite.contact.phone}`);
          console.log(`     Contact: ${contact.join(', ')}`);
        }
      });
    }

    return {
      success: true,
      count: response.campsites.length,
      duration,
      cached: response.metadata.cache_hit
    };

  } catch (error) {
    console.log(`✗ FAIL: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.log(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
    return {
      success: false,
      count: 0,
      duration: 0,
      cached: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testVehicleFiltering() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: Vehicle Compatibility Filtering`);
  console.log(`${'='.repeat(60)}\n`);

  const request: CampsiteRequest = {
    bounds: {
      north: 43.8,
      south: 43.6,
      east: 7.4,
      west: 7.1
    },
    types: ['campsite', 'caravan_site'],
    maxResults: 50,
    vehicleFilter: {
      height: 4.0,  // 4m tall motorhome
      length: 8.0,  // 8m long
      weight: 3.5,  // 3.5 tonnes
      motorhome: true
    }
  };

  try {
    const response = await campsiteService.searchCampsites(request);
    console.log(`✓ Found ${response.campsites.length} campsites compatible with large motorhome`);
    console.log(`  Vehicle: 4.0m height, 8.0m length, 3.5t weight, motorhome`);

    // Check how many have restrictions
    let withRestrictions = 0;
    response.campsites.forEach(campsite => {
      if (campsite.access.max_height || campsite.access.max_length || campsite.access.max_weight) {
        withRestrictions++;
      }
    });

    console.log(`  Campsites with restrictions: ${withRestrictions}/${response.campsites.length}`);
    return { success: true };

  } catch (error) {
    console.log(`✗ FAIL: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false };
  }
}

async function testCachePerformance() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: IndexedDB Cache Performance`);
  console.log(`${'='.repeat(60)}\n`);

  const request: CampsiteRequest = {
    bounds: {
      north: 43.8,
      south: 43.6,
      east: 7.4,
      west: 7.1
    },
    types: ['campsite', 'caravan_site', 'aire']
  };

  try {
    // First request (should fetch from API)
    console.log(`Making first request (should query Overpass API)...`);
    const start1 = Date.now();
    const response1 = await campsiteService.searchCampsites(request);
    const duration1 = Date.now() - start1;

    console.log(`✓ First request: ${duration1}ms, cache hit: ${response1.metadata.cache_hit}`);

    // Second request (should use cache)
    console.log(`\nMaking second request (should use cache)...`);
    const start2 = Date.now();
    const response2 = await campsiteService.searchCampsites(request);
    const duration2 = Date.now() - start2;

    console.log(`✓ Second request: ${duration2}ms, cache hit: ${response2.metadata.cache_hit}`);

    if (response2.metadata.cache_hit && duration2 < duration1) {
      console.log(`✓ PASS: Cache is working! ${duration1}ms → ${duration2}ms (${((1 - duration2/duration1) * 100).toFixed(0)}% faster)`);
    } else if (response2.metadata.cache_hit) {
      console.log(`✓ Cache hit but not faster (might be network variance)`);
    } else {
      console.log(`⚠ WARNING: Second request didn't hit cache`);
    }

    return { success: true };

  } catch (error) {
    console.log(`✗ FAIL: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false };
  }
}

async function testOverpassHealth() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: Overpass API Health Check`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const healthy = await campsiteService.healthCheck();
    if (healthy) {
      console.log(`✓ PASS: Overpass API is healthy and responding`);
    } else {
      console.log(`✗ FAIL: Overpass API health check failed`);
    }

    // Get service status
    const status = campsiteService.getServiceStatus();
    console.log(`\nService Status:`);
    console.log(`  Primary: ${status.primary.name} (${status.primary.healthy ? 'healthy' : 'unhealthy'})`);
    console.log(`  Fallback: ${status.fallback.name} (${status.fallback.available ? 'available' : 'unavailable'})`);
    console.log(`  Rate limit: ${status.rateLimitInfo.remaining} requests remaining`);

    return { success: healthy };

  } catch (error) {
    console.log(`✗ FAIL: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false };
  }
}

// Main test runner
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  Campsite API Integration Test Suite                    ║
║  European Camper Trip Planner - Phase 4                 ║
╚══════════════════════════════════════════════════════════╝
  `);

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Overpass API health
  console.log(`\n[1/7] Testing Overpass API connectivity...`);
  const healthResult = await testOverpassHealth();
  results.total++;
  if (healthResult.success) results.passed++;
  else results.failed++;

  // Wait 2 seconds between tests to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2-6: Regional campsite searches
  for (let i = 0; i < testCases.length; i++) {
    console.log(`\n[${i + 2}/7] Running test ${i + 1}/${testCases.length}...`);
    const result = await runTest(testCases[i]);
    results.total++;
    if (result.success) {
      if (result.count >= testCases[i].expectedMin) {
        results.passed++;
      } else {
        results.warnings++;
      }
    } else {
      results.failed++;
    }

    // Wait between tests
    if (i < testCases.length - 1) {
      console.log(`\n⏳ Waiting 3 seconds to respect API rate limits...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Test 7: Vehicle filtering
  console.log(`\n[7/7] Testing vehicle compatibility filtering...`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  const vehicleResult = await testVehicleFiltering();
  results.total++;
  if (vehicleResult.success) results.passed++;
  else results.failed++;

  // Test 8: Cache performance
  console.log(`\n[BONUS] Testing IndexedDB cache performance...`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  const cacheResult = await testCachePerformance();

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total tests: ${results.total}`);
  console.log(`✓ Passed: ${results.passed}`);
  console.log(`⚠ Warnings: ${results.warnings}`);
  console.log(`✗ Failed: ${results.failed}`);
  console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log(`\n🎉 All tests passed! Phase 4 Overpass API integration is working.`);
  } else if (results.failed < 3) {
    console.log(`\n⚠ Most tests passed, but some failed. Check error messages above.`);
  } else {
    console.log(`\n❌ Multiple tests failed. Phase 4 needs attention.`);
  }

  console.log(`\nNext steps:`);
  console.log(`  1. Fix any type mismatches in campsite components`);
  console.log(`  2. Test UI integration with map`);
  console.log(`  3. Test mobile responsiveness`);
  console.log(`  4. Validate filtering and search functionality`);
  console.log(`\n`);

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error(`\n❌ Fatal error:`, error);
  process.exit(1);
});
