// Route Exporter Component
// Phase 6.1: Export Functionality - Export routes to various formats for GPS devices

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (!isExporting) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          {t('route.export.exportingTitle')}
        </h3>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-neutral-600 mb-2">
            <span>{currentStep}</span>
            <span>{t('route.export.progress', { progress: Math.round(progress) })}</span>
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
              {t('route.export.cancel')}
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
  const { t } = useTranslation();
  const updateOption = (key: keyof ExportOptions, value: ExportOptions[keyof ExportOptions]) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <h4 className="text-sm font-medium text-neutral-900 mb-3">
          {t('route.export.formatLabel')}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'gpx', label: 'GPX', desc: t('route.export.gpxDesc') },
            { id: 'json', label: 'JSON', desc: t('route.export.jsonDesc') },
            { id: 'kml', label: 'KML', desc: t('route.export.kmlDesc') },
            { id: 'csv', label: 'CSV', desc: t('route.export.csvDesc') },
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
        <h4 className="text-sm font-medium text-neutral-900 mb-3">
          {t('route.export.includeDataLabel')}
        </h4>
        <div className="space-y-2">
          {[
            {
              key: 'includeWaypoints',
              label: t('route.export.waypoints'),
              desc: t('route.export.waypointsDesc'),
            },
            {
              key: 'includeTrackPoints',
              label: t('route.export.trackPoints'),
              desc: t('route.export.trackPointsDesc'),
            },
            {
              key: 'includeInstructions',
              label: t('route.export.instructions'),
              desc: t('route.export.instructionsDesc'),
            },
            {
              key: 'includeElevation',
              label: t('route.export.elevation'),
              desc: t('route.export.elevationDesc'),
            },
            {
              key: 'includeMetadata',
              label: t('route.export.metadata'),
              desc: t('route.export.metadataDesc'),
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
        <h4 className="text-sm font-medium text-neutral-900 mb-3">
          {t('route.export.customInfoLabel')}
        </h4>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="export-trip-name"
              className="block text-xs font-medium text-neutral-700 mb-1"
            >
              {t('route.export.tripNameLabel')}
            </label>
            <input
              id="export-trip-name"
              type="text"
              value={options.description || ''}
              onChange={e => updateOption('description', e.target.value)}
              placeholder={t('route.export.tripNamePlaceholder')}
              className="w-full p-2 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="export-description"
              className="block text-xs font-medium text-neutral-700 mb-1"
            >
              {t('route.export.descriptionLabel')}
            </label>
            <textarea
              id="export-description"
              value={options.description || ''}
              onChange={e => updateOption('description', e.target.value)}
              placeholder={t('route.export.descriptionPlaceholder')}
              rows={2}
              className="w-full p-2 text-sm border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="export-creator"
              className="block text-xs font-medium text-neutral-700 mb-1"
            >
              {t('route.export.creatorLabel')}
            </label>
            <input
              id="export-creator"
              type="text"
              value={options.creator || ''}
              onChange={e => updateOption('creator', e.target.value)}
              placeholder={t('route.export.creatorPlaceholder')}
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
}> = ({ onImportComplete: _onImportComplete }) => {
  const { t } = useTranslation();
  return (
    <div>
      <div
        role="region"
        aria-label={t('route.export.importAriaLabel')}
        className="border-2 border-dashed rounded-lg p-8 text-center border-neutral-200 bg-neutral-50"
      >
        <div className="space-y-3">
          <svg
            className="w-12 h-12 mx-auto text-neutral-300"
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
            <p className="text-lg font-medium text-neutral-400">{t('route.export.importTitle')}</p>
            <span className="inline-block mt-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              {t('route.export.comingSoon')}
            </span>
            <p className="text-sm text-neutral-400 mt-2">{t('route.export.comingSoonText')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main RouteExporter Component
const RouteExporter: React.FC<RouteExporterProps> = ({ className }) => {
  const { t } = useTranslation();
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
      setCurrentStep(t('route.export.stepPreparing'));
      setExportProgress(10);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 2: Format conversion
      setCurrentStep(t('route.export.stepConverting'));
      setExportProgress(30);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Add metadata
      setCurrentStep(t('route.export.stepMetadata'));
      setExportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Step 4: Generate file
      setCurrentStep(t('route.export.stepGenerating'));
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

      setCurrentStep(t('route.export.stepFinalizing'));
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
            message: t('route.export.successMessage', { filename: result.filename }),
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
        message: t('route.export.errorMessage', {
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
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
          <h3 className="text-lg font-medium text-neutral-900 mb-1">
            {t('route.export.noRouteTitle')}
          </h3>
          <p>{t('route.export.noRouteText')}</p>
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
            { id: 'export', label: t('route.export.exportTab'), icon: '📤' },
            { id: 'import', label: t('route.export.importTab'), icon: '📥' },
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
              <h3 className="text-lg font-semibold text-neutral-900">{t('route.export.title')}</h3>
              <p className="text-sm text-neutral-600 mt-1">
                {t('route.export.exportDescription', { count: waypoints.length })}
              </p>
            </div>

            {/* Export Options */}
            <ExportOptionsPanel options={exportOptions} onChange={setExportOptions} />

            {/* Export Summary */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-neutral-900 mb-2">
                {t('route.export.summaryLabel')}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">{t('route.export.waypointsLabel')}</span>
                  <span className="ml-2 font-medium">{waypoints.length}</span>
                </div>
                <div>
                  <span className="text-neutral-600">{t('route.export.formatSummaryLabel')}</span>
                  <span className="ml-2 font-medium uppercase">{exportOptions.format}</span>
                </div>
                <div>
                  <span className="text-neutral-600">{t('route.export.estimatedSizeLabel')}</span>
                  <span className="ml-2 font-medium">{estimatedSize} KB</span>
                </div>
                <div>
                  <span className="text-neutral-600">{t('route.export.creatorSummaryLabel')}</span>
                  <span className="ml-2 font-medium">
                    {exportOptions.creator || t('route.export.creatorPlaceholder')}
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
                {isExporting ? t('route.export.exportingButton') : t('route.export.exportButton')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Import Header */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                {t('route.export.importTitle')}
              </h3>
              <p className="text-sm text-neutral-600 mt-1">{t('route.export.comingSoonText')}</p>
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
