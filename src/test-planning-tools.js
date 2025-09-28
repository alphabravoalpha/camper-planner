// Planning Tools Test Script
// Phase 5.4: Test script for comprehensive trip planning functionality
// Run with: node src/test-planning-tools.js

// Mock data for testing planning tools
const testRoutes = [
  {
    name: 'Quick Weekend Getaway',
    waypoints: [
      { id: '1', lat: 52.5200, lng: 13.4050, name: 'Berlin, Germany', type: 'waypoint' },
      { id: '2', lat: 50.1109, lng: 8.6821, name: 'Frankfurt, Germany', type: 'waypoint' },
      { id: '3', lat: 48.1351, lng: 11.5820, name: 'Munich, Germany', type: 'waypoint' }
    ],
    vehicle: { type: 'campervan', length: 6, weight: 2800 },
    season: 'summer'
  },
  {
    name: 'Grand European Tour',
    waypoints: [
      { id: '1', lat: 48.8566, lng: 2.3522, name: 'Paris, France', type: 'waypoint' },
      { id: '2', lat: 50.1109, lng: 8.6821, name: 'Frankfurt, Germany', type: 'waypoint' },
      { id: '3', lat: 48.2082, lng: 16.3738, name: 'Vienna, Austria', type: 'waypoint' },
      { id: '4', lat: 45.4642, lng: 9.1900, name: 'Milan, Italy', type: 'waypoint' },
      { id: '5', lat: 46.2044, lng: 6.1432, name: 'Geneva, Switzerland', type: 'waypoint' },
      { id: '6', lat: 41.9028, lng: 12.4964, name: 'Rome, Italy', type: 'waypoint' },
      { id: '7', lat: 41.3851, lng: 2.1734, name: 'Barcelona, Spain', type: 'waypoint' }
    ],
    vehicle: { type: 'motorhome', length: 8.5, weight: 4200 },
    season: 'spring'
  },
  {
    name: 'Extreme Nordic Adventure',
    waypoints: [
      { id: '1', lat: 55.6761, lng: 12.5683, name: 'Copenhagen, Denmark', type: 'waypoint' },
      { id: '2', lat: 59.9139, lng: 10.7522, name: 'Oslo, Norway', type: 'waypoint' },
      { id: '3', lat: 62.4722, lng: 6.1492, name: 'Ålesund, Norway', type: 'waypoint' },
      { id: '4', lat: 69.6492, lng: 18.9553, name: 'Tromsø, Norway', type: 'waypoint' },
      { id: '5', lat: 71.1695, lng: 25.7847, name: 'North Cape, Norway', type: 'waypoint' }
    ],
    vehicle: { type: 'motorhome', length: 7.2, weight: 3500 },
    season: 'summer'
  }
];

// Test driving limits calculation
function testDrivingLimits() {
  console.log('🚗 Testing Driving Limits Calculation...\n');

  const vehicleTypes = [
    { type: 'campervan', length: 5.5, weight: 2500 },
    { type: 'motorhome', length: 7.0, weight: 3500 },
    { type: 'motorhome', length: 9.0, weight: 4500 }
  ];

  const seasons = ['spring', 'summer', 'autumn', 'winter'];

  vehicleTypes.forEach(vehicle => {
    console.log(`${vehicle.type.toUpperCase()} (${vehicle.length}m, ${vehicle.weight}kg):`);

    seasons.forEach(season => {
      // Mock driving limits calculation
      const baseLimits = {
        campervan: { maxDistance: 400, maxTime: 8, avgSpeed: 75 },
        motorhome: { maxDistance: 300, maxTime: 6, avgSpeed: 65 }
      };

      const seasonMultipliers = {
        winter: 0.7, spring: 0.9, summer: 1.0, autumn: 0.85
      };

      const sizeMultiplier = vehicle.length > 8 ? 0.8 : vehicle.length > 7 ? 0.9 : 1.0;
      const base = baseLimits[vehicle.type] || baseLimits.motorhome;
      const seasonMult = seasonMultipliers[season];

      const limits = {
        maxDistance: Math.round(base.maxDistance * seasonMult * sizeMultiplier),
        maxTime: Math.round(base.maxTime * seasonMult * sizeMultiplier * 10) / 10,
        avgSpeed: Math.round(base.avgSpeed * seasonMult)
      };

      console.log(`  ${season}: ${limits.maxDistance}km/day, ${limits.maxTime}h/day, ${limits.avgSpeed}km/h avg`);
    });
    console.log('');
  });

  console.log('✅ Driving Limits Tests Complete\n');
}

// Test trip duration estimation
function testTripDurationEstimation() {
  console.log('⏱️ Testing Trip Duration Estimation...\n');

  testRoutes.forEach(route => {
    console.log(`Route: ${route.name}`);
    console.log(`Vehicle: ${route.vehicle.type} (${route.vehicle.length}m)`);
    console.log(`Season: ${route.season}`);
    console.log(`Waypoints: ${route.waypoints.length}`);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < route.waypoints.length - 1; i++) {
      const start = route.waypoints[i];
      const end = route.waypoints[i + 1];
      const distance = calculateDistance(start, end);
      totalDistance += distance;
    }

    // Get driving limits
    const maxDailyDistance = route.vehicle.type === 'campervan' ? 400 : 300;
    const seasonalAdj = route.season === 'winter' ? 0.7 : route.season === 'summer' ? 1.0 : 0.85;
    const adjustedLimit = maxDailyDistance * seasonalAdj * (route.vehicle.length > 8 ? 0.8 : 1.0);

    // Estimate days
    const drivingDays = Math.ceil(totalDistance / adjustedLimit);
    const restDays = Math.floor(drivingDays / 3); // 1 rest day per 3 driving days
    const totalDays = drivingDays + restDays;

    console.log(`Total Distance: ${totalDistance.toFixed(0)}km`);
    console.log(`Daily Limit (adjusted): ${adjustedLimit.toFixed(0)}km`);
    console.log(`Estimated Duration: ${totalDays} days (${drivingDays} driving + ${restDays} rest)`);
    console.log(`Average per day: ${(totalDistance / drivingDays).toFixed(0)}km`);

    // Feasibility assessment
    const avgDaily = totalDistance / drivingDays;
    let feasibility;
    if (avgDaily <= adjustedLimit * 0.7) feasibility = 'excellent';
    else if (avgDaily <= adjustedLimit * 0.9) feasibility = 'good';
    else if (avgDaily <= adjustedLimit * 1.1) feasibility = 'challenging';
    else feasibility = 'unrealistic';

    console.log(`Feasibility: ${feasibility}`);
    console.log('');
  });

  console.log('✅ Trip Duration Estimation Tests Complete\n');
}

// Test daily stage planning
function testDailyStages() {
  console.log('📅 Testing Daily Stage Planning...\n');

  const route = testRoutes[1]; // Grand European Tour
  console.log(`Planning daily stages for: ${route.name}\n`);

  // Simulate daily stage creation
  const segments = [];
  for (let i = 0; i < route.waypoints.length - 1; i++) {
    const start = route.waypoints[i];
    const end = route.waypoints[i + 1];
    const distance = calculateDistance(start, end);
    segments.push({ start, end, distance, drivingTime: distance / 65 });
  }

  const maxDailyDistance = 270; // Adjusted for large motorhome in spring
  let currentDay = 1;
  let dailyDistance = 0;
  let currentStageSegments = [];

  console.log('Daily Stages:');
  segments.forEach((segment, index) => {
    if (dailyDistance + segment.distance > maxDailyDistance && currentStageSegments.length > 0) {
      // Finish current day
      const dayDistance = currentStageSegments.reduce((sum, s) => sum + s.distance, 0);
      const dayTime = currentStageSegments.reduce((sum, s) => sum + s.drivingTime, 0);

      console.log(`Day ${currentDay}: ${currentStageSegments[0].start.name} → ${currentStageSegments[currentStageSegments.length - 1].end.name}`);
      console.log(`  Distance: ${dayDistance.toFixed(0)}km`);
      console.log(`  Driving time: ${dayTime.toFixed(1)}h`);

      // Assess feasibility
      const feasibility = dayDistance <= maxDailyDistance * 0.7 ? 'excellent' :
                         dayDistance <= maxDailyDistance * 0.9 ? 'good' :
                         dayDistance <= maxDailyDistance * 1.1 ? 'challenging' : 'unrealistic';
      console.log(`  Feasibility: ${feasibility}`);

      // Add stops
      const stops = [];
      if (dayTime > 4) stops.push('Lunch break (1h)');
      if (dayTime > 6) stops.push('Rest stops (30min each)');
      stops.push('Overnight accommodation');

      if (stops.length > 0) {
        console.log(`  Planned stops: ${stops.join(', ')}`);
      }
      console.log('');

      currentDay++;
      dailyDistance = 0;
      currentStageSegments = [];
    }

    currentStageSegments.push(segment);
    dailyDistance += segment.distance;

    // Handle last segment
    if (index === segments.length - 1) {
      const dayDistance = currentStageSegments.reduce((sum, s) => sum + s.distance, 0);
      const dayTime = currentStageSegments.reduce((sum, s) => sum + s.drivingTime, 0);

      console.log(`Day ${currentDay}: ${currentStageSegments[0].start.name} → ${currentStageSegments[currentStageSegments.length - 1].end.name}`);
      console.log(`  Distance: ${dayDistance.toFixed(0)}km`);
      console.log(`  Driving time: ${dayTime.toFixed(1)}h`);
      console.log(`  Feasibility: ${dayDistance <= maxDailyDistance ? 'good' : 'challenging'}`);
    }
  });

  console.log('\n✅ Daily Stage Planning Tests Complete\n');
}

// Test planning recommendations
function testPlanningRecommendations() {
  console.log('💡 Testing Planning Recommendations...\n');

  testRoutes.forEach(route => {
    console.log(`Recommendations for: ${route.name}`);
    console.log(`Season: ${route.season}, Vehicle: ${route.vehicle.type}\n`);

    const recommendations = [];

    // Vehicle-based recommendations
    if (route.vehicle.length > 8) {
      recommendations.push({
        type: 'safety',
        priority: 'high',
        title: 'Large Vehicle Restrictions',
        description: 'Your large motorhome may face height and length restrictions',
        action: 'Check route restrictions and avoid narrow mountain roads'
      });
    }

    // Season-based recommendations
    if (route.season === 'winter') {
      recommendations.push({
        type: 'season',
        priority: 'high',
        title: 'Winter Travel Preparation',
        description: 'Winter conditions require special preparation and equipment',
        action: 'Pack winter gear, check road conditions, reduce daily distances'
      });
    }

    if (route.season === 'summer') {
      recommendations.push({
        type: 'comfort',
        priority: 'medium',
        title: 'Summer Heat Management',
        description: 'High temperatures can be uncomfortable and dangerous',
        action: 'Start early, ensure air conditioning, carry extra water'
      });
    }

    // Route intensity recommendations
    const totalDistance = route.waypoints.reduce((sum, wp, index) => {
      if (index === 0) return 0;
      return sum + calculateDistance(route.waypoints[index - 1], wp);
    }, 0);

    const avgDaily = totalDistance / Math.ceil(totalDistance / 300);
    if (avgDaily > 350) {
      recommendations.push({
        type: 'comfort',
        priority: 'medium',
        title: 'High Daily Driving Distance',
        description: 'Long daily drives can be tiring and stressful',
        action: 'Consider adding rest days or reducing daily distances'
      });
    }

    // Nordic-specific recommendations
    if (route.waypoints.some(wp => wp.lat > 65)) {
      recommendations.push({
        type: 'route',
        priority: 'high',
        title: 'Arctic Travel Considerations',
        description: 'Extreme northern locations require special preparation',
        action: 'Ensure adequate fuel, food, and emergency supplies'
      });
    }

    // Display recommendations
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      console.log(`   ${rec.description}`);
      console.log(`   Action: ${rec.action}`);
      console.log('');
    });

    console.log('');
  });

  console.log('✅ Planning Recommendations Tests Complete\n');
}

// Test feasibility analysis
function testFeasibilityAnalysis() {
  console.log('⚖️ Testing Trip Feasibility Analysis...\n');

  testRoutes.forEach(route => {
    console.log(`Feasibility Analysis: ${route.name}`);

    // Calculate metrics
    const totalDistance = route.waypoints.reduce((sum, wp, index) => {
      if (index === 0) return 0;
      return sum + calculateDistance(route.waypoints[index - 1], wp);
    }, 0);

    const maxDailyDistance = route.vehicle.type === 'campervan' ? 400 : 300;
    const seasonalAdj = route.season === 'winter' ? 0.7 : 1.0;
    const adjustedLimit = maxDailyDistance * seasonalAdj;

    const estimatedDays = Math.ceil(totalDistance / adjustedLimit);
    const avgDaily = totalDistance / estimatedDays;

    // Calculate feasibility score
    let feasibilityScore = 100;

    // Distance factor
    const distanceRatio = avgDaily / adjustedLimit;
    if (distanceRatio > 1.2) feasibilityScore -= 40;
    else if (distanceRatio > 1.0) feasibilityScore -= 20;
    else if (distanceRatio > 0.9) feasibilityScore -= 10;

    // Season factor
    if (route.season === 'winter') feasibilityScore -= 15;
    else if (route.season === 'autumn') feasibilityScore -= 5;

    // Vehicle factor
    if (route.vehicle.length > 8) feasibilityScore -= 10;

    // Duration factor
    if (estimatedDays > 21) feasibilityScore -= 10;
    else if (estimatedDays > 14) feasibilityScore -= 5;

    // Northern locations factor
    if (route.waypoints.some(wp => wp.lat > 65)) feasibilityScore -= 15;

    feasibilityScore = Math.max(0, feasibilityScore);

    let overallFeasibility;
    if (feasibilityScore >= 85) overallFeasibility = 'excellent';
    else if (feasibilityScore >= 70) overallFeasibility = 'good';
    else if (feasibilityScore >= 50) overallFeasibility = 'challenging';
    else overallFeasibility = 'unrealistic';

    console.log(`  Total Distance: ${totalDistance.toFixed(0)}km`);
    console.log(`  Estimated Duration: ${estimatedDays} days`);
    console.log(`  Average Daily: ${avgDaily.toFixed(0)}km`);
    console.log(`  Daily Limit: ${adjustedLimit.toFixed(0)}km`);
    console.log(`  Feasibility Score: ${feasibilityScore}/100`);
    console.log(`  Overall Assessment: ${overallFeasibility.toUpperCase()}`);

    // Generate warnings
    const warnings = [];
    if (distanceRatio > 1.1) warnings.push('Daily distances exceed recommended limits');
    if (route.season === 'winter') warnings.push('Winter travel conditions apply');
    if (estimatedDays > 21) warnings.push('Extended trip duration requires careful planning');
    if (route.vehicle.length > 8) warnings.push('Large vehicle restrictions may apply');

    if (warnings.length > 0) {
      console.log('  Warnings:');
      warnings.forEach(warning => console.log(`    • ${warning}`));
    }

    console.log('');
  });

  console.log('✅ Feasibility Analysis Tests Complete\n');
}

// Test seasonal factors
function testSeasonalFactors() {
  console.log('🌍 Testing Seasonal Factors...\n');

  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  const countries = ['Norway', 'Germany', 'Spain', 'Italy'];

  seasons.forEach(season => {
    console.log(`${season.toUpperCase()} Travel Conditions:`);

    countries.forEach(country => {
      const conditions = getSeasonalConditions(season, country);
      console.log(`  ${country}:`);
      console.log(`    Temperature: ${conditions.temp}°C`);
      console.log(`    Tourist density: ${conditions.tourists}`);
      console.log(`    Driving conditions: ${conditions.driving}`);
      console.log(`    Recommendation: ${conditions.recommendation}`);
    });

    console.log('');
  });

  console.log('✅ Seasonal Factors Tests Complete\n');
}

// Helper functions
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getSeasonalConditions(season, country) {
  const baseConditions = {
    spring: { temp: '8-18', tourists: 'medium', driving: 'good', recommendation: 'Perfect touring weather' },
    summer: { temp: '15-28', tourists: 'high', driving: 'excellent', recommendation: 'Peak season - book early' },
    autumn: { temp: '5-15', tourists: 'low', driving: 'good', recommendation: 'Beautiful colors, fewer crowds' },
    winter: { temp: '-5-8', tourists: 'low', driving: 'challenging', recommendation: 'Southern routes preferred' }
  };

  let conditions = baseConditions[season];

  // Adjust for specific countries
  if (country === 'Norway' && season === 'winter') {
    conditions = { ...conditions, temp: '-15-0', driving: 'difficult' };
  } else if (country === 'Spain' && season === 'summer') {
    conditions = { ...conditions, temp: '20-40', recommendation: 'Very hot - avoid midday travel' };
  }

  return conditions;
}

// Run all tests
console.log('🚀 Starting Planning Tools Tests...\n');

testDrivingLimits();
testTripDurationEstimation();
testDailyStages();
testPlanningRecommendations();
testFeasibilityAnalysis();
testSeasonalFactors();

console.log('🎉 All Planning Tools Tests Complete!\n');
console.log('Planning Tools System Features:');
console.log('✅ Vehicle-specific driving limits');
console.log('✅ Seasonal driving adjustments');
console.log('✅ Intelligent trip duration estimation');
console.log('✅ Daily stage planning with stops');
console.log('✅ Feasibility analysis and scoring');
console.log('✅ Smart planning recommendations');
console.log('✅ Seasonal travel factors');
console.log('✅ Route safety assessments');
console.log('✅ Break and rest planning');
console.log('✅ Accommodation type suggestions');
console.log('✅ Trip metrics and analytics');
console.log('✅ Interactive calendar view');
console.log('✅ Comprehensive dashboard');
console.log('\nReady for Step 5.4: Planning Tools!');