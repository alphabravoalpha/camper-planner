// GPS Device Compatibility Testing
// Phase 6.1: Verify GPX exports work with popular GPS devices and apps

import { RouteExportService } from './services/RouteExportService.js';

// Test waypoints for compatibility testing
const testWaypoints = [
  {
    id: '1',
    lat: 52.5200,
    lng: 13.4050,
    name: 'Berlin, Germany',
    type: 'start',
    address: 'Berlin, Germany'
  },
  {
    id: '2',
    lat: 48.8566,
    lng: 2.3522,
    name: 'Paris, France',
    type: 'waypoint',
    address: 'Paris, France'
  },
  {
    id: '3',
    lat: 41.9028,
    lng: 12.4964,
    name: 'Rome, Italy',
    type: 'end',
    address: 'Rome, Italy'
  }
];

// GPS Device Compatibility Test Suite
class GPSCompatibilityTester {
  constructor() {
    this.testResults = [];
  }

  // Test GPX export for specific device compatibility
  async testDeviceCompatibility(deviceType) {
    console.log(`\n🧪 Testing ${deviceType} compatibility...`);

    const options = {
      format: 'gpx',
      includeWaypoints: true,
      includeCampsites: true,
      includeRoute: true,
      includeVehicleInfo: true,
      includeCostData: false,
      includePlanningData: false,
      includeMetadata: true,
      gpsDeviceCompatibility: deviceType,
      customName: `Test Route for ${deviceType}`,
      description: `Compatibility test route for ${deviceType} devices`,
      author: 'GPS Compatibility Tester'
    };

    try {
      const result = await RouteExportService.exportRoute(testWaypoints, options);

      if (result.success) {
        // Parse the GPX content to verify structure
        const gpxValidation = this.validateGPXStructure(result.content, deviceType);

        this.testResults.push({
          device: deviceType,
          success: true,
          validation: gpxValidation,
          fileSize: result.content.length,
          warnings: result.warnings
        });

        console.log(`✅ ${deviceType}: Export successful`);
        console.log(`   File size: ${(result.content.length / 1024).toFixed(2)} KB`);

        if (result.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${result.warnings.join(', ')}`);
        }

        if (gpxValidation.issues.length > 0) {
          console.log(`   🔍 Validation issues: ${gpxValidation.issues.join(', ')}`);
        }

        return true;
      } else {
        console.log(`❌ ${deviceType}: Export failed - ${result.errors.join(', ')}`);
        this.testResults.push({
          device: deviceType,
          success: false,
          errors: result.errors
        });
        return false;
      }
    } catch (error) {
      console.log(`❌ ${deviceType}: Exception - ${error.message}`);
      this.testResults.push({
        device: deviceType,
        success: false,
        errors: [error.message]
      });
      return false;
    }
  }

  // Validate GPX XML structure for device compatibility
  validateGPXStructure(gpxContent, deviceType) {
    const issues = [];
    const features = {
      hasMetadata: false,
      hasWaypoints: false,
      hasTrack: false,
      hasSymbols: false,
      hasExtensions: false
    };

    // Basic XML structure validation
    if (!gpxContent.includes('<?xml version="1.0"')) {
      issues.push('Missing XML declaration');
    }

    if (!gpxContent.includes('<gpx') || !gpxContent.includes('</gpx>')) {
      issues.push('Invalid GPX structure');
    }

    if (!gpxContent.includes('xmlns="http://www.topografix.com/GPX/1/1"')) {
      issues.push('Missing or incorrect GPX namespace');
    }

    // Check for metadata
    if (gpxContent.includes('<metadata>')) {
      features.hasMetadata = true;
    }

    // Check for waypoints
    if (gpxContent.includes('<wpt ')) {
      features.hasWaypoints = true;
    }

    // Check for track data
    if (gpxContent.includes('<trk>')) {
      features.hasTrack = true;
    }

    // Check for symbols (important for device compatibility)
    if (gpxContent.includes('<sym>')) {
      features.hasSymbols = true;
    }

    // Check for extensions
    if (gpxContent.includes('<extensions>')) {
      features.hasExtensions = true;
    }

    // Device-specific validations
    switch (deviceType) {
      case 'garmin':
        if (!features.hasSymbols) {
          issues.push('Garmin devices prefer waypoints with symbol information');
        }
        if (gpxContent.includes('garmin:') && !gpxContent.includes('xmlns:garmin=')) {
          issues.push('Garmin extensions used without proper namespace');
        }
        break;

      case 'tomtom':
        if (gpxContent.length > 1024 * 1024) { // 1MB limit for some TomTom devices
          issues.push('File size may exceed TomTom device limits');
        }
        break;

      case 'smartphone':
        if (!features.hasMetadata) {
          issues.push('Smartphone apps often require metadata for better display');
        }
        break;

      case 'universal':
        if (!features.hasWaypoints && !features.hasTrack) {
          issues.push('Universal format should include either waypoints or track data');
        }
        break;
    }

    return { features, issues };
  }

  // Test all supported GPS device types
  async runFullCompatibilityTest() {
    console.log('🚀 Starting GPS Device Compatibility Test Suite');
    console.log('===============================================');

    const deviceTypes = ['universal', 'garmin', 'tomtom', 'smartphone'];
    let passedTests = 0;

    for (const deviceType of deviceTypes) {
      const success = await this.testDeviceCompatibility(deviceType);
      if (success) passedTests++;
    }

    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`Passed: ${passedTests}/${deviceTypes.length} tests`);

    if (passedTests === deviceTypes.length) {
      console.log('🎉 All compatibility tests passed!');
    } else {
      console.log('⚠️  Some compatibility issues detected');
    }

    // Detailed results
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      console.log(`\n${result.device.toUpperCase()}:`);
      console.log(`  Success: ${result.success ? '✅' : '❌'}`);

      if (result.success) {
        console.log(`  File Size: ${(result.fileSize / 1024).toFixed(2)} KB`);
        console.log(`  Features: ${Object.entries(result.validation.features)
          .filter(([_, hasFeature]) => hasFeature)
          .map(([feature, _]) => feature)
          .join(', ') || 'None detected'}`);

        if (result.validation.issues.length > 0) {
          console.log(`  Issues: ${result.validation.issues.join(', ')}`);
        }

        if (result.warnings && result.warnings.length > 0) {
          console.log(`  Warnings: ${result.warnings.join(', ')}`);
        }
      } else {
        console.log(`  Errors: ${result.errors.join(', ')}`);
      }
    });

    return this.testResults;
  }

  // Test import functionality
  async testImportCompatibility() {
    console.log('\n🔄 Testing Import Compatibility');
    console.log('===============================');

    // Test importing a previously exported GPX file
    try {
      const exportResult = await RouteExportService.exportRoute(testWaypoints, {
        format: 'gpx',
        includeWaypoints: true,
        includeCampsites: false,
        includeRoute: false,
        includeVehicleInfo: false,
        includeCostData: false,
        includePlanningData: false,
        includeMetadata: true,
        gpsDeviceCompatibility: 'universal'
      });

      if (exportResult.success) {
        const importResult = await RouteExportService.importRoute(exportResult.content, 'gpx');

        if (importResult.success) {
          console.log('✅ Import test passed');
          console.log(`   Imported ${importResult.waypoints.length} waypoints`);

          // Verify waypoint data integrity
          if (importResult.waypoints.length === testWaypoints.length) {
            console.log('✅ Waypoint count matches');
          } else {
            console.log('⚠️  Waypoint count mismatch');
          }

          return true;
        } else {
          console.log(`❌ Import failed: ${importResult.errors.join(', ')}`);
          return false;
        }
      } else {
        console.log(`❌ Export for import test failed: ${exportResult.errors.join(', ')}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Import test exception: ${error.message}`);
      return false;
    }
  }
}

// Run the tests
async function runGPSTests() {
  const tester = new GPSCompatibilityTester();

  try {
    await tester.runFullCompatibilityTest();
    await tester.testImportCompatibility();

    console.log('\n✨ GPS Compatibility Testing Complete');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export for use in other testing contexts
export { GPSCompatibilityTester, runGPSTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runGPSTests();
}