// Footer Component
// Site-wide footer with navigation, legal links, affiliate disclosure, and donation

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ExternalLink, MessageSquare } from 'lucide-react';

const KOFI_URL = 'https://ko-fi.com/camperplanning';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Main Footer Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-white font-display font-semibold text-sm">
                European Camper Planner
              </span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Free, privacy-first trip planning for European camper travellers. No accounts, no subscriptions.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-display font-semibold text-sm mb-3">Plan</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors">
                  Trip Planner
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors">
                  Help Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-display font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/affiliate-disclosure" className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors">
                  Affiliate Disclosure
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-display font-semibold text-sm mb-3">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/support" className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors inline-flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  Support This Project
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors inline-flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Feedback
                </Link>
              </li>
              <li>
                <a
                  href={KOFI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors inline-flex items-center gap-1"
                >
                  Buy us a coffee
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/AlphaBravoAlpha/camper-planner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors inline-flex items-center gap-1"
                >
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar — Affiliate Disclosure + Copyright */}
      <div className="border-t border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
            <p>
              &copy; {currentYear} European Camper Trip Planner. Free and open source.
            </p>
            <p className="text-center sm:text-right">
              Some links may earn us a small commission at no extra cost to you.{' '}
              <Link to="/affiliate-disclosure" className="underline hover:text-neutral-300 transition-colors">
                Learn more
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
