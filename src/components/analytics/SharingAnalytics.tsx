// Sharing Analytics Component
// Phase 6.2: Privacy-first analytics for tracking sharing usage without personal data

import React, { useState, useEffect, useMemo } from 'react';
import { TripSharingService, type ShareAnalytics } from '../../services/TripSharingService';
import { cn } from '../../utils/cn';

interface SharingAnalyticsProps {
  className?: string;
}

// Analytics Summary Component
const AnalyticsSummary: React.FC<{
  analytics: ShareAnalytics[];
}> = ({ analytics }) => {
  const summary = useMemo(() => {
    const methodCounts = analytics.reduce((acc, item) => {
      acc[item.method] = (acc[item.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const platformCounts = analytics.reduce((acc, item) => {
      if (item.platform) {
        acc[item.platform] = (acc[item.platform] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const dailyCounts = analytics.reduce((acc, item) => {
      const date = new Date(item.timestamp).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: analytics.length,
      methods: methodCounts,
      platforms: platformCounts,
      dailyActivity: dailyCounts,
      lastWeek: analytics.filter(item =>
        new Date(item.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    };
  }, [analytics]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Shares */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 rounded-full p-2">
            <span className="text-lg">📊</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">{summary.total}</div>
            <div className="text-sm text-blue-700">Total Shares</div>
          </div>
        </div>
      </div>

      {/* This Week */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 rounded-full p-2">
            <span className="text-lg">📈</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-900">{summary.lastWeek}</div>
            <div className="text-sm text-green-700">This Week</div>
          </div>
        </div>
      </div>

      {/* Most Popular Method */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 rounded-full p-2">
            <span className="text-lg">⭐</span>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-900 capitalize">
              {Object.entries(summary.methods).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
            </div>
            <div className="text-sm text-purple-700">Popular Method</div>
          </div>
        </div>
      </div>

      {/* Active Days */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-100 rounded-full p-2">
            <span className="text-lg">📅</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-900">
              {Object.keys(summary.dailyActivity).length}
            </div>
            <div className="text-sm text-orange-700">Active Days</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Method Breakdown Chart
const MethodBreakdown: React.FC<{
  methods: Record<string, number>;
}> = ({ methods }) => {
  const total = Object.values(methods).reduce((sum, count) => sum + count, 0);

  const methodIcons = {
    url: '🔗',
    qr: '📱',
    social: '🌐',
    email: '📧',
    print: '🖨️'
  };

  const methodColors = {
    url: 'bg-blue-500',
    qr: 'bg-green-500',
    social: 'bg-purple-500',
    email: 'bg-yellow-500',
    print: 'bg-gray-500'
  };

  if (total === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-4xl mb-4 block">📊</span>
        <p>No sharing activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(methods).map(([method, count]) => {
        const percentage = (count / total) * 100;
        return (
          <div key={method} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span>{methodIcons[method as keyof typeof methodIcons]}</span>
                <span className="font-medium capitalize">{method}</span>
              </div>
              <div className="text-sm text-gray-600">
                {count} ({percentage.toFixed(1)}%)
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn('h-2 rounded-full', methodColors[method as keyof typeof methodColors])}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Timeline View
const ActivityTimeline: React.FC<{
  analytics: ShareAnalytics[];
}> = ({ analytics }) => {
  const recentActivity = useMemo(() => {
    return analytics
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }, [analytics]);

  const methodIcons = {
    url: '🔗',
    qr: '📱',
    social: '🌐',
    email: '📧',
    print: '🖨️'
  };

  if (recentActivity.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-4xl mb-4 block">📋</span>
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentActivity.map((activity, index) => (
        <div key={`${activity.shareId}-${index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <span className="text-lg">{methodIcons[activity.method]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 capitalize">
              Shared via {activity.method}
              {activity.platform && (
                <span className="text-gray-600"> ({activity.platform})</span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(activity.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Privacy Notice Component
const PrivacyNotice: React.FC = () => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <span className="text-lg">🔒</span>
      </div>
      <div>
        <h4 className="font-medium text-green-900 mb-2">Privacy-First Analytics</h4>
        <div className="text-sm text-green-800 space-y-1">
          <p>• No personal information is collected or stored</p>
          <p>• All data stays on your device in local storage</p>
          <p>• Only anonymous usage patterns are tracked</p>
          <p>• No third-party analytics services are used</p>
          <p>• Data can be cleared at any time</p>
        </div>
      </div>
    </div>
  </div>
);

// Main SharingAnalytics Component
const SharingAnalytics: React.FC<SharingAnalyticsProps> = ({ className }) => {
  const [analytics, setAnalytics] = useState<ShareAnalytics[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'timeline' | 'privacy'>('overview');

  // Load analytics data
  useEffect(() => {
    const data = TripSharingService.getAnonymousAnalytics();
    setAnalytics(data);
  }, []);

  // Clear analytics data
  const clearData = () => {
    TripSharingService.clearAnalytics();
    setAnalytics([]);
  };

  // Export analytics data
  const exportData = () => {
    const dataStr = JSON.stringify(analytics, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sharing-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sharing Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">
              Anonymous analytics for your trip sharing activity
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportData}
              disabled={analytics.length === 0}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📊 Export
            </button>
            <button
              onClick={clearData}
              disabled={analytics.length === 0}
              className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'methods', label: 'Methods', icon: '📈' },
            { id: 'timeline', label: 'Timeline', icon: '📋' },
            { id: 'privacy', label: 'Privacy', icon: '🔒' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AnalyticsSummary analytics={analytics} />

            {analytics.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Sharing Methods</h4>
                  <MethodBreakdown
                    methods={analytics.reduce((acc, item) => {
                      acc[item.method] = (acc[item.method] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Recent Activity</h4>
                  <ActivityTimeline analytics={analytics.slice(-5)} />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'methods' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Sharing Method Breakdown</h4>
            <MethodBreakdown
              methods={analytics.reduce((acc, item) => {
                acc[item.method] = (acc[item.method] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Activity Timeline</h4>
            <ActivityTimeline analytics={analytics} />
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <PrivacyNotice />

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Data Storage</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Storage Location:</strong> Your browser's local storage</p>
                <p><strong>Data Retention:</strong> Until manually cleared or browser data is cleared</p>
                <p><strong>Maximum Entries:</strong> 100 most recent activities</p>
                <p><strong>Data Size:</strong> Typically less than 10KB</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">What We Track</h4>
              <div className="text-sm text-gray-600">
                <ul className="space-y-1">
                  <li>• Sharing method (URL, QR, Social, Email, Print)</li>
                  <li>• Platform used (Facebook, Twitter, etc.)</li>
                  <li>• Timestamp of sharing action</li>
                  <li>• Anonymous share ID (no personal connection)</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">What We Don't Track</h4>
              <div className="text-sm text-gray-600">
                <ul className="space-y-1">
                  <li>• Personal information or user identities</li>
                  <li>• Trip content or waypoint data</li>
                  <li>• IP addresses or device fingerprints</li>
                  <li>• Share recipients or who views trips</li>
                  <li>• Third-party cookies or tracking pixels</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharingAnalytics;