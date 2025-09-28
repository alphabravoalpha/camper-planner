// Feedback Collection System
// Phase 6.4: Comprehensive user feedback for post-launch improvements

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '../../utils/cn';
import { aria, useAnnounce } from '../../utils/accessibility';
import { useAnalytics } from '../../utils/analytics';

interface FeedbackData {
  type: 'bug_report' | 'feature_request' | 'general_feedback' | 'rating';
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  rating?: number;
  userAgent: string;
  url: string;
  timestamp: number;
  version: string;
  browserInfo: {
    width: number;
    height: number;
    language: string;
    platform: string;
  };
}

interface FeedbackSystemProps {
  className?: string;
  onClose?: () => void;
  initialType?: FeedbackData['type'];
}

// Bug Report Form
const BugReportForm: React.FC<{
  onSubmit: (data: Partial<FeedbackData>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'map',
    priority: 'medium' as const,
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const description = `
**Steps to Reproduce:**
${formData.stepsToReproduce}

**Expected Behavior:**
${formData.expectedBehavior}

**Actual Behavior:**
${formData.actualBehavior}

**Additional Details:**
${formData.description}
    `.trim();

    onSubmit({
      type: 'bug_report',
      title: formData.title,
      description,
      category: formData.category,
      priority: formData.priority,
    });
  };

  const categories = [
    { id: 'map', name: 'Map & Navigation' },
    { id: 'routing', name: 'Route Planning' },
    { id: 'vehicle', name: 'Vehicle Profiles' },
    { id: 'export', name: 'Export & Sharing' },
    { id: 'performance', name: 'Performance' },
    { id: 'ui', name: 'User Interface' },
    { id: 'other', name: 'Other' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bug Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of the issue"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="low">Low - Minor issue</option>
            <option value="medium">Medium - Affects functionality</option>
            <option value="high">High - Blocks major feature</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Steps to Reproduce *
        </label>
        <textarea
          required
          value={formData.stepsToReproduce}
          onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
          placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expected Behavior *
        </label>
        <textarea
          required
          value={formData.expectedBehavior}
          onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
          placeholder="What should happen?"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Actual Behavior *
        </label>
        <textarea
          required
          value={formData.actualBehavior}
          onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
          placeholder="What actually happens?"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Information
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Any other details that might be helpful"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Report Bug
        </button>
      </div>
    </form>
  );
};

// Feature Request Form
const FeatureRequestForm: React.FC<{
  onSubmit: (data: Partial<FeedbackData>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'enhancement',
    priority: 'medium' as const,
    useCases: '',
    benefit: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const description = `
**Feature Description:**
${formData.description}

**Use Cases:**
${formData.useCases}

**Expected Benefit:**
${formData.benefit}
    `.trim();

    onSubmit({
      type: 'feature_request',
      title: formData.title,
      description,
      category: formData.category,
      priority: formData.priority,
    });
  };

  const categories = [
    { id: 'enhancement', name: 'Enhancement' },
    { id: 'new_feature', name: 'New Feature' },
    { id: 'integration', name: 'Integration' },
    { id: 'performance', name: 'Performance' },
    { id: 'ui_ux', name: 'User Interface' },
    { id: 'accessibility', name: 'Accessibility' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feature Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of the feature"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low - Nice to have</option>
            <option value="medium">Medium - Would be useful</option>
            <option value="high">High - Really needed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feature Description *
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the feature you'd like to see"
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Use Cases *
        </label>
        <textarea
          required
          value={formData.useCases}
          onChange={(e) => setFormData({ ...formData, useCases: e.target.value })}
          placeholder="How would you use this feature? What problem does it solve?"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expected Benefit
        </label>
        <textarea
          value={formData.benefit}
          onChange={(e) => setFormData({ ...formData, benefit: e.target.value })}
          placeholder="What benefit would this feature provide?"
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Submit Request
        </button>
      </div>
    </form>
  );
};

// General Feedback Form
const GeneralFeedbackForm: React.FC<{
  onSubmit: (data: Partial<FeedbackData>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'general_feedback',
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
    });
  };

  const categories = [
    { id: 'general', name: 'General Feedback' },
    { id: 'usability', name: 'Usability' },
    { id: 'design', name: 'Design' },
    { id: 'content', name: 'Content' },
    { id: 'suggestion', name: 'Suggestion' },
    { id: 'compliment', name: 'Compliment' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feedback Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief summary of your feedback"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Feedback *
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Share your thoughts, suggestions, or comments"
          rows={6}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Send Feedback
        </button>
      </div>
    </form>
  );
};

// Rating Form
const RatingForm: React.FC<{
  onSubmit: (data: Partial<FeedbackData>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'rating',
      title: `User Rating: ${rating}/5`,
      description: feedback,
      category: 'rating',
      priority: 'low',
      rating,
    });
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          How would you rate your experience?
        </h3>
        <div className="flex justify-center space-x-2 mb-4">
          {stars.map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={cn(
                'text-3xl transition-colors',
                star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
              )}
              {...aria.button()}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              ⭐
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-600">
            {rating === 1 && 'Poor - Needs significant improvement'}
            {rating === 2 && 'Fair - Several issues to address'}
            {rating === 3 && 'Good - Works well with minor issues'}
            {rating === 4 && 'Very Good - Minor improvements needed'}
            {rating === 5 && 'Excellent - Exceeds expectations'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tell us more (optional)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What did you like? What could be improved?"
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={rating === 0}
          className={cn(
            'px-6 py-2 rounded-lg font-medium transition-colors',
            rating > 0
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          Submit Rating
        </button>
      </div>
    </form>
  );
};

// Main Feedback System Component
const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  className,
  onClose,
  initialType = 'general_feedback'
}) => {
  const [feedbackType, setFeedbackType] = useState(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const announce = useAnnounce();
  const { trackFeature } = useAnalytics();

  const handleSubmit = useCallback(async (data: Partial<FeedbackData>) => {
    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        ...data,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
        version: process.env.VITE_APP_VERSION || 'unknown',
        browserInfo: {
          width: window.innerWidth,
          height: window.innerHeight,
          language: navigator.language,
          platform: navigator.platform,
        },
      } as FeedbackData;

      // In a real implementation, send to backend
      await submitFeedback(feedbackData);

      // Track the feedback submission
      trackFeature('feedback', 'submit', {
        type: feedbackType,
        category: data.category,
        priority: data.priority,
      });

      setSubmitted(true);
      announce('Feedback submitted successfully');

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      announce('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackType, trackFeature, announce]);

  // Mock feedback submission
  const submitFeedback = async (data: FeedbackData): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Store locally for now (in production, send to backend)
    const existingFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]');
    existingFeedback.push(data);
    localStorage.setItem('userFeedback', JSON.stringify(existingFeedback));

    console.log('Feedback submitted:', data);
  };

  const feedbackTypes = [
    { id: 'bug_report', name: 'Report a Bug', icon: '🐛', color: 'red' },
    { id: 'feature_request', name: 'Request Feature', icon: '💡', color: 'blue' },
    { id: 'general_feedback', name: 'General Feedback', icon: '💬', color: 'green' },
    { id: 'rating', name: 'Rate Experience', icon: '⭐', color: 'yellow' },
  ];

  if (submitted) {
    return (
      <div className={cn('bg-white rounded-lg border border-gray-200 p-6', className)}>
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Thank you for your feedback!
          </h3>
          <p className="text-gray-600 mb-6">
            Your feedback helps us improve the European Camper Trip Planner for everyone.
            We review all feedback and will consider your suggestions for future updates.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share Your Feedback</h2>
            <p className="text-sm text-gray-600 mt-1">
              Help us improve by sharing your thoughts, reporting issues, or suggesting features
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              {...aria.button()}
              aria-label="Close feedback form"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Type Selection */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">What type of feedback do you have?</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {feedbackTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setFeedbackType(type.id as FeedbackData['type'])}
              className={cn(
                'p-3 rounded-lg border-2 text-center transition-all',
                feedbackType === type.id
                  ? `border-${type.color}-500 bg-${type.color}-50`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-sm font-medium">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Form */}
      <div className="p-6">
        {isSubmitting ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Submitting your feedback...</p>
          </div>
        ) : (
          <>
            {feedbackType === 'bug_report' && (
              <BugReportForm onSubmit={handleSubmit} onCancel={onClose || (() => {})} />
            )}
            {feedbackType === 'feature_request' && (
              <FeatureRequestForm onSubmit={handleSubmit} onCancel={onClose || (() => {})} />
            )}
            {feedbackType === 'general_feedback' && (
              <GeneralFeedbackForm onSubmit={handleSubmit} onCancel={onClose || (() => {})} />
            )}
            {feedbackType === 'rating' && (
              <RatingForm onSubmit={handleSubmit} onCancel={onClose || (() => {})} />
            )}
          </>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="px-6 pb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">🔒 Privacy Notice</h4>
          <p className="text-sm text-blue-800">
            Your feedback is important to us. We collect only the information necessary to address
            your feedback and improve our service. We do not share your feedback with third parties
            and handle all data in accordance with our privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSystem;