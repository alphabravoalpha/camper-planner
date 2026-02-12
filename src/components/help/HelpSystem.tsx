// In-App Help System
// Phase 6.4: Comprehensive user documentation and support system

import React, { useState, useCallback, useMemo } from 'react';
import { Rocket, Map, Truck, Share2, Wrench, Lightbulb, BookOpen, Tag, Library, Search, ThumbsUp, ThumbsDown, AlertTriangle, Info, Tent, Save, Target, MapPin } from 'lucide-react';
import { cn } from '../../utils/cn';
import { aria, useAnnounce } from '../../utils/accessibility';

interface HelpArticle {
  id: string;
  title: string;
  content: React.ReactNode;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // in minutes
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

interface HelpSystemProps {
  className?: string;
  defaultCategory?: string;
  onClose?: () => void;
}

// Help content data
const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of trip planning',
    icon: Rocket
  },
  {
    id: 'route-planning',
    name: 'Route Planning',
    description: 'Plan and optimize your routes',
    icon: Map
  },
  {
    id: 'vehicle-setup',
    name: 'Vehicle Setup',
    description: 'Configure your camper specifications',
    icon: Truck
  },
  {
    id: 'sharing-export',
    name: 'Sharing & Export',
    description: 'Share trips and export to GPS devices',
    icon: Share2
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: Wrench
  },
  {
    id: 'tips-tricks',
    name: 'Tips & Tricks',
    description: 'Advanced features and pro tips',
    icon: Lightbulb
  }
];

const helpArticles: HelpArticle[] = [
  // Getting Started
  {
    id: 'welcome',
    title: 'Welcome to European Camper Trip Planner',
    category: 'getting-started',
    tags: ['basics', 'introduction'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    content: (
      <div className="space-y-4">
        <p>Welcome to the European Camper Trip Planner! This tool helps you plan amazing camper van adventures across Europe.</p>

        <h4 className="font-semibold text-neutral-900">What you can do:</h4>
        <ul className="list-disc list-inside space-y-1 text-neutral-700">
          <li>Plan multi-stop routes with interactive maps</li>
          <li>Set vehicle profiles for accurate routing</li>
          <li>Find campsites and points of interest</li>
          <li>Calculate trip costs and fuel expenses</li>
          <li>Export routes to GPS devices</li>
          <li>Share trips with friends and family</li>
        </ul>

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h5 className="font-medium text-primary-900 mb-2">Quick Start</h5>
          <ol className="list-decimal list-inside space-y-1 text-primary-800 text-sm">
            <li>Click anywhere on the map to add your first waypoint</li>
            <li>Add more waypoints to create your route</li>
            <li>Set up your vehicle profile for accurate routing</li>
            <li>Export or share your completed trip</li>
          </ol>
        </div>
      </div>
    )
  },
  {
    id: 'first-route',
    title: 'Creating Your First Route',
    category: 'getting-started',
    tags: ['route', 'waypoints', 'tutorial'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    content: (
      <div className="space-y-4">
        <p>Creating your first route is easy! Follow these steps to plan your European adventure.</p>

        <div className="space-y-4">
          <div className="border-l-4 border-primary-500 pl-4">
            <h4 className="font-semibold text-neutral-900">Step 1: Add Your Starting Point</h4>
            <p className="text-neutral-700">Click anywhere on the map or use the search bar to add your first waypoint. This will be marked as your starting location.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold text-neutral-900">Step 2: Add Destinations</h4>
            <p className="text-neutral-700">Continue clicking on the map to add more waypoints. Each new point becomes part of your route. You can add as many stops as you want!</p>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-semibold text-neutral-900">Step 3: Reorder Waypoints</h4>
            <p className="text-neutral-700">Drag waypoints in the sidebar to reorder your route. The app will automatically recalculate the optimal path.</p>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold text-neutral-900">Step 4: Optimize Your Route</h4>
            <p className="text-neutral-700">Use the route optimizer to find the most efficient order for your waypoints, saving time and fuel.</p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-medium text-green-900 mb-2 flex items-center gap-1"><Lightbulb className="w-4 h-4" /> Pro Tip</h5>
          <p className="text-green-800 text-sm">Right-click on any waypoint for additional options like editing details, adding notes, or removing the waypoint.</p>
        </div>
      </div>
    )
  },

  // Route Planning
  {
    id: 'advanced-routing',
    title: 'Advanced Routing Features',
    category: 'route-planning',
    tags: ['optimization', 'advanced', 'efficiency'],
    difficulty: 'intermediate',
    estimatedReadTime: 7,
    content: (
      <div className="space-y-4">
        <p>Take your route planning to the next level with these advanced features.</p>

        <h4 className="font-semibold text-neutral-900">Route Optimization</h4>
        <p className="text-neutral-700">The route optimizer uses advanced algorithms to find the most efficient order for your waypoints.</p>

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h5 className="font-medium text-primary-900 mb-2">Optimization Options</h5>
          <ul className="list-disc list-inside space-y-1 text-primary-800 text-sm">
            <li><strong>Shortest Distance:</strong> Minimizes total kilometers</li>
            <li><strong>Fastest Time:</strong> Minimizes total travel time</li>
            <li><strong>Balanced:</strong> Optimizes for both distance and time</li>
            <li><strong>Scenic Route:</strong> Prioritizes beautiful countryside roads</li>
          </ul>
        </div>

        <h4 className="font-semibold text-neutral-900">Route Alternatives</h4>
        <p className="text-neutral-700">Compare different route options to choose the best one for your needs.</p>

        <h4 className="font-semibold text-neutral-900">Elevation Profile</h4>
        <p className="text-neutral-700">View the elevation changes along your route to prepare for mountain passes and steep climbs.</p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Important for Campers</h5>
          <p className="text-yellow-800 text-sm">Always check vehicle restrictions and road conditions, especially in mountainous areas. Some roads may not be suitable for large motorhomes.</p>
        </div>
      </div>
    )
  },

  // Vehicle Setup
  {
    id: 'vehicle-profiles',
    title: 'Setting Up Vehicle Profiles',
    category: 'vehicle-setup',
    tags: ['vehicle', 'restrictions', 'setup'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    content: (
      <div className="space-y-4">
        <p>Setting up your vehicle profile ensures you get routes suitable for your camper van or motorhome.</p>

        <h4 className="font-semibold text-neutral-900">Vehicle Information Needed</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-50 rounded-lg p-4">
            <h5 className="font-medium text-neutral-900 mb-2">Dimensions</h5>
            <ul className="text-sm text-neutral-700 space-y-1">
              <li>Length (meters)</li>
              <li>Width (meters)</li>
              <li>Height (meters)</li>
              <li>Weight (tonnes)</li>
            </ul>
          </div>
          <div className="bg-neutral-50 rounded-lg p-4">
            <h5 className="font-medium text-neutral-900 mb-2">Specifications</h5>
            <ul className="text-sm text-neutral-700 space-y-1">
              <li>Fuel type (Diesel/Petrol)</li>
              <li>Fuel consumption</li>
              <li>Number of axles</li>
              <li>Vehicle class</li>
            </ul>
          </div>
        </div>

        <h4 className="font-semibold text-neutral-900">Why Vehicle Profiles Matter</h4>
        <ul className="list-disc list-inside space-y-1 text-neutral-700">
          <li>Avoid roads with height, weight, or width restrictions</li>
          <li>Get accurate fuel cost calculations</li>
          <li>Receive warnings about unsuitable routes</li>
          <li>Find camper-friendly parking and facilities</li>
        </ul>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-medium text-green-900 mb-2 flex items-center gap-1"><Lightbulb className="w-4 h-4" /> Pro Tip</h5>
          <p className="text-green-800 text-sm">You can save multiple vehicle profiles if you have different campers or plan to rent different vehicles for different trips.</p>
        </div>
      </div>
    )
  },

  // Sharing & Export
  {
    id: 'export-gps',
    title: 'Exporting Routes to GPS Devices',
    category: 'sharing-export',
    tags: ['export', 'gps', 'garmin', 'tomtom'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
    content: (
      <div className="space-y-4">
        <p>Export your planned routes to GPS devices and navigation apps for offline use during your trip.</p>

        <h4 className="font-semibold text-neutral-900">Supported Formats</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <h5 className="font-medium text-primary-900 mb-2">GPX Files</h5>
            <p className="text-sm text-primary-800">Compatible with most GPS devices including Garmin, TomTom, and smartphone apps.</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h5 className="font-medium text-green-900 mb-2">KML Files</h5>
            <p className="text-sm text-green-800">Perfect for Google Earth and Google Maps. Great for sharing with others.</p>
          </div>
        </div>

        <h4 className="font-semibold text-neutral-900">Device-Specific Instructions</h4>

        <div className="space-y-3">
          <div className="border border-neutral-200 rounded-lg p-4">
            <h5 className="font-medium text-neutral-900 mb-2">Garmin Devices</h5>
            <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-700">
              <li>Export as GPX with Garmin compatibility</li>
              <li>Copy file to the 'GPX' folder on your device</li>
              <li>Access via 'Trip Planner' on your Garmin</li>
            </ol>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4">
            <h5 className="font-medium text-neutral-900 mb-2">TomTom Devices</h5>
            <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-700">
              <li>Export as GPX with TomTom compatibility</li>
              <li>Use TomTom MyDrive to import the route</li>
              <li>Sync to your TomTom device</li>
            </ol>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4">
            <h5 className="font-medium text-neutral-900 mb-2">Smartphone Apps</h5>
            <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-700">
              <li>Export as GPX for universal compatibility</li>
              <li>Import into apps like Gaia GPS, OsmAnd, or Maps.me</li>
              <li>Access offline during your trip</li>
            </ol>
          </div>
        </div>
      </div>
    )
  },

  // Troubleshooting
  {
    id: 'common-issues',
    title: 'Common Issues and Solutions',
    category: 'troubleshooting',
    tags: ['problems', 'solutions', 'bugs'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    content: (
      <div className="space-y-4">
        <p>Here are solutions to the most common issues users experience.</p>

        <div className="space-y-4">
          <div className="border border-red-200 rounded-lg p-4">
            <h5 className="font-medium text-red-900 mb-2 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" /></svg> Map Won't Load</h5>
            <div className="text-sm text-red-800 space-y-1">
              <p><strong>Possible causes:</strong> Network issues, browser settings, ad blockers</p>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Check your internet connection</li>
                <li>Disable ad blockers for this site</li>
                <li>Clear browser cache and cookies</li>
                <li>Try a different browser</li>
              </ul>
            </div>
          </div>

          <div className="border border-yellow-200 rounded-lg p-4">
            <h5 className="font-medium text-yellow-900 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Route Calculation Fails</h5>
            <div className="text-sm text-yellow-800 space-y-1">
              <p><strong>Possible causes:</strong> Invalid waypoints, server issues, too many waypoints</p>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Check all waypoints are in accessible locations</li>
                <li>Reduce the number of waypoints (max 25)</li>
                <li>Try calculating route segments individually</li>
                <li>Wait a moment and try again</li>
              </ul>
            </div>
          </div>

          <div className="border border-primary-200 rounded-lg p-4">
            <h5 className="font-medium text-primary-900 mb-2 flex items-center gap-1"><Info className="w-4 h-4" /> Saved Trip Disappeared</h5>
            <div className="text-sm text-primary-800 space-y-1">
              <p><strong>Possible causes:</strong> Browser data cleared, different device/browser</p>
              <p><strong>Solutions:</strong></p>
              <ul className="list-disc list-inside ml-4">
                <li>Check if you're using the same browser</li>
                <li>Look for exported trip files on your device</li>
                <li>Import from shared trip links if available</li>
                <li>Contact support if data is critical</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <h5 className="font-medium text-neutral-900 mb-2">Still Having Issues?</h5>
          <p className="text-sm text-neutral-700">
            If these solutions don't help, please <a href="/feedback" className="text-primary-600 underline hover:text-primary-700">use the feedback form</a> to report the issue.
            Include details about your browser, device, and what you were trying to do.
          </p>
        </div>
      </div>
    )
  },

  // Tips & Tricks
  {
    id: 'pro-tips',
    title: 'Pro Tips for Trip Planning',
    category: 'tips-tricks',
    tags: ['tips', 'advanced', 'efficiency'],
    difficulty: 'advanced',
    estimatedReadTime: 8,
    content: (
      <div className="space-y-4">
        <p>Take advantage of these advanced tips to become a trip planning expert.</p>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-1"><Rocket className="w-4 h-4" /> Efficiency Tips</h4>
            <ul className="space-y-2 text-neutral-700">
              <li><strong>Use keyboard shortcuts:</strong> Ctrl+Z to undo, Ctrl+Y to redo waypoint changes</li>
              <li><strong>Bulk operations:</strong> Select multiple waypoints by holding Ctrl while clicking</li>
              <li><strong>Quick add:</strong> Double-click the map to quickly add waypoints</li>
              <li><strong>Smart search:</strong> Use specific addresses or coordinates for precise placement</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-1"><Map className="w-4 h-4" /> Route Planning Tips</h4>
            <ul className="space-y-2 text-neutral-700">
              <li><strong>Seasonal planning:</strong> Consider seasonal road closures in mountainous areas</li>
              <li><strong>Fuel strategy:</strong> Plan fuel stops in areas with lower prices</li>
              <li><strong>Border crossings:</strong> Account for potential delays at country borders</li>
              <li><strong>Alternative routes:</strong> Always have a backup plan for main routes</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-1"><Tent className="w-4 h-4" /> Camping Tips</h4>
            <ul className="space-y-2 text-neutral-700">
              <li><strong>Book ahead:</strong> Popular campsites fill up quickly in summer</li>
              <li><strong>Wild camping:</strong> Research local laws - it varies by country</li>
              <li><strong>Facilities:</strong> Note which campsites have dump stations and fresh water</li>
              <li><strong>Reviews:</strong> Check online reviews for real user experiences</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-2 flex items-center gap-1"><Save className="w-4 h-4" /> Data Management</h4>
            <ul className="space-y-2 text-neutral-700">
              <li><strong>Regular exports:</strong> Export your trips regularly as backup</li>
              <li><strong>Multiple formats:</strong> Export in both GPX and JSON for maximum compatibility</li>
              <li><strong>Cloud backup:</strong> Store exported files in cloud storage for access anywhere</li>
              <li><strong>Version control:</strong> Keep different versions of your trip as it evolves</li>
            </ul>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-900 mb-2 flex items-center gap-1"><Target className="w-4 h-4" /> Master User Tip</h5>
          <p className="text-purple-800 text-sm">
            Create template trips for different regions or trip types. Export these templates and
            import them as starting points for new trips. This saves time and ensures you don't
            forget important waypoints or considerations.
          </p>
        </div>
      </div>
    )
  }
];

// Search functionality
const useHelpSearch = (articles: HelpArticle[]) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;

    const query = searchQuery.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.tags.some(tag => tag.toLowerCase().includes(query)) ||
      article.category.toLowerCase().includes(query)
    );
  }, [articles, searchQuery]);

  return { searchQuery, setSearchQuery, filteredArticles };
};

// Article Component
const ArticleView: React.FC<{
  article: HelpArticle;
  onBack: () => void;
}> = ({ article, onBack }) => {
  const announce = useAnnounce();

  React.useEffect(() => {
    announce(`Now reading: ${article.title}`);
  }, [article.title, announce]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div className="max-w-none">
      {/* Article Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          {...aria.button()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Help Topics</span>
        </button>

        <h1 className="text-2xl font-bold text-neutral-900 mb-3">{article.title}</h1>

        <div className="flex items-center space-x-4 text-sm">
          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getDifficultyColor(article.difficulty))}>
            {article.difficulty}
          </span>
          <span className="text-neutral-600 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> {article.estimatedReadTime} min read
          </span>
          <span className="text-neutral-600 flex items-center gap-1">
            <Tag className="w-3 h-3" /> {article.tags.join(', ')}
          </span>
        </div>
      </div>

      {/* Article Content */}
      <div className="prose prose-primary max-w-none">
        {article.content}
      </div>

      {/* Article Footer */}
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <div className="bg-neutral-50 rounded-lg p-4">
          <h4 className="font-medium text-neutral-900 mb-2">Was this helpful?</h4>
          <div className="flex space-x-3">
            <button className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" /> Yes
            </button>
            <button className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors flex items-center gap-1">
              <ThumbsDown className="w-4 h-4" /> No
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Help System Component
const HelpSystem: React.FC<HelpSystemProps> = ({
  className,
  defaultCategory,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory || '');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const { searchQuery, setSearchQuery, filteredArticles } = useHelpSearch(helpArticles);

  const categoryArticles = useMemo(() => {
    const articles = searchQuery ? filteredArticles : helpArticles;
    return selectedCategory
      ? articles.filter(article => article.category === selectedCategory)
      : articles;
  }, [selectedCategory, searchQuery, filteredArticles]);

  const handleArticleSelect = useCallback((article: HelpArticle) => {
    setSelectedArticle(article);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedArticle(null);
  }, []);

  if (selectedArticle) {
    return (
      <div className={cn('bg-white rounded-lg border border-neutral-200', className)}>
        <div className="p-6">
          <ArticleView article={selectedArticle} onBack={handleBackToList} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-neutral-200', className)}>
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Help & Documentation</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Find answers and learn how to use the trip planner effectively
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              {...aria.button()}
              aria-label="Close help"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-neutral-200 p-4">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={cn(
                'w-full text-left p-3 rounded-lg transition-colors',
                !selectedCategory
                  ? 'bg-primary-100 text-primary-900 border border-primary-200'
                  : 'hover:bg-neutral-100'
              )}
            >
              <div className="flex items-center space-x-3">
                <Library className="w-5 h-5" />
                <div>
                  <div className="font-medium">All Articles</div>
                  <div className="text-xs text-neutral-600">{helpArticles.length} articles</div>
                </div>
              </div>
            </button>

            {helpCategories.map((category) => {
              const articleCount = helpArticles.filter(a => a.category === category.id).length;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-colors',
                    selectedCategory === category.id
                      ? 'bg-primary-100 text-primary-900 border border-primary-200'
                      : 'hover:bg-neutral-100'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <category.icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs text-neutral-600">
                        {articleCount} article{articleCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {searchQuery && (
            <div className="mb-4 text-sm text-neutral-600">
              Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}

          <div className="grid gap-4">
            {categoryArticles.map((article) => {
              const category = helpCategories.find(c => c.id === article.category);

              return (
                <button
                  key={article.id}
                  onClick={() => handleArticleSelect(article)}
                  className="text-left p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-neutral-900">{article.title}</h3>
                    <span className="text-xs text-neutral-500 ml-4">{article.estimatedReadTime} min</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-neutral-600">
                    <span className="flex items-center gap-1">{category?.icon && <category.icon className="w-4 h-4" />} {category?.name}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full',
                      article.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      article.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {article.difficulty}
                    </span>
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {article.tags.join(', ')}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {categoryArticles.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              <div className="mb-4 flex justify-center"><Search className="w-10 h-10 text-neutral-400" /></div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No articles found</h3>
              <p>Try adjusting your search or browse different categories</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpSystem;