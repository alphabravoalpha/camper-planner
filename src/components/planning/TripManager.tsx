// Trip Manager Component
// Phase 5.3: Comprehensive trip management system

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
  Save,
  Copy,
  Download,
  Upload,
  Search,
  Calendar,
  MapPin,
  Clock,
  Euro,
  Users,
  Trash2,
  ExternalLink,
  BarChart3,
  X,
  Globe,
  Navigation,
  Mountain,
  Heart,
  Briefcase,
  Car,
} from 'lucide-react';
import { useRouteStore } from '../../store';
import { useVehicleStore } from '../../store';
import { useTripSettingsStore } from '../../store/tripSettingsStore';
import {
  TripStorageService,
  type Trip,
  type TripSummary,
  type TripMetadata,
  type TripComparison,
} from '../../services/TripStorageService';
import MultiFormatExportService, {
  type ExportOptions,
} from '../../services/MultiFormatExportService';
import { type RouteResponse } from '../../services/RoutingService';
// TripTemplatesService temporarily disabled for MVP

interface TripManagerProps {
  className?: string;
  onTripLoad?: (trip: Trip) => void;
  onClose?: () => void;
  isVisible?: boolean;
}

type ViewMode = 'my_trips' | 'recent' | 'comparison' | 'create';

interface SaveTripData {
  name: string;
  description: string;
  category: TripMetadata['category'];
  tags: string[];
  isPublic: boolean;
}

const TripManager: React.FC<TripManagerProps> = ({
  className = '',
  onTripLoad,
  onClose,
  isVisible = true,
}) => {
  const { t } = useTranslation();

  // Store hooks
  const { waypoints, estimatedTime } = useRouteStore();
  const { profile: selectedProfile } = useVehicleStore();
  const { settings: tripSettings } = useTripSettingsStore();
  // Derive fuel settings from trip settings store for cost calculations
  const fuelConsumptionSettings = {
    consumptionType:
      tripSettings.fuelConsumption.unit === 'l_per_100km'
        ? ('l_per_100km' as const)
        : tripSettings.fuelConsumption.unit === 'mpg_imperial'
          ? ('mpg_imperial' as const)
          : ('mpg_us' as const),
    consumption: tripSettings.fuelConsumption.value,
    fuelType: (tripSettings.fuelConsumption.fuelType === 'electric'
      ? 'electricity'
      : tripSettings.fuelConsumption.fuelType) as 'petrol' | 'diesel' | 'lpg' | 'electricity',
    tankCapacity: tripSettings.fuelConsumption.tankCapacity,
  };
  const fuelPriceSettings = {
    priceType: 'manual' as const,
    currency: tripSettings.currency as 'EUR' | 'GBP' | 'USD',
  };

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('my_trips');
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [recentTrips, setRecentTrips] = useState<TripSummary[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [comparison, setComparison] = useState<TripComparison | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save trip modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveData, setSaveData] = useState<SaveTripData>({
    name: '',
    description: '',
    category: 'leisure',
    tags: [],
    isPublic: false,
  });

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingTripId, setExportingTripId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'gpx' | 'kml' | 'json' | 'csv'>('gpx');
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    includeWaypoints: true,
    includeTrackPoints: true,
    includeInstructions: true,
    includeElevation: true,
    includeMetadata: true,
    creator: 'European Camper Trip Planner',
  });

  // Delete confirmation state
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [deletingTripName, setDeletingTripName] = useState('');

  // Load data on component mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadTrips(), loadRecentTrips()]);
      } finally {
        setIsLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter trips
  const filteredTrips = trips.filter(trip => {
    const matchesSearch =
      trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || trip.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const loadTrips = async () => {
    try {
      const summaries = await TripStorageService.getTripSummaries({ excludeTemplates: true });
      setTrips(summaries);
    } catch (_err) {
      setError(t('planning.tripMgr.loadError'));
      // Error already surfaced in UI via setError
    }
  };

  const loadRecentTrips = async () => {
    try {
      const recent = await TripStorageService.getRecentTrips(10);
      setRecentTrips(recent);
    } catch (_err) {
      // Silently fail for recent trips — non-critical
    }
  };

  const handleSaveCurrentTrip = async () => {
    if (waypoints.length < 2) {
      setError(t('planning.tripMgr.minWaypointsError'));
      return;
    }

    setShowSaveModal(true);
  };

  const confirmSaveTrip = async () => {
    if (!saveData.name.trim()) {
      setError(t('planning.tripMgr.nameRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Use actual route data when available
      const countries = estimateCountries(waypoints);
      // Duration in days from actual route time (seconds -> days), or 0 if no route calculated
      const estimatedDuration =
        estimatedTime > 0 ? Math.max(1, Math.ceil(estimatedTime / 86400)) : 0;
      // Use 0 when no real cost data — display will show "Not calculated"
      const estimatedCost = 0;

      const trip: Omit<Trip, 'timestamps'> = {
        metadata: {
          id: tripId,
          name: saveData.name,
          description: saveData.description,
          category: saveData.category,
          tags: saveData.tags,
          duration: estimatedDuration,
          difficulty: 'moderate',
          season: 'year_round',
          countries,
          estimatedCost,
          currency: 'EUR',
          isTemplate: false,
          isPublic: saveData.isPublic,
        },
        data: {
          waypoints,
          vehicleProfile: selectedProfile || undefined,
          routePreferences: {
            avoidTolls: false,
            avoidFerries: false,
            preferScenic: false,
            fuelEfficient: true,
          },
          campsiteSelections: [],
          costCalculations: {
            breakdown: {
              totalCost: 0,
              fuelCost: 0,
              tollCost: 0,
              accommodationCost: 0,
              foodCost: 0,
              ferryCost: 0,
              otherCosts: 0,
              currency: 'EUR',
              segments: [],
              dailyBreakdown: [],
            },
            fuelSettings: fuelConsumptionSettings,
            priceSettings: fuelPriceSettings,
            lastCalculated: new Date(),
          },
          settings: useTripSettingsStore.getState().settings,
        },
      };

      await TripStorageService.saveTrip(trip);
      await loadTrips();
      setShowSaveModal(false);
      setSaveData({
        name: '',
        description: '',
        category: 'leisure',
        tags: [],
        isPublic: false,
      });
    } catch (_err) {
      setError(t('planning.tripMgr.saveError'));
      // Error already surfaced in UI via setError
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTrip = async (tripId: string) => {
    setIsLoading(true);
    try {
      const trip = await TripStorageService.loadTrip(tripId);
      if (trip && onTripLoad) {
        onTripLoad(trip);
        // Restore trip settings if they were saved with the trip
        if (trip.data.settings) {
          useTripSettingsStore.getState().loadSettings(trip.data.settings);
        }
        await loadRecentTrips(); // Update recent trips
      }
    } catch (_err) {
      setError(t('planning.tripMgr.loadTripError'));
      // Error already surfaced in UI via setError
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateTrip = async (tripId: string) => {
    setIsLoading(true);
    try {
      await TripStorageService.duplicateTrip(tripId);
      await loadTrips();
    } catch (_err) {
      setError(t('planning.tripMgr.duplicateError'));
      // Error already surfaced in UI via setError
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    // Find the trip name for the confirmation dialog
    const trip = trips.find(t => t.id === tripId);
    setDeletingTripName(trip?.name || 'this trip');
    setDeletingTripId(tripId);
  };

  const confirmDeleteTrip = useCallback(async () => {
    if (!deletingTripId) return;

    setIsLoading(true);
    setDeletingTripId(null);
    try {
      await TripStorageService.deleteTrip(deletingTripId);
      await loadTrips();
    } catch (_err) {
      setError(t('planning.tripMgr.deleteError'));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletingTripId, t]);

  const handleExportTrip = (tripId: string) => {
    setExportingTripId(tripId);
    setShowExportModal(true);
  };

  const confirmExportTrip = async () => {
    if (!exportingTripId) return;

    try {
      setIsLoading(true);
      const trip = await TripStorageService.loadTrip(exportingTripId);

      if (!trip) {
        throw new Error('Trip not found');
      }

      // Create RouteResponse from trip data
      const routeResponse = createRouteResponseFromTrip(trip);

      // Set up export options with trip name
      const finalExportOptions: ExportOptions = {
        format: exportFormat,
        includeWaypoints: exportOptions.includeWaypoints ?? true,
        includeTrackPoints: exportOptions.includeTrackPoints ?? true,
        includeInstructions: exportOptions.includeInstructions ?? true,
        includeElevation: exportOptions.includeElevation ?? true,
        includeMetadata: exportOptions.includeMetadata ?? true,
        creator: exportOptions.creator || 'European Camper Trip Planner',
        description: `${trip.metadata.name} - ${trip.metadata.description || 'Exported from Trip Manager'}`,
      };

      // Use MultiFormatExportService to download the route
      const success = await MultiFormatExportService.downloadRoute(
        routeResponse,
        trip.data.waypoints,
        exportFormat,
        trip.metadata.name,
        finalExportOptions
      );

      if (success) {
        setShowExportModal(false);
        setExportingTripId(null);
        // Reset form would go here if needed
      } else {
        throw new Error('Export download failed');
      }
    } catch (_err) {
      setError(t('planning.tripMgr.exportError'));
      // Error already surfaced in UI via setError
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportTrip = async () => {
    if (!importData.trim()) {
      setError(t('planning.tripMgr.importEmptyError'));
      return;
    }

    setIsLoading(true);
    try {
      const trip = await TripStorageService.importTrip(importData);
      if (trip) {
        await loadTrips();
        setShowImportModal(false);
        setImportData('');
      } else {
        setError(t('planning.tripMgr.importInvalidError'));
      }
    } catch (_err) {
      setError(t('planning.tripMgr.importError'));
      // Error already surfaced in UI via setError
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareTrips = async () => {
    if (selectedTrips.length < 2) {
      setError(t('planning.tripMgr.minCompareError'));
      return;
    }

    setIsLoading(true);
    try {
      const comparisonResult = await TripStorageService.compareTrips(selectedTrips);
      setComparison(comparisonResult);
      setViewMode('comparison');
    } catch (_err) {
      setError(t('planning.tripMgr.compareError'));
      // Error already surfaced in UI via setError
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate distance between waypoints
  const calculateDistance = (
    waypoint1: { lat: number; lng: number },
    waypoint2: { lat: number; lng: number }
  ): number => {
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
  };

  const calculateTotalDistance = (waypoints: { lat: number; lng: number }[]): number => {
    if (waypoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      total += calculateDistance(waypoints[i], waypoints[i + 1]);
    }
    return total;
  };

  // Helper function to create RouteResponse from trip data
  const createRouteResponseFromTrip = (trip: Trip): RouteResponse => {
    const waypoints = trip.data.waypoints;
    return {
      id: `trip_${trip.metadata.id}`,
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
          waypoints: waypoints.map((_, i) => i), // Waypoint indices in geometry
          segments: [
            {
              distance: waypoints.length > 1 ? calculateTotalDistance(waypoints) * 1000 : 0,
              duration: waypoints.length > 1 ? (calculateTotalDistance(waypoints) / 70) * 3600 : 0,
              steps: waypoints.map((wp, index) => ({
                instruction: index === 0 ? `Start at ${wp.name}` : `Continue to ${wp.name}`,
                name: wp.name,
                distance: index > 0 ? calculateDistance(waypoints[index - 1], wp) * 1000 : 0,
                duration: index > 0 ? (calculateDistance(waypoints[index - 1], wp) / 70) * 3600 : 0,
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
        profile: trip.data.vehicleProfile?.type || 'driving-hgv',
        timestamp: Date.now(),
        query: {
          waypoints: waypoints,
          vehicleProfile: trip.data.vehicleProfile,
        },
        attribution: 'OpenRouteService',
      },
    };
  };

  const estimateCountries = (waypoints: { lat: number; lng: number }[]): string[] => {
    // Simplified country estimation based on coordinates
    const countries = new Set<string>();
    waypoints.forEach(wp => {
      // This is a simplified implementation - in reality you'd use reverse geocoding
      if (wp.lat >= 46 && wp.lat <= 51 && wp.lng >= -5 && wp.lng <= 10) countries.add('France');
      if (wp.lat >= 47 && wp.lat <= 55 && wp.lng >= 5 && wp.lng <= 15) countries.add('Germany');
      if (wp.lat >= 36 && wp.lat <= 47 && wp.lng >= 6 && wp.lng <= 19) countries.add('Italy');
      if (wp.lat >= 36 && wp.lat <= 44 && wp.lng >= -10 && wp.lng <= 5) countries.add('Spain');
    });
    return Array.from(countries);
  };

  const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'adventure':
        return <Mountain className="w-4 h-4" />;
      case 'romantic':
        return <Heart className="w-4 h-4" />;
      case 'business':
        return <Briefcase className="w-4 h-4" />;
      case 'family':
        return <Users className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary-50 to-primary-100">
        <div className="flex items-center gap-3">
          <Navigation className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-display font-semibold text-neutral-800">
            {t('planning.tripMgr.title')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick actions */}
          <button
            onClick={handleSaveCurrentTrip}
            disabled={waypoints.length < 2}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {t('planning.tripMgr.saveCurrent')}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b bg-neutral-50">
        {[
          {
            id: 'my_trips',
            label: t('planning.tripMgr.myTrips'),
            icon: <Save className="w-4 h-4" />,
          },
          {
            id: 'recent',
            label: t('planning.tripMgr.recent'),
            icon: <Clock className="w-4 h-4" />,
          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as ViewMode)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              viewMode === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600 bg-white'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <X className="w-4 h-4" />
            <span className="text-sm flex-1">{error}</span>
            <button
              onClick={() => {
                setError(null);
                loadTrips();
                loadRecentTrips();
              }}
              className="text-xs text-red-700 hover:text-red-900 underline font-medium"
            >
              {t('planning.tripMgr.retryButton')}
            </button>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="p-4 border-b bg-neutral-50">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={t('planning.tripMgr.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">{t('planning.tripMgr.allCategories')}</option>
              <option value="leisure">{t('planning.tripMgr.leisure')}</option>
              <option value="adventure">{t('planning.tripMgr.adventure')}</option>
              <option value="romantic">{t('planning.tripMgr.romantic')}</option>
              <option value="family">{t('planning.tripMgr.family')}</option>
              <option value="business">{t('planning.tripMgr.business')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* My Trips View */}
        {viewMode === 'my_trips' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-medium text-neutral-800">
                {t('planning.tripMgr.myTripsCount', { count: filteredTrips.length })}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-neutral-50 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  {t('planning.tripMgr.importButton')}
                </button>
                {selectedTrips.length >= 2 && (
                  <button
                    onClick={handleCompareTrips}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    <BarChart3 className="w-4 h-4" />
                    {t('planning.tripMgr.compareButton', { count: selectedTrips.length })}
                  </button>
                )}
              </div>
            </div>

            {filteredTrips.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Navigation className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>{t('planning.tripMgr.noTrips')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTrips.map(trip => (
                  <div
                    key={trip.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTrips.includes(trip.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedTrips([...selectedTrips, trip.id]);
                            } else {
                              setSelectedTrips(selectedTrips.filter(id => id !== trip.id));
                            }
                          }}
                          className="rounded"
                        />
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(trip.category)}
                          <h4 className="font-semibold text-neutral-800">{trip.name}</h4>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleLoadTrip(trip.id)}
                          className="p-1 hover:bg-primary-100 rounded text-primary-600"
                          title={t('planning.tripMgr.loadTripTitle')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateTrip(trip.id)}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title={t('planning.tripMgr.duplicateTripTitle')}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportTrip(trip.id)}
                          className="p-1 hover:bg-purple-100 rounded text-purple-600"
                          title={t('planning.tripMgr.exportTripTitleAttr')}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title={t('planning.tripMgr.deleteTripTitleAttr')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {trip.duration > 0
                          ? t('planning.tripMgr.durationDays', { count: trip.duration })
                          : t('planning.tripMgr.notCalculated')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        {trip.estimatedCost > 0
                          ? formatCurrency(trip.estimatedCost)
                          : t('planning.tripMgr.notCalculated')}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {t('planning.tripMgr.stopsCount', { count: trip.waypointCount })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        {t('planning.tripMgr.countriesCount', { count: trip.countries.length })}
                      </div>
                    </div>

                    {trip.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {trip.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {trip.tags.length > 3 && (
                          <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs">
                            {t('planning.tripMgr.moreTags', { count: trip.tags.length - 3 })}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-neutral-500">
                      {t('planning.tripMgr.lastModified', {
                        date: trip.lastModified.toLocaleDateString(),
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent Trips View */}
        {viewMode === 'recent' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-medium text-neutral-800">
                {t('planning.tripMgr.recentTrips', { count: recentTrips.length })}
              </h3>
            </div>

            {recentTrips.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>{t('planning.tripMgr.noRecentTrips')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrips.map(trip => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleLoadTrip(trip.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLoadTrip(trip.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(trip.category)}
                      <div>
                        <h4 className="font-medium text-neutral-800">{trip.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-neutral-600">
                          <span>
                            {trip.duration > 0
                              ? t('planning.tripMgr.durationDays', { count: trip.duration })
                              : t('planning.tripMgr.notAvailable')}
                          </span>
                          <span>
                            {trip.estimatedCost > 0
                              ? formatCurrency(trip.estimatedCost)
                              : t('planning.tripMgr.notAvailable')}
                          </span>
                          <span>
                            {t('planning.tripMgr.stopsCount', { count: trip.waypointCount })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-500">
                      {trip.lastOpened.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trip Comparison View */}
        {viewMode === 'comparison' && comparison && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-medium text-neutral-800">
                {t('planning.tripMgr.comparisonTitle')}
              </h3>
              <button
                onClick={() => setViewMode('my_trips')}
                className="text-primary-600 hover:text-primary-700"
              >
                {t('planning.tripMgr.backToTrips')}
              </button>
            </div>

            <div className="space-y-6">
              {/* Cost Comparison */}
              <div>
                <h4 className="font-medium text-neutral-800 mb-3">
                  {t('planning.tripMgr.costComparison')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparison.trips.map(trip => {
                    const costs = comparison.comparison.costs[trip.metadata.id];
                    const isChecapest =
                      comparison.comparison.analysis.cheapest === trip.metadata.id;

                    return (
                      <div
                        key={trip.metadata.id}
                        className={`p-4 rounded-lg border ${isChecapest ? 'border-green-500 bg-green-50' : 'border-neutral-200'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(trip.metadata.category)}
                          <h5 className="font-medium">{trip.metadata.name}</h5>
                          {isChecapest && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              {t('planning.tripMgr.cheapest')}
                            </span>
                          )}
                        </div>
                        {costs && (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>{t('planning.tripMgr.totalLabel')}</span>
                              <span className="font-medium">{formatCurrency(costs.total)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-600">
                              <span>{t('planning.tripMgr.fuelLabel')}</span>
                              <span>{formatCurrency(costs.fuel)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-600">
                              <span>{t('planning.tripMgr.accommodationLabel')}</span>
                              <span>{formatCurrency(costs.accommodation)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-600">
                              <span>{t('planning.tripMgr.tollsLabel')}</span>
                              <span>{formatCurrency(costs.tolls)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Route Comparison */}
              <div>
                <h4 className="font-medium text-neutral-800 mb-3">
                  {t('planning.tripMgr.routeComparison')}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-neutral-200 rounded-lg">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="border border-neutral-200 px-4 py-2 text-left">
                          {t('planning.tripMgr.tripColumn')}
                        </th>
                        <th className="border border-neutral-200 px-4 py-2 text-left">
                          {t('planning.tripMgr.distanceColumn')}
                        </th>
                        <th className="border border-neutral-200 px-4 py-2 text-left">
                          {t('planning.tripMgr.durationColumn')}
                        </th>
                        <th className="border border-neutral-200 px-4 py-2 text-left">
                          {t('planning.tripMgr.waypointsColumn')}
                        </th>
                        <th className="border border-neutral-200 px-4 py-2 text-left">
                          {t('planning.tripMgr.countriesColumn')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.trips.map(trip => {
                        const route = comparison.comparison.routes[trip.metadata.id];
                        const isShortest =
                          comparison.comparison.analysis.shortest === trip.metadata.id;
                        const isFastest =
                          comparison.comparison.analysis.fastest === trip.metadata.id;

                        return (
                          <tr key={trip.metadata.id} className="hover:bg-neutral-50">
                            <td className="border border-neutral-200 px-4 py-2">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(trip.metadata.category)}
                                {trip.metadata.name}
                              </div>
                            </td>
                            <td className="border border-neutral-200 px-4 py-2">
                              <span className={isShortest ? 'font-semibold text-green-600' : ''}>
                                {route.distance.toFixed(0)}km
                              </span>
                              {isShortest && (
                                <span className="ml-1 text-xs text-green-600">
                                  {t('planning.tripMgr.shortestTag')}
                                </span>
                              )}
                            </td>
                            <td className="border border-neutral-200 px-4 py-2">
                              <span className={isFastest ? 'font-semibold text-primary-600' : ''}>
                                {route.duration.toFixed(1)}h
                              </span>
                              {isFastest && (
                                <span className="ml-1 text-xs text-primary-600">
                                  {t('planning.tripMgr.fastestTag')}
                                </span>
                              )}
                            </td>
                            <td className="border border-neutral-200 px-4 py-2">
                              {route.waypointCount}
                            </td>
                            <td className="border border-neutral-200 px-4 py-2">
                              {route.countries.join(', ')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommendations */}
              {comparison.comparison.analysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-neutral-800 mb-3">
                    {t('planning.tripMgr.recommendations')}
                  </h4>
                  <div className="space-y-3">
                    {comparison.comparison.analysis.recommendations.map((rec, index) => {
                      const trip = comparison.trips.find(t => t.metadata.id === rec.tripId);
                      return (
                        <div
                          key={index}
                          className="p-4 bg-primary-50 rounded-lg border border-primary-200"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {trip && getCategoryIcon(trip.metadata.category)}
                            <span className="font-medium text-primary-800">
                              {trip?.metadata.name}
                            </span>
                          </div>
                          <div className="text-primary-700">
                            <div className="font-medium">{rec.reason}</div>
                            <div className="text-sm">{rec.advantage}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Save Trip Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-display font-semibold">
                {t('planning.tripMgr.saveTripTitle')}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label
                  htmlFor="trip-save-name"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  {t('planning.tripMgr.tripNameLabel')}
                </label>
                <input
                  id="trip-save-name"
                  type="text"
                  value={saveData.name}
                  onChange={e => setSaveData({ ...saveData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={t('planning.tripMgr.tripNamePlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="trip-save-description"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  {t('planning.tripMgr.descriptionLabel')}
                </label>
                <textarea
                  id="trip-save-description"
                  value={saveData.description}
                  onChange={e => setSaveData({ ...saveData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  rows={3}
                  placeholder={t('planning.tripMgr.descriptionPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="trip-save-category"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  {t('planning.tripMgr.categoryLabel')}
                </label>
                <select
                  id="trip-save-category"
                  value={saveData.category}
                  onChange={e =>
                    setSaveData({
                      ...saveData,
                      category: e.target.value as TripMetadata['category'],
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="leisure">{t('planning.tripMgr.leisure')}</option>
                  <option value="adventure">{t('planning.tripMgr.adventure')}</option>
                  <option value="romantic">{t('planning.tripMgr.romantic')}</option>
                  <option value="family">{t('planning.tripMgr.family')}</option>
                  <option value="business">{t('planning.tripMgr.business')}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="trip-save-tags"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  {t('planning.tripMgr.tagsLabel')}
                </label>
                <input
                  id="trip-save-tags"
                  type="text"
                  value={saveData.tags.join(', ')}
                  onChange={e =>
                    setSaveData({
                      ...saveData,
                      tags: e.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder={t('planning.tripMgr.tagsPlaceholder')}
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-neutral-50"
              >
                {t('planning.tripMgr.cancelButton')}
              </button>
              <button
                onClick={confirmSaveTrip}
                disabled={!saveData.name.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {t('planning.tripMgr.saveTripButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Trip Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-display font-semibold">
                {t('planning.tripMgr.importTripTitle')}
              </h3>
            </div>
            <div className="p-4">
              <label
                htmlFor="trip-import-data"
                className="block text-sm font-medium text-neutral-700 mb-2"
              >
                {t('planning.tripMgr.importDataLabel')}
              </label>
              <textarea
                id="trip-import-data"
                value={importData}
                onChange={e => setImportData(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg resize-none font-mono text-sm"
                rows={8}
                placeholder={t('planning.tripMgr.importDataPlaceholder')}
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-neutral-50"
              >
                {t('planning.tripMgr.cancelButton')}
              </button>
              <button
                onClick={handleImportTrip}
                disabled={!importData.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {t('planning.tripMgr.importTripButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Trip Modal */}
      {showExportModal && exportingTripId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-display font-semibold">
                {t('planning.tripMgr.exportTripTitle')}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Format Selection */}
              <div>
                <span className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('planning.tripMgr.exportFormatLabel')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gpx', label: 'GPX', desc: t('planning.tripMgr.gpxDesc') },
                    { id: 'kml', label: 'KML', desc: t('planning.tripMgr.kmlDesc') },
                    { id: 'json', label: 'JSON', desc: t('planning.tripMgr.jsonDesc') },
                    { id: 'csv', label: 'CSV', desc: t('planning.tripMgr.csvDesc') },
                  ].map(format => (
                    <label
                      key={format.id}
                      htmlFor={`export-format-${format.id}`}
                      className="relative"
                    >
                      <span className="sr-only">{format.label}</span>
                      <input
                        id={`export-format-${format.id}`}
                        type="radio"
                        name="exportFormat"
                        value={format.id}
                        checked={exportFormat === format.id}
                        onChange={e =>
                          setExportFormat(e.target.value as 'gpx' | 'kml' | 'json' | 'csv')
                        }
                        className="sr-only"
                      />
                      <div
                        className={`p-2 border-2 rounded-lg cursor-pointer transition-all text-center ${
                          exportFormat === format.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{format.label}</div>
                        <div className="text-xs text-neutral-500">{format.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div>
                <span className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('planning.tripMgr.includeDataLabel')}
                </span>
                <div className="space-y-2">
                  {[
                    { key: 'includeWaypoints', label: t('planning.tripMgr.includeWaypoints') },
                    { key: 'includeTrackPoints', label: t('planning.tripMgr.includeTrackPoints') },
                    {
                      key: 'includeInstructions',
                      label: t('planning.tripMgr.includeInstructions'),
                    },
                    { key: 'includeElevation', label: t('planning.tripMgr.includeElevation') },
                    { key: 'includeMetadata', label: t('planning.tripMgr.includeMetadata') },
                  ].map(option => (
                    <label key={option.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={exportOptions[option.key as keyof typeof exportOptions] as boolean}
                        onChange={e =>
                          setExportOptions(prev => ({
                            ...prev,
                            [option.key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      />
                      <span className="text-sm font-medium text-neutral-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Creator */}
              <div>
                <label
                  htmlFor="trip-export-creator"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  {t('planning.tripMgr.creatorLabel')}
                </label>
                <input
                  id="trip-export-creator"
                  type="text"
                  value={exportOptions.creator || ''}
                  onChange={e => setExportOptions(prev => ({ ...prev, creator: e.target.value }))}
                  placeholder={t('nav.siteName')}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportingTripId(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-neutral-50"
              >
                {t('planning.tripMgr.cancelButton')}
              </button>
              <button
                onClick={confirmExportTrip}
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isLoading
                  ? t('planning.tripMgr.exportingButton')
                  : t('planning.tripMgr.exportTripButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTripId}
        title={t('planning.tripMgr.deleteTripTitle')}
        message={t('planning.tripMgr.deleteConfirm', { name: deletingTripName })}
        confirmLabel={t('planning.tripMgr.deleteButton')}
        cancelLabel={t('planning.tripMgr.cancelButton')}
        confirmVariant="danger"
        onConfirm={confirmDeleteTrip}
        onCancel={() => setDeletingTripId(null)}
      />
    </div>
  );
};

export default TripManager;
