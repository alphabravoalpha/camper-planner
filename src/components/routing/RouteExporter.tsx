// Route Exporter Component
// Phase 6.1: Export Functionality - Export routes to various formats for GPS devices

import React, { useState, useCallback, useMemo } from 'react';
import { useRouteStore, useVehicleStore, useTripStore, useUIStore } from '../../store';
import MultiFormatExportService, {
  type ExportOptions,
} from '../../services/MultiFormatExportService';
import { type ExportResult } from '../../services/GPXExportService';
import { type RouteResponse } from '../../services/RoutingService';
import { cn } from '../../utils/cn';

interface RouteExporterProps {
  className?: string;
}

// Export Progress Component
const ExportProgress: React.FC<{
  isExporting: boolean;
  progress: number;
  currentStep: string;
  onCancel?: () => void;
}> = ({ isExporting, progress, currentStep, onCancel }) => {
  if (!isExporting) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Exporting Route</h3>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-neutral-600 mb-2">
            <span>{currentStep}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {onCancel && (
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Export Options Panel
const ExportOptionsPanel: React.FC<{
  options: ExportOptions;
  onChange: (options: ExportOptions) => void;
}> = ({ options, onChange }) => {
  const updateOption = (key: keyof ExportOptions, value: ExportOptions[keyof ExportOptions]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <h4 className="text-sm font-medium text-neutral-900 mb-3">Export Format</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'gpx', label: 'GPX', desc: 'For GPS devices' },
            { id: 'json', label: 'JSON', desc: 'Complete trip data' },
            { id: 'kml', label: 'KML', desc: 'For Google Earth' },
            { id: 'csv', label: 'CSV', desc: 'For spreadsheets' },
          ].map(format => (
            <label
              key={format.id}
              htmlFor={`route-export-format-${format.id}`}
              className="relative"
            >
              <span className="sr-only">{format.label}</span>
              <input
                id={`route-export-format-${format.id}`}
                type="radio"
                name="format"
                value={format.id}
                checked={options.format === format.id}
                onChange={e => updateOption('format', e.target.value)}
                className="sr-only"
              />
              <div
                className={cn(
                  'p-3 border-2 rounded-lg cursor-pointer transition-all',
                  options.format === format.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                <div className="font-medium text-sm" aria-hidden="true">
                  {format.label}
                </div>
                <div className="text-xs text-neutral-500">{format.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Data Inclusion Options */}
      <div>
        <h4 className="text-sm font-medium text-neutral-900 mb-3">Include Data</h4>
        <div className="space-y-2">
          {[
            {
              key: 'includeWaypoints',
              label: 'Route Waypoints',
              desc: 'All route points and navigation',
            },
            {
              key: 'includeTrackPoints',
              label: 'Track Points',
              desc: 'Detailed route path and turns',
            },
            {
              key: 'includeInstructions',
              label: 'Turn Instructions',
              desc: 'Step-by-step navigation instructions',
            },
            {
              key: 'includeElevation',
              label: 'Elevation Data',
              desc: 'Height information for route points',
            },
            {
              key: 'includeMetadata',
              label: 'Trip Metadata',
              desc: 'Creation date, author, descriptions',
            },
          ].map(option => (
            <label
              key={option.key}
              htmlFor={`export-option-${option.key}`}
              className="flex items-start space-x-3"
            >
              <span className="sr-only">{option.label}</span>
              <input
                id={`export-option-${option.key}`}
                type="checkbox"
                checked={options[option.key as keyof ExportOptions] as boolean}
                onChange={e => updateOption(option.key as keyof ExportOptions, e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900" aria-hidden="true">
                  {option.label}
                </div>
                <div className="text-xs text-neutral-500">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Metadata */}
      <div>
        <h4 className="text-sm font-medium text-neutral-900 mb-3">Custom Information</h4>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="export-trip-name"
              className="block text-xs font-medium text-neutral-700 mb-1"
            >
              Trip Name
            </label>
            <input
              id="export-trip-name"
              type="text"
              value={options.description || ''}
              onChange={e => updateOption('description', e.target.value)}
              placeholder="My European Camper Trip"
              className="w-full p-2 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="export-description"
              className="block text-xs font-medium text-neutral-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="export-description"
              value={options.description || ''}
              onChange={e => updateOption('description', e.target.value)}
              placeholder="A wonderful journey through Europe..."
              rows={2}
              className="w-full p-2 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="export-creator"
              className="block text-xs font-medium text-neutral-700 mb-1"
            >
              Creator
            </label>
            <input
              id="export-creator"
              type="text"
              value={options.creator || ''}
              onChange={e => updateOption('creator', e.target.value)}
              placeholder="European Camper Trip Planner"
              className="w-full p-2 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Import Panel Component
const ImportPanel: React.FC<{
  onImportComplete: (result: unknown) => void;
}> = ({ onImportComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { addNotification } = useUIStore();

  const handleFileUpload = useCallback(
    async (_file: File) => {
      setIsImporting(true);

      try {
        // Import functionality would need to be implemented in MultiFormatExportService
        // For now, show a placeholder message
        throw new Error('Import functionality not yet implemented in new export service');
      } catch (error) {
        addNotification({
          type: 'error',
          message: `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setIsImporting(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [addNotification, onImportComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        role="region"
        aria-label="File drop zone for route import"
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300',
          isImporting && 'opacity-50 pointer-events-none'
        )}
      >
        {isImporting ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            <p className="text-sm text-neutral-600">Importing route...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <svg
              className="w-12 h-12 mx-auto text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div>
              <p className="text-lg font-medium text-neutral-900">Import Route</p>
              <p className="text-sm text-neutral-600">
                Drag and drop a GPX, JSON, KML, or CSV file here
              </p>
            </div>
            <div>
              <label className="cursor-pointer">
                <span className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors inline-block">
                  Choose File
                </span>
                <input
                  type="file"
                  accept=".gpx,.json,.kml,.csv"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>
            </div>
            <p className="text-xs text-neutral-500">Supports GPX, JSON, KML, and CSV formats</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main RouteExporter Component
const RouteExporter: React.FC<RouteExporterProps> = ({ className }) => {
  const { waypoints, calculatedRoute } = useRouteStore();
  const { profile: vehicleProfile } = useVehicleStore();
  const { currentTrip } = useTripStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'gpx',
    includeWaypoints: true,
    includeTrackPoints: true,
    includeInstructions: true,
    includeElevation: true,
    includeMetadata: true,
    creator: 'European Camper Trip Planner',
  });

  // Check if export is possible
  const canExport = useMemo(() => {
    return waypoints.length >= 2;
  }, [waypoints.length]);

  // Get export data size estimate
  const estimatedSize = useMemo(() => {
    let size = waypoints.length * 0.5; // Base waypoint size in KB
    if (exportOptions.includeTrackPoints && calculatedRoute) size += 10;
    if (exportOptions.includeInstructions) size += waypoints.length * 0.3;
    if (exportOptions.includeElevation) size += waypoints.length * 0.1;
    if (exportOptions.includeMetadata) size += 1;
    return Math.round(size * 10) / 10;
  }, [waypoints.length, exportOptions, calculatedRoute]);

  // Helper function to calculate distance between waypoints
  const calculateDistance = useCallback(
    (waypoint1: { lat: number; lng: number }, waypoint2: { lat: number; lng: number }): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((waypoint2.lat - waypoint1.lat) * Math.PI) / 180;
      const dLng = ((waypoint2.lng - waypoint1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((waypoint1.lat * Math.PI) / 180) *
          Math.cos((waypoint2.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const calculateTotalDistance = useCallback(
    (waypoints: { lat: number; lng: number }[]): number => {
      if (waypoints.length < 2) return 0;
      let total = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        total += calculateDistance(waypoints[i], waypoints[i + 1]);
      }
      return total;
    },
    [calculateDistance]
  );

  // Simulated export progress steps
  const executeExport = useCallback(async () => {
    if (!canExport) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Step 1: Prepare data
      setCurrentStep('Preparing route data...');
      setExportProgress(10);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Format conversion
      setCurrentStep('Converting to export format...');
      setExportProgress(30);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Add metadata
      setCurrentStep('Adding metadata and compatibility...');
      setExportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Step 4: Generate file
      setCurrentStep('Generating export file...');
      setExportProgress(80);

      // Create a mock RouteResponse from waypoints for export
      const mockRouteResponse: RouteResponse = {
        id: `export_${Date.now()}`,
        status: 'success',
        routes: [
          {
            geometry: {
              coordinates: waypoints.map(wp => [wp.lng, wp.lat]),
              type: 'LineString',
            },
            summary: {
              distance: waypoints.length > 1 ? calculateTotalDistance(waypoints) * 1000 : 0,
              duration: waypoints.length > 1 ? (calculateTotalDistance(waypoints) / 70) * 3600 : 0,
            },
            waypoints: waypoints.map((_, i) => i),
            segments: [
              {
                distance: waypoints.length > 1 ? calculateTotalDistance(waypoints) * 1000 : 0,
                duration:
                  waypoints.length > 1 ? (calculateTotalDistance(waypoints) / 70) * 3600 : 0,
                steps: waypoints.map((wp, index) => ({
                  instruction: index === 0 ? `Start at ${wp.name}` : `Continue to ${wp.name}`,
                  name: wp.name,
                  distance: index > 0 ? calculateDistance(waypoints[index - 1], wp) * 1000 : 0,
                  duration:
                    index > 0 ? (calculateDistance(waypoints[index - 1], wp) / 70) * 3600 : 0,
                  geometry: { coordinates: [wp.lng, wp.lat] },
                  maneuver: { location: [wp.lng, wp.lat] },
                  wayPoints: [0, 1],
                })),
              },
            ],
          },
        ],
        metadata: {
          service: 'openrouteservice',
          profile: vehicleProfile?.type || 'driving-hgv',
          timestamp: Date.now(),
          query: {
            waypoints: waypoints,
            vehicleProfile: vehicleProfile || undefined,
          },
          attribution: 'OpenRouteService',
        },
      };

      const routeName = exportOptions.description || 'Camper Route';
      const result: ExportResult = await MultiFormatExportService.exportRoute(
        mockRouteResponse,
        waypoints,
        exportOptions.format as 'gpx' | 'kml' | 'json' | 'csv',
        routeName,
        exportOptions as ExportOptions
      );

      setCurrentStep('Finalizing export...');
      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 200));

      if (result.success && result.data && result.filename) {
        // Use the download functionality from MultiFormatExportService
        const success = await MultiFormatExportService.downloadRoute(
          mockRouteResponse,
          waypoints,
          exportOptions.format as 'gpx' | 'kml' | 'json' | 'csv',
          routeName,
          exportOptions as ExportOptions
        );

        if (success) {
          addNotification({
            type: 'success',
            message: `Route exported successfully as ${result.filename}`,
          });
        } else {
          throw new Error('Download failed');
        }
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setCurrentStep('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypoints, exportOptions, currentTrip, vehicleProfile, canExport, addNotification]);

  // Handle import completion
  const handleImportComplete = useCallback((result: unknown) => {
    // TODO: Integrate with route store to import waypoints
    // eslint-disable-next-line no-console
    console.log('Import completed:', result);
  }, []);

  if (!waypoints.length) {
    return (
      <div className={cn('bg-white rounded-lg border border-neutral-200 p-6', className)}>
        <div className="text-center text-neutral-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-neutral-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No Route to Export</h3>
          <p>Add waypoints to your route to enable export functionality</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200', className)}>
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8 px-4">
          {[
            { id: 'export', label: 'Export Route', icon: '📤' },
            { id: 'import', label: 'Import Route', icon: '📥' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'export' | 'import')}
              className={cn(
                'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Export Header */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Export Route</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Export your route with {waypoints.length} waypoints to various formats for GPS
                devices and trip planning
              </p>
            </div>

            {/* Export Options */}
            <ExportOptionsPanel options={exportOptions} onChange={setExportOptions} />

            {/* Export Summary */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-neutral-900 mb-2">Export Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">Waypoints:</span>
                  <span className="ml-2 font-medium">{waypoints.length}</span>
                </div>
                <div>
                  <span className="text-neutral-600">Format:</span>
                  <span className="ml-2 font-medium uppercase">{exportOptions.format}</span>
                </div>
                <div>
                  <span className="text-neutral-600">Estimated Size:</span>
                  <span className="ml-2 font-medium">{estimatedSize} KB</span>
                </div>
                <div>
                  <span className="text-neutral-600">Creator:</span>
                  <span className="ml-2 font-medium">
                    {exportOptions.creator || 'European Camper Trip Planner'}
                  </span>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={executeExport}
                disabled={!canExport || isExporting}
                className={cn(
                  'px-6 py-3 rounded-lg font-medium transition-colors',
                  canExport && !isExporting
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                )}
              >
                {isExporting ? 'Exporting...' : 'Export Route'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Import Header */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Import Route</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Import routes from GPX, JSON, KML, or CSV files to restore your trip planning
              </p>
            </div>

            {/* Import Panel */}
            <ImportPanel onImportComplete={handleImportComplete} />
          </div>
        )}
      </div>

      {/* Export Progress Overlay */}
      <ExportProgress
        isExporting={isExporting}
        progress={exportProgress}
        currentStep={currentStep}
        onCancel={() => {
          setIsExporting(false);
          setExportProgress(0);
          setCurrentStep('');
        }}
      />
    </div>
  );
};

export default RouteExporter;
