// Trip Sharing Component
// Phase 6.2: Privacy-first trip sharing with comprehensive sharing options

import React, { useState, useCallback, useMemo } from 'react';
import { useRouteStore, useVehicleStore, useTripStore, useUIStore } from '../../store';
import { TripSharingService } from '../../services/TripSharingService';
import type { ShareOptions, ShareResult } from '../../services/TripSharingService';
import { QRCodeGenerator } from '../../utils/qrcode';
import { cn } from '../../utils/cn';

interface TripSharingProps {
  className?: string;
}

// QR Code Display Component
const QRCodeDisplay: React.FC<{
  url: string;
  size?: number;
  onError?: (error: string) => void;
}> = ({ url, size = 200, onError }) => {
  const [qrSvg, setQrSvg] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    if (!url) return;

    setIsGenerating(true);
    const result = QRCodeGenerator.generateSVG(url, size);

    if (result.success) {
      setQrSvg(result.svg);
    } else {
      onError?.(result.errors[0] || 'QR code generation failed');
    }

    setIsGenerating(false);
  }, [url, size, onError]);

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!qrSvg) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">QR Code</span>
      </div>
    );
  }

  return (
    <div
      className="border border-gray-300 rounded-lg overflow-hidden"
      dangerouslySetInnerHTML={{ __html: qrSvg }}
    />
  );
};

// Social Media Sharing Component
const SocialMediaSharing: React.FC<{
  shareUrl: string;
  tripName: string;
  onShare: (platform: string) => void;
}> = ({ shareUrl, tripName, onShare }) => {
  const socialLinks = useMemo(() => {
    return TripSharingService.generateSocialLinks(shareUrl, tripName);
  }, [shareUrl, tripName]);

  const handleSocialShare = useCallback((platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    onShare(platform);
  }, [onShare]);

  const socialPlatforms = [
    { key: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-600 hover:bg-blue-700' },
    { key: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-sky-500 hover:bg-sky-600' },
    { key: 'whatsapp', name: 'WhatsApp', icon: '💬', color: 'bg-green-600 hover:bg-green-700' },
    { key: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'bg-blue-700 hover:bg-blue-800' }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {socialPlatforms.map(platform => (
        <button
          key={platform.key}
          onClick={() => handleSocialShare(platform.key, socialLinks[platform.key as keyof typeof socialLinks])}
          className={cn(
            'flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-white font-medium transition-colors',
            platform.color
          )}
        >
          <span>{platform.icon}</span>
          <span>{platform.name}</span>
        </button>
      ))}
    </div>
  );
};

// Email Sharing Component
const EmailSharing: React.FC<{
  shareUrl: string;
  tripData: any;
  onShare: () => void;
}> = ({ shareUrl, tripData, onShare }) => {
  const emailContent = useMemo(() => {
    if (!tripData) return null;
    return TripSharingService.generateEmailContent(shareUrl, tripData);
  }, [shareUrl, tripData]);

  const handleEmailShare = useCallback(() => {
    if (emailContent) {
      window.location.href = emailContent.mailtoLink;
      onShare();
    }
  }, [emailContent, onShare]);

  const copyEmailContent = useCallback(() => {
    if (emailContent) {
      navigator.clipboard.writeText(`${emailContent.subject}\n\n${emailContent.body}`);
    }
  }, [emailContent]);

  if (!emailContent) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Email Preview</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <div><strong>Subject:</strong> {emailContent.subject}</div>
          <div>
            <strong>Body:</strong>
            <div className="mt-1 p-2 bg-white border rounded text-xs font-mono max-h-32 overflow-y-auto">
              {emailContent.body}
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleEmailShare}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          📧 Open in Email App
        </button>
        <button
          onClick={copyEmailContent}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          📋 Copy
        </button>
      </div>
    </div>
  );
};

// Print Summary Component
const PrintSummary: React.FC<{
  tripData: any;
  shareUrl: string;
  onPrint: () => void;
}> = ({ tripData, shareUrl, onPrint }) => {
  const handlePrint = useCallback(() => {
    if (!tripData) return;

    const { html, css } = TripSharingService.generatePrintSummary(tripData, true, shareUrl);

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trip Summary - ${tripData.name}</title>
          <style>${css}</style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    onPrint();
  }, [tripData, shareUrl, onPrint]);

  const downloadPDF = useCallback(() => {
    // This would require a PDF library in a real implementation
    // For now, we'll just trigger the print dialog
    handlePrint();
  }, [handlePrint]);

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Print Options</h4>
        <p className="text-sm text-gray-600 mb-4">
          Generate a print-friendly summary of your trip with all essential information including waypoints,
          vehicle details, and the digital trip link for easy reference.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>🖨️</span>
            <span>Print Summary</span>
          </button>

          <button
            onClick={downloadPDF}
            className="flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>📄</span>
            <span>Print Preview</span>
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <p><strong>What's included:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Complete route with all waypoints and coordinates</li>
          <li>Vehicle information and restrictions</li>
          <li>Trip metadata and creation details</li>
          <li>Digital link for importing the trip</li>
        </ul>
      </div>
    </div>
  );
};

// Share Options Panel
const ShareOptionsPanel: React.FC<{
  options: ShareOptions;
  onChange: (options: ShareOptions) => void;
}> = ({ options, onChange }) => {
  const updateOption = (key: keyof ShareOptions, value: any) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Sharing Options</h4>

      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.includeVehicle}
            onChange={(e) => updateOption('includeVehicle', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div>
            <div className="font-medium text-sm">Include Vehicle Information</div>
            <div className="text-xs text-gray-500">Share vehicle dimensions and restrictions</div>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.includeMetadata}
            onChange={(e) => updateOption('includeMetadata', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div>
            <div className="font-medium text-sm">Include Trip Metadata</div>
            <div className="text-xs text-gray-500">Creation date, author, and trip statistics</div>
          </div>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={options.includeDescription}
            onChange={(e) => updateOption('includeDescription', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div>
            <div className="font-medium text-sm">Include Description</div>
            <div className="text-xs text-gray-500">Share trip description and notes</div>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Trip Name (optional)
        </label>
        <input
          type="text"
          value={options.customName || ''}
          onChange={(e) => updateOption('customName', e.target.value)}
          placeholder="My Amazing European Adventure"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link Expiration (optional)
        </label>
        <select
          value={options.expirationDays || ''}
          onChange={(e) => updateOption('expirationDays', e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Never expires</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
        </select>
      </div>
    </div>
  );
};

// Main TripSharing Component
const TripSharing: React.FC<TripSharingProps> = ({ className }) => {
  const { waypoints, calculatedRoute } = useRouteStore();
  const { profile: vehicleProfile } = useVehicleStore();
  const { currentTrip } = useTripStore();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'social' | 'email' | 'print'>('link');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    includeVehicle: true,
    includeMetadata: true,
    includeDescription: true
  });

  // Check if sharing is possible
  const canShare = useMemo(() => {
    return waypoints.length >= 2;
  }, [waypoints.length]);

  // Generate shareable trip data
  const shareableTrip = useMemo(() => {
    if (!canShare) return null;

    const tripData = {
      id: Date.now().toString(),
      name: shareOptions.customName || currentTrip?.name || `Trip ${new Date().toLocaleDateString()}`,
      description: shareOptions.includeDescription ? currentTrip?.description : undefined,
      waypoints,
      vehicle: shareOptions.includeVehicle ? vehicleProfile : undefined,
      metadata: {
        created: new Date().toISOString(),
        version: '1.0',
        totalDistance: calculatedRoute?.routes?.[0]?.summary?.distance,
        estimatedTime: calculatedRoute?.routes?.[0]?.summary?.duration,
        author: shareOptions.includeMetadata ? currentTrip?.metadata?.author : undefined
      }
    };

    return tripData;
  }, [waypoints, shareOptions, currentTrip, vehicleProfile, calculatedRoute, canShare]);

  // Generate share URL
  const generateShareUrl = useCallback(async () => {
    if (!canShare || !shareableTrip) return;

    setIsGenerating(true);

    try {
      const result = await TripSharingService.generateShareUrl(
        waypoints,
        shareOptions,
        {
          trip: currentTrip || undefined,
          vehicle: vehicleProfile || undefined,
          calculatedRoute: calculatedRoute || undefined
        }
      );

      setShareResult(result);

      if (result.success) {
        addNotification({
          type: 'success',
          message: 'Share link generated successfully!'
        });
      } else {
        addNotification({
          type: 'error',
          message: `Failed to generate share link: ${result.errors.join(', ')}`
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Error generating share link: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsGenerating(false);
    }
  }, [waypoints, shareOptions, currentTrip, vehicleProfile, calculatedRoute, canShare, addNotification, shareableTrip]);

  // Copy link to clipboard
  const copyLink = useCallback(() => {
    if (shareResult?.shareUrl) {
      navigator.clipboard.writeText(shareResult.shareUrl);
      addNotification({
        type: 'success',
        message: 'Link copied to clipboard!'
      });
    }
  }, [shareResult, addNotification]);

  // Track sharing method
  const trackShare = useCallback((method: string, platform?: string) => {
    // Anonymous analytics tracking
    console.log(`Trip shared via ${method}${platform ? ` (${platform})` : ''}`);
  }, []);

  if (!waypoints.length) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Trip to Share</h3>
          <p>Add waypoints to your route to enable trip sharing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Share Your Trip</h3>
        <p className="text-sm text-gray-600 mt-1">
          Share your European camper trip with friends and family across multiple platforms
        </p>
      </div>

      {/* Share Options */}
      <div className="p-6 border-b border-gray-200">
        <ShareOptionsPanel options={shareOptions} onChange={setShareOptions} />

        <div className="mt-6">
          <button
            onClick={generateShareUrl}
            disabled={!canShare || isGenerating}
            className={cn(
              'w-full py-3 px-4 rounded-lg font-medium transition-colors',
              canShare && !isGenerating
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {isGenerating ? 'Generating Share Link...' : 'Generate Share Link'}
          </button>
        </div>
      </div>

      {shareResult?.success && (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'link', label: 'Share Link', icon: '🔗' },
                { id: 'qr', label: 'QR Code', icon: '📱' },
                { id: 'social', label: 'Social Media', icon: '🌐' },
                { id: 'email', label: 'Email', icon: '📧' },
                { id: 'print', label: 'Print', icon: '🖨️' }
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
            {activeTab === 'link' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share URL</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={shareResult.shareUrl}
                      readOnly
                      className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    />
                    <button
                      onClick={copyLink}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Share Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Share Code: <code className="bg-white px-1 rounded">{shareResult.shareCode}</code></div>
                    <div>Waypoints: {waypoints.length}</div>
                    {shareResult.expiresAt && (
                      <div>Expires: {new Date(shareResult.expiresAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="space-y-4">
                <div className="text-center">
                  <QRCodeDisplay
                    url={shareResult.shareUrl}
                    size={200}
                    onError={(error) => addNotification({ type: 'error', message: error })}
                  />
                </div>

                <div className="text-center">
                  <button
                    onClick={() => trackShare('qr')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    📱 Scan with mobile device to open trip
                  </button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How to use QR Code</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Open camera app on your phone</li>
                    <li>• Point camera at QR code</li>
                    <li>• Tap the notification to open the trip link</li>
                    <li>• Trip will load automatically in the browser</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'social' && shareableTrip && (
              <div className="space-y-4">
                <SocialMediaSharing
                  shareUrl={shareResult.shareUrl}
                  tripName={shareableTrip.name}
                  onShare={(platform) => trackShare('social', platform)}
                />

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Privacy Notice</h4>
                  <p className="text-sm text-gray-600">
                    Your trip data is encoded directly in the share link. No personal information
                    is stored on external servers. Recipients can import your trip without creating accounts.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'email' && shareableTrip && (
              <EmailSharing
                shareUrl={shareResult.shareUrl}
                tripData={shareableTrip}
                onShare={() => trackShare('email')}
              />
            )}

            {activeTab === 'print' && shareableTrip && (
              <PrintSummary
                tripData={shareableTrip}
                shareUrl={shareResult.shareUrl}
                onPrint={() => trackShare('print')}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TripSharing;