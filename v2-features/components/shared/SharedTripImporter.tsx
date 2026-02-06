// Shared Trip Importer Component
// Phase 6.2: Handle incoming shared trip URLs with validation and import functionality

import React, { useState, useEffect, useCallback } from 'react';
import { useRouteStore, useVehicleStore, useTripStore, useUIStore } from '../../store';
import { TripSharingService, type ValidationResult } from '../../services/TripSharingService';
import { cn } from '../../utils/cn';

interface SharedTripImporterProps {
  className?: string;
  onImportComplete?: () => void;
  onImportCancel?: () => void;
}

// Import Progress Component
const ImportProgress: React.FC<{
  isImporting: boolean;
  progress: number;
  currentStep: string;
}> = ({ isImporting, progress, currentStep }) => {
  if (!isImporting) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
        <div className="flex-1">
          <div className="font-medium text-blue-900">{currentStep}</div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Validation Results Display
const ValidationDisplay: React.FC<{
  validation: ValidationResult;
  onProceed: () => void;
  onCancel: () => void;
}> = ({ validation, onProceed, onCancel }) => {
  if (!validation.tripData) return null;

  const { tripData } = validation;

  return (
    <div className="space-y-6">
      {/* Trip Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Preview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trip Details */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Trip Information</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {tripData.name}</div>
              {tripData.description && (
                <div><strong>Description:</strong> {tripData.description}</div>
              )}
              <div><strong>Waypoints:</strong> {tripData.waypoints.length}</div>
              <div><strong>Created:</strong> {new Date(tripData.metadata.created).toLocaleDateString()}</div>
              {tripData.metadata.author && (
                <div><strong>Author:</strong> {tripData.metadata.author}</div>
              )}
              {tripData.metadata.totalDistance && (
                <div>
                  <strong>Distance:</strong> {Math.round(tripData.metadata.totalDistance / 1000)} km
                </div>
              )}
              {tripData.metadata.estimatedTime && (
                <div>
                  <strong>Driving Time:</strong> {Math.round(tripData.metadata.estimatedTime / 3600)} hours
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          {tripData.vehicle && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Vehicle Profile</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Type:</strong> {tripData.vehicle.type}</div>
                <div><strong>Dimensions:</strong> {tripData.vehicle.length}m × {tripData.vehicle.width}m × {tripData.vehicle.height}m</div>
                <div><strong>Weight:</strong> {tripData.vehicle.weight}t</div>
                {tripData.vehicle.fuelType && (
                  <div><strong>Fuel:</strong> {tripData.vehicle.fuelType}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Waypoints List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-3">Route Waypoints</h4>
        <div className="max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {tripData.waypoints.map((waypoint, index) => (
              <div key={waypoint.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-900">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {waypoint.name || 'Waypoint'}
                  </div>
                  {waypoint.address && (
                    <div className="text-xs text-gray-600 truncate">{waypoint.address}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {waypoint.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {(validation.warnings.length > 0 || validation.errors.length > 0) && (
        <div className="space-y-3">
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ Warnings</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">❌ Errors</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onProceed}
          disabled={!validation.isValid}
          className={cn(
            'px-6 py-2 rounded-lg font-medium transition-colors',
            validation.isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          Import Trip
        </button>
      </div>
    </div>
  );
};

// Main SharedTripImporter Component
const SharedTripImporter: React.FC<SharedTripImporterProps> = ({
  className,
  onImportComplete,
  onImportCancel
}) => {
  const { waypoints, clearRoute, addWaypoint } = useRouteStore();
  const { setProfile } = useVehicleStore();
  const { setCurrentTrip } = useTripStore();
  const { addNotification } = useUIStore();

  const [shareUrl, setShareUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');

    if (sharedData) {
      const fullUrl = window.location.href;
      setShareUrl(fullUrl);
      validateUrl(fullUrl);
    }
  }, []);

  // Validate shared URL
  const validateUrl = useCallback(async (url: string) => {
    if (!url) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    setCurrentStep('Validating share link...');

    try {
      const result = await TripSharingService.validateAndDecodeUrl(url);
      setValidation(result);

      if (result.isValid) {
        addNotification({
          type: 'success',
          message: 'Share link validated successfully!'
        });
      } else {
        addNotification({
          type: 'error',
          message: `Invalid share link: ${result.errors.join(', ')}`
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setValidation({
        isValid: false,
        errors: ['Failed to validate URL'],
        warnings: []
      });
    } finally {
      setIsValidating(false);
      setCurrentStep('');
    }
  }, [addNotification]);

  // Handle URL input change
  const handleUrlChange = useCallback((url: string) => {
    setShareUrl(url);

    // Auto-validate after a short delay
    const timeoutId = setTimeout(() => {
      if (url) {
        validateUrl(url);
      } else {
        setValidation(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [validateUrl]);

  // Check for existing route before import
  const checkExistingRoute = useCallback(() => {
    if (waypoints.length > 0) {
      setShowConfirmation(true);
    } else {
      proceedWithImport();
    }
  }, [waypoints.length]);

  // Import the validated trip
  const proceedWithImport = useCallback(async () => {
    if (!validation?.isValid || !validation.tripData) return;

    setIsImporting(true);
    setImportProgress(0);
    setShowConfirmation(false);

    try {
      const { tripData } = validation;

      // Step 1: Clear existing route if needed
      setCurrentStep('Preparing import...');
      setImportProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));

      if (waypoints.length > 0) {
        clearRoute();
      }

      // Step 2: Import waypoints
      setCurrentStep('Importing waypoints...');
      setImportProgress(40);
      await new Promise(resolve => setTimeout(resolve, 500));

      tripData.waypoints.forEach(waypoint => {
        addWaypoint(waypoint);
      });

      // Step 3: Import vehicle profile
      setCurrentStep('Importing vehicle profile...');
      setImportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 300));

      if (tripData.vehicle) {
        setProfile(tripData.vehicle);
      }

      // Step 4: Set trip data
      setCurrentStep('Setting trip information...');
      setImportProgress(80);
      await new Promise(resolve => setTimeout(resolve, 300));

      const tripToSave = {
        id: tripData.id,
        name: tripData.name,
        description: tripData.description,
        waypoints: tripData.waypoints,
        vehicle: tripData.vehicle,
        metadata: tripData.metadata,
        createdAt: tripData.metadata.created,
        updatedAt: new Date().toISOString()
      };

      setCurrentTrip(tripToSave);

      // Step 5: Complete
      setCurrentStep('Import complete!');
      setImportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      addNotification({
        type: 'success',
        message: `Trip "${tripData.name}" imported successfully with ${tripData.waypoints.length} waypoints!`
      });

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('data');
      window.history.replaceState({}, '', url.toString());

      onImportComplete?.();
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setCurrentStep('');
    }
  }, [validation, waypoints.length, clearRoute, addWaypoint, setProfile, setCurrentTrip, addNotification, onImportComplete]);

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Import Shared Trip</h3>
        <p className="text-sm text-gray-600 mt-1">
          Import a trip from a shared link to load all waypoints and trip information
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shared Trip URL
          </label>
          <div className="flex space-x-2">
            <input
              type="url"
              value={shareUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste shared trip URL here..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => validateUrl(shareUrl)}
              disabled={!shareUrl || isValidating}
              className={cn(
                'px-4 py-3 rounded-lg font-medium transition-colors',
                shareUrl && !isValidating
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              {isValidating ? '⏳' : '🔍'} Validate
            </button>
          </div>
        </div>

        {/* Import Progress */}
        <ImportProgress
          isImporting={isImporting || isValidating}
          progress={isValidating ? 50 : importProgress}
          currentStep={currentStep || (isValidating ? 'Validating trip data...' : '')}
        />

        {/* Validation Results */}
        {validation && !isValidating && !isImporting && (
          <ValidationDisplay
            validation={validation}
            onProceed={checkExistingRoute}
            onCancel={() => {
              setValidation(null);
              setShareUrl('');
              onImportCancel?.();
            }}
          />
        )}

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Replace Existing Route?</h4>
            <p className="text-sm text-yellow-800 mb-4">
              You already have {waypoints.length} waypoints in your current route.
              Importing this trip will replace your current route.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-yellow-300 rounded-lg text-yellow-800 hover:bg-yellow-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithImport}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Replace Route
              </button>
            </div>
          </div>
        )}

        {/* Help Text */}
        {!validation && !isValidating && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">How to Import</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Paste a shared trip URL into the field above</li>
              <li>• The system will validate the trip data automatically</li>
              <li>• Review the trip details before importing</li>
              <li>• All waypoints and settings will be imported</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedTripImporter;