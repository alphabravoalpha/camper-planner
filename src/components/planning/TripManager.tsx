// Trip Manager Component
// Phase 5.3: Comprehensive trip management system

import React, { useState, useEffect } from 'react';
import {
  Save, Copy, Download, Upload, Search, Star, Calendar, MapPin,
  Clock, Euro, Users, Trash2, ExternalLink, BarChart3, X,
  Globe, Navigation, Mountain, Heart, Briefcase, Car
} from 'lucide-react';
import { useRouteStore } from '../../store';
import { useVehicleStore } from '../../store';
import { useCostStore } from '../../store/costStore';
import { TripStorageService } from '../../services/TripStorageService';
import type {
  Trip,
  TripSummary,
  TripMetadata,
  TripComparison
} from '../../services/TripStorageService';
import {
  TripTemplatesService,
  TripTemplate
} from '../../services/TripTemplatesService';

interface TripManagerProps {
  className?: string;
  onTripLoad?: (trip: Trip) => void;
  onClose?: () => void;
  isVisible?: boolean;
}

type ViewMode = 'my_trips' | 'templates' | 'recent' | 'comparison' | 'create';

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
  isVisible = true
}) => {
  // Store hooks
  const { waypoints } = useRouteStore();
  const { profile: selectedProfile } = useVehicleStore();
  const { fuelConsumptionSettings, fuelPriceSettings } = useCostStore();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('my_trips');
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [recentTrips, setRecentTrips] = useState<TripSummary[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [comparison, setComparison] = useState<TripComparison | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save trip modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveData, setSaveData] = useState<SaveTripData>({
    name: '',
    description: '',
    category: 'leisure',
    tags: [],
    isPublic: false
  });

  // Import/Export state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadTrips();
    loadTemplates();
    loadRecentTrips();
  }, []);

  // Filter trips and templates
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || trip.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.metadata.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || template.metadata.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || template.metadata.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const loadTrips = async () => {
    try {
      const summaries = await TripStorageService.getTripSummaries({ excludeTemplates: true });
      setTrips(summaries);
    } catch (err) {
      setError('Failed to load trips');
      console.error('Load trips error:', err);
    }
  };

  const loadTemplates = async () => {
    try {
      const allTemplates = TripTemplatesService.getTemplates();
      setTemplates(allTemplates);
    } catch (err) {
      setError('Failed to load templates');
      console.error('Load templates error:', err);
    }
  };

  const loadRecentTrips = async () => {
    try {
      const recent = await TripStorageService.getRecentTrips(10);
      setRecentTrips(recent);
    } catch (err) {
      console.error('Load recent trips error:', err);
    }
  };

  const handleSaveCurrentTrip = async () => {
    if (waypoints.length < 2) {
      setError('Add at least 2 waypoints to save a trip');
      return;
    }

    setShowSaveModal(true);
  };

  const confirmSaveTrip = async () => {
    if (!saveData.name.trim()) {
      setError('Trip name is required');
      return;
    }

    setIsLoading(true);
    try {
      const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Estimate trip details
      const countries = estimateCountries(waypoints);
      const estimatedDuration = Math.ceil(waypoints.length / 2); // Rough estimate
      const estimatedCost = 100 * waypoints.length; // Rough estimate

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
          isPublic: saveData.isPublic
        },
        data: {
          waypoints,
          vehicleProfile: selectedProfile || undefined,
          routePreferences: {
            avoidTolls: false,
            avoidFerries: false,
            preferScenic: false,
            fuelEfficient: true
          },
          campsiteSelections: [],
          costCalculations: {
            breakdown: {
              totalCost: estimatedCost,
              fuelCost: estimatedCost * 0.6,
              tollCost: 0,
              accommodationCost: estimatedCost * 0.4,
              otherCosts: 0,
              currency: 'EUR',
              segments: [],
              dailyBreakdown: []
            },
            fuelSettings: fuelConsumptionSettings,
            priceSettings: fuelPriceSettings,
            lastCalculated: new Date()
          }
        }
      };

      await TripStorageService.saveTrip(trip);
      await loadTrips();
      setShowSaveModal(false);
      setSaveData({
        name: '',
        description: '',
        category: 'leisure',
        tags: [],
        isPublic: false
      });
    } catch (err) {
      setError('Failed to save trip');
      console.error('Save trip error:', err);
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
        await loadRecentTrips(); // Update recent trips
      }
    } catch (err) {
      setError('Failed to load trip');
      console.error('Load trip error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateTrip = async (tripId: string) => {
    setIsLoading(true);
    try {
      await TripStorageService.duplicateTrip(tripId);
      await loadTrips();
    } catch (err) {
      setError('Failed to duplicate trip');
      console.error('Duplicate trip error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    setIsLoading(true);
    try {
      await TripStorageService.deleteTrip(tripId);
      await loadTrips();
    } catch (err) {
      setError('Failed to delete trip');
      console.error('Delete trip error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTrip = async (tripId: string) => {
    try {
      const exportData = await TripStorageService.exportTrip(tripId);
      if (exportData) {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trip-${tripId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to export trip');
      console.error('Export trip error:', err);
    }
  };

  const handleImportTrip = async () => {
    if (!importData.trim()) {
      setError('Please paste trip data to import');
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
        setError('Invalid trip data format');
      }
    } catch (err) {
      setError('Failed to import trip');
      console.error('Import trip error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = async (template: TripTemplate) => {
    setIsLoading(true);
    try {
      const trip = TripTemplatesService.templateToTrip(template);
      const savedTrip = await TripStorageService.saveTrip(trip);
      if (onTripLoad) {
        onTripLoad(savedTrip);
      }
      await loadTrips();
    } catch (err) {
      setError('Failed to create trip from template');
      console.error('Template to trip error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareTrips = async () => {
    if (selectedTrips.length < 2) {
      setError('Select at least 2 trips to compare');
      return;
    }

    setIsLoading(true);
    try {
      const comparisonResult = await TripStorageService.compareTrips(selectedTrips);
      setComparison(comparisonResult);
      setViewMode('comparison');
    } catch (err) {
      setError('Failed to compare trips');
      console.error('Compare trips error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const estimateCountries = (waypoints: any[]): string[] => {
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
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'adventure': return <Mountain className="w-4 h-4" />;
      case 'romantic': return <Heart className="w-4 h-4" />;
      case 'business': return <Briefcase className="w-4 h-4" />;
      case 'family': return <Users className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'challenging': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <Navigation className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Trip Manager</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick actions */}
          <button
            onClick={handleSaveCurrentTrip}
            disabled={waypoints.length < 2}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Current
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b bg-gray-50">
        {[
          { id: 'my_trips', label: 'My Trips', icon: <Save className="w-4 h-4" /> },
          { id: 'templates', label: 'Templates', icon: <Star className="w-4 h-4" /> },
          { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as ViewMode)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              viewMode === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700'
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
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1 hover:bg-red-100 rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search trips, tags, or countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              <option value="leisure">Leisure</option>
              <option value="adventure">Adventure</option>
              <option value="romantic">Romantic</option>
              <option value="family">Family</option>
              <option value="business">Business</option>
            </select>

            {viewMode === 'templates' && (
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="challenging">Challenging</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* My Trips View */}
        {viewMode === 'my_trips' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                My Trips ({filteredTrips.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                {selectedTrips.length >= 2 && (
                  <button
                    onClick={handleCompareTrips}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Compare ({selectedTrips.length})
                  </button>
                )}
              </div>
            </div>

            {filteredTrips.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Navigation className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No trips found. Start by saving your current route or using a template.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTrips.map(trip => (
                  <div key={trip.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTrips.includes(trip.id)}
                          onChange={(e) => {
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
                          <h4 className="font-semibold text-gray-800">{trip.name}</h4>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleLoadTrip(trip.id)}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Load trip"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateTrip(trip.id)}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="Duplicate trip"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportTrip(trip.id)}
                          className="p-1 hover:bg-purple-100 rounded text-purple-600"
                          title="Export trip"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                          title="Delete trip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {trip.duration} days
                      </div>
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        {formatCurrency(trip.estimatedCost)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {trip.waypointCount} stops
                      </div>
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        {trip.countries.length} countries
                      </div>
                    </div>

                    {trip.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {trip.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {trip.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{trip.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Last modified: {trip.lastModified.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Templates View */}
        {viewMode === 'templates' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Trip Templates ({filteredTemplates.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <div key={template.metadata.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(template.metadata.category)}
                      <h4 className="font-semibold text-gray-800">{template.metadata.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(template.metadata.difficulty)}`}>
                        {template.metadata.difficulty}
                      </span>
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{template.metadata.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {template.metadata.duration} days
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro className="w-4 h-4" />
                      {formatCurrency(template.metadata.estimatedCost)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {template.data.waypoints.length} stops
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {template.templateInfo.popularity}% popularity
                    </div>
                  </div>

                  <div className="text-sm mb-3">
                    <strong>Countries: </strong>
                    {template.metadata.countries.join(', ')}
                  </div>

                  <div className="text-sm mb-3">
                    <strong>Best months: </strong>
                    {template.templateInfo.recommendedMonths.map((month: number) =>
                      new Date(2024, month - 1, 1).toLocaleDateString('en', { month: 'short' })
                    ).join(', ')}
                  </div>

                  {template.templateInfo.highlights.length > 0 && (
                    <div className="text-sm">
                      <strong>Highlights:</strong>
                      <ul className="mt-1 space-y-1">
                        {template.templateInfo.highlights.slice(0, 2).map((highlight: string, index: number) => (
                          <li key={index} className="text-gray-600">• {highlight}</li>
                        ))}
                        {template.templateInfo.highlights.length > 2 && (
                          <li className="text-gray-500">• +{template.templateInfo.highlights.length - 2} more highlights</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Trips View */}
        {viewMode === 'recent' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Recent Trips ({recentTrips.length})
              </h3>
            </div>

            {recentTrips.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent trips. Start planning your next adventure!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrips.map(trip => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleLoadTrip(trip.id)}
                  >
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(trip.category)}
                      <div>
                        <h4 className="font-medium text-gray-800">{trip.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{trip.duration} days</span>
                          <span>{formatCurrency(trip.estimatedCost)}</span>
                          <span>{trip.waypointCount} stops</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
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
              <h3 className="text-lg font-medium text-gray-800">
                Trip Comparison
              </h3>
              <button
                onClick={() => setViewMode('my_trips')}
                className="text-blue-600 hover:text-blue-700"
              >
                Back to My Trips
              </button>
            </div>

            <div className="space-y-6">
              {/* Cost Comparison */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Cost Comparison</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparison.trips.map(trip => {
                    const costs = comparison.comparison.costs[trip.metadata.id];
                    const isChecapest = comparison.comparison.analysis.cheapest === trip.metadata.id;

                    return (
                      <div
                        key={trip.metadata.id}
                        className={`p-4 rounded-lg border ${isChecapest ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(trip.metadata.category)}
                          <h5 className="font-medium">{trip.metadata.name}</h5>
                          {isChecapest && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              Cheapest
                            </span>
                          )}
                        </div>
                        {costs && (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Total:</span>
                              <span className="font-medium">{formatCurrency(costs.total)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Fuel:</span>
                              <span>{formatCurrency(costs.fuel)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Accommodation:</span>
                              <span>{formatCurrency(costs.accommodation)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Tolls:</span>
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
                <h4 className="font-medium text-gray-800 mb-3">Route Comparison</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Trip</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Distance</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Duration</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Waypoints</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Countries</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.trips.map(trip => {
                        const route = comparison.comparison.routes[trip.metadata.id];
                        const isShortest = comparison.comparison.analysis.shortest === trip.metadata.id;
                        const isFastest = comparison.comparison.analysis.fastest === trip.metadata.id;

                        return (
                          <tr key={trip.metadata.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(trip.metadata.category)}
                                {trip.metadata.name}
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <span className={isShortest ? 'font-semibold text-green-600' : ''}>
                                {route.distance.toFixed(0)}km
                              </span>
                              {isShortest && <span className="ml-1 text-xs text-green-600">(shortest)</span>}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <span className={isFastest ? 'font-semibold text-blue-600' : ''}>
                                {route.duration.toFixed(1)}h
                              </span>
                              {isFastest && <span className="ml-1 text-xs text-blue-600">(fastest)</span>}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">{route.waypointCount}</td>
                            <td className="border border-gray-200 px-4 py-2">
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
                  <h4 className="font-medium text-gray-800 mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {comparison.comparison.analysis.recommendations.map((rec, index) => {
                      const trip = comparison.trips.find(t => t.metadata.id === rec.tripId);
                      return (
                        <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            {trip && getCategoryIcon(trip.metadata.category)}
                            <span className="font-medium text-blue-800">
                              {trip?.metadata.name}
                            </span>
                          </div>
                          <div className="text-blue-700">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Save Trip Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Save Current Trip</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Name *
                </label>
                <input
                  type="text"
                  value={saveData.name}
                  onChange={(e) => setSaveData({ ...saveData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="My European Adventure"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={saveData.description}
                  onChange={(e) => setSaveData({ ...saveData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  rows={3}
                  placeholder="Describe your trip..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={saveData.category}
                  onChange={(e) => setSaveData({ ...saveData, category: e.target.value as TripMetadata['category'] })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="leisure">Leisure</option>
                  <option value="adventure">Adventure</option>
                  <option value="romantic">Romantic</option>
                  <option value="family">Family</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={saveData.tags.join(', ')}
                  onChange={(e) => setSaveData({
                    ...saveData,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="scenic, historic, wine-tasting"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={saveData.isPublic}
                  onChange={(e) => setSaveData({ ...saveData, isPublic: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  Make trip public (for future sharing features)
                </label>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSaveTrip}
                disabled={!saveData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Save Trip
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
              <h3 className="text-lg font-semibold">Import Trip</h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste trip data (JSON format):
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg resize-none font-mono text-sm"
                rows={8}
                placeholder="Paste the exported trip JSON data here..."
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImportTrip}
                disabled={!importData.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Import Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManager;