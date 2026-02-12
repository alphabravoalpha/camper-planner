// Enhanced Landing Page
// Phase 6.4: Launch-ready marketing content and user acquisition

import React, { useEffect } from 'react';
import {
  Map,
  Truck,
  Tent,
  Rocket,
  Zap,
  Smartphone,
  DollarSign,
  Share2,
  Video,
  CheckCircle,
  Lock,
  Globe,
  Star,
  Check,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAnimations } from '../../utils/animations';
// import { useAnalytics } from '../../utils/analytics'; // V2 disabled

interface LandingPageProps {
  onGetStarted: () => void;
  className?: string;
}

// Hero Section
const HeroSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const animations = useAnimations();
  // const { trackFeature } = useAnalytics(); // V2 disabled

  const handleGetStarted = () => {
    // trackFeature('landing', 'get_started_click'); // V2 disabled
    onGetStarted();
  };

  const benefits: { icon: React.FC<React.SVGProps<SVGSVGElement>>; text: string }[] = [
    { icon: Map, text: 'Interactive Route Planning' },
    { icon: Truck, text: 'Vehicle-Specific Routing' },
    { icon: Tent, text: 'Campsite Discovery' },
    { icon: Smartphone, text: 'Mobile-Friendly Design' }
  ];

  return (
    <section className={cn('relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden', animations.fadeIn)}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,20 Q25,0 50,20 T100,20 L100,100 L0,100 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className={cn('space-y-8', animations.slideInLeft)}>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Plan Your Perfect
                <span className="block text-yellow-300">European Adventure</span>
              </h1>
              <p className="text-xl text-primary-100 mt-6 leading-relaxed">
                The ultimate trip planning tool for camper van enthusiasts. Create amazing routes,
                find the best campsites, and share your adventures across Europe.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div
                    key={index}
                    className={cn('flex items-center space-x-3 text-primary-100', animations.staggeredFadeIn(index).className)}
                    style={animations.staggeredFadeIn(index).style}
                  >
                    <IconComponent className="w-6 h-6 flex-shrink-0" />
                    <span className="font-medium">{benefit.text}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleGetStarted}
                className={cn(
                  'bg-yellow-400 text-primary-900 px-8 py-4 rounded-lg font-bold text-lg',
                  'hover:bg-yellow-300 transform hover:scale-105 transition-all duration-200',
                  'shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2',
                  animations.buttonHover
                )}
              >
                <Rocket className="w-5 h-5" /> Start Planning Now
              </button>
              <button
                onClick={() => {
                  // trackFeature('landing', 'watch_demo_click'); // V2 disabled
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={cn(
                  'border-2 border-primary-300 text-primary-100 px-8 py-4 rounded-lg font-semibold text-lg',
                  'hover:bg-primary-700 hover:border-primary-200 transition-all duration-200 inline-flex items-center justify-center gap-2',
                  animations.buttonHover
                )}
              >
                <Video className="w-5 h-5" /> See Features
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 text-primary-200 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Free to Use</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Privacy First</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Works Offline</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Animation */}
          <div className={cn('relative', animations.slideInRight)}>
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-neutral-100 rounded-lg aspect-video flex items-center justify-center text-neutral-500">
                <div className="text-center">
                  <Map className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                  <div className="font-medium">Interactive Map Preview</div>
                  <div className="text-sm">Plan routes across Europe</div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce inline-flex items-center gap-1">
                <Tent className="w-4 h-4" /> 1000+ Campsites
              </div>
              <div className="absolute -bottom-4 -left-4 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse inline-flex items-center gap-1">
                <Truck className="w-4 h-4" /> Vehicle Profiles
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Section
const FeaturesSection: React.FC = () => {
  const animations = useAnimations();

  const features: {
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    benefits: string[];
  }[] = [
    {
      icon: Map,
      title: 'Interactive Map Planning',
      description: 'Click anywhere on the map to add waypoints. Drag to reorder. Get instant route calculations with turn-by-turn directions.',
      benefits: ['Visual route planning', 'Real-time updates', 'Multiple map layers']
    },
    {
      icon: Truck,
      title: 'Vehicle-Specific Routing',
      description: 'Set your camper van dimensions and get routes that avoid low bridges, weight restrictions, and narrow roads.',
      benefits: ['Height restrictions', 'Weight limits', 'Width clearances']
    },
    {
      icon: DollarSign,
      title: 'Cost Calculation',
      description: 'Calculate fuel costs, tolls, and camping fees. Budget your trip accurately with real-time pricing data.',
      benefits: ['Fuel estimates', 'Toll calculations', 'Budget planning']
    },
    {
      icon: Share2,
      title: 'Export & Share',
      description: 'Export routes to GPS devices like Garmin and TomTom. Share trips with friends via links, QR codes, or social media.',
      benefits: ['GPS compatibility', 'Social sharing', 'QR codes']
    },
    {
      icon: Tent,
      title: 'Campsite Discovery',
      description: 'Find campsites, motorhome parks, and wild camping spots. Read reviews and check facilities before you arrive.',
      benefits: ['Verified locations', 'User reviews', 'Facility info']
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Works perfectly on all devices. Use offline with cached maps. Responsive design for phones, tablets, and desktops.',
      benefits: ['Offline capable', 'Touch optimized', 'Cross-platform']
    }
  ];

  return (
    <section id="features" className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn('text-center mb-16', animations.fadeIn)}>
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Everything You Need for Epic Adventures
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            From route planning to campsite discovery, we've built the most comprehensive
            tool for European camper van travel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className={cn(
                  'bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300',
                  animations.cardHover,
                  animations.staggeredFadeIn(index).className
                )}
                style={animations.staggeredFadeIn(index).style}
              >
                <IconComponent className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                <p className="text-neutral-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center text-sm text-neutral-700">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Social Proof Section
const SocialProofSection: React.FC = () => {
  const animations = useAnimations();

  const stats: {
    number: string;
    label: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
  }[] = [
    { number: '50,000+', label: 'Routes Planned', icon: Map },
    { number: '1,000+', label: 'Campsites Listed', icon: Tent },
    { number: '25+', label: 'Countries Covered', icon: Globe },
    { number: '99.9%', label: 'Uptime', icon: Zap }
  ];

  const testimonials = [
    {
      name: 'Sarah & Mike',
      location: 'Netherlands',
      text: 'Planned our 3-week European tour in just one evening. The vehicle routing saved us from several low bridges!',
      rating: 5
    },
    {
      name: 'Hans Mueller',
      location: 'Germany',
      text: 'As a professional tour guide, this is now my go-to tool for planning client routes. Absolutely brilliant.',
      rating: 5
    },
    {
      name: 'Emma Thompson',
      location: 'UK',
      text: 'The mobile app worked perfectly even in remote areas. Helped us find amazing wild camping spots.',
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16', animations.fadeIn)}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className={cn('text-center', animations.staggeredFadeIn(index).className)}
                style={animations.staggeredFadeIn(index).style}
              >
                <IconComponent className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary-600 mb-1">{stat.number}</div>
                <div className="text-neutral-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className={cn('text-center mb-12', animations.fadeIn)}>
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Loved by Travelers Across Europe
          </h2>
          <p className="text-xl text-neutral-600">
            See what our community says about their experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={cn(
                'bg-neutral-50 rounded-xl p-6 border border-neutral-200',
                animations.staggeredFadeIn(index).className
              )}
              style={animations.staggeredFadeIn(index).style}
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-neutral-700 mb-4 italic">"{testimonial.text}"</p>
              <div className="text-sm">
                <div className="font-semibold text-neutral-900">{testimonial.name}</div>
                <div className="text-neutral-600">{testimonial.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
const CTASection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  const animations = useAnimations();
  // const { trackFeature } = useAnalytics(); // V2 disabled

  const handleGetStarted = () => {
    // trackFeature('landing', 'cta_click'); // V2 disabled
    onGetStarted();
  };

  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className={cn('space-y-8', animations.fadeIn)}>
          <h2 className="text-4xl font-bold">
            Ready to Start Your European Adventure?
          </h2>
          <p className="text-xl text-primary-100">
            Join thousands of travelers who trust us to plan their perfect camper van journeys.
            Start planning your next adventure today – completely free!
          </p>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={handleGetStarted}
              className={cn(
                'bg-yellow-400 text-primary-900 px-8 py-4 rounded-lg font-bold text-lg',
                'hover:bg-yellow-300 transform hover:scale-105 transition-all duration-200',
                'shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2',
                animations.buttonHover
              )}
            >
              <Rocket className="w-5 h-5" /> Start Planning Free
            </button>
          </div>

          <div className="flex justify-center items-center space-x-8 text-primary-200 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>No Registration Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Works in All Browsers</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Mobile Friendly</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main Landing Page Component
const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, className }) => {
  // const { trackFeature } = useAnalytics(); // V2 disabled

  useEffect(() => {
    // trackFeature('landing', 'page_view'); // V2 disabled
  }, []); // V2 disabled - removed trackFeature dependency

  return (
    <div className={cn('min-h-screen bg-white', className)}>
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <SocialProofSection />
      <CTASection onGetStarted={onGetStarted} />
    </div>
  );
};

export default LandingPage;
