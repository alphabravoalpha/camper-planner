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
              <img
                src="/logo.png"
                alt="European Camper Planner"
                className="w-7 h-7"
                width={28}
                height={28}
              />
              <span className="text-white font-display font-semibold text-sm">
                European Camper Planner
              </span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Free, privacy-first trip planning for European camper travellers. No accounts, no
              subscriptions.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-display font-semibold text-sm mb-3">Plan</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors"
                >
                  Trip Planner
                </Link>
              </li>
              <li>
                <Link
                  to="/guides"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors"
                >
                  Travel Guides
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors"
                >
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
                <Link
                  to="/privacy"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  to="/affiliate-disclosure"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors"
                >
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
                <Link
                  to="/support"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors inline-flex items-center gap-1"
                >
                  <Heart className="w-3.5 h-3.5" />
                  Support This Project
                </Link>
              </li>
              <li>
                <Link
                  to="/feedback"
                  className="text-sm text-neutral-400 hover:text-white hover:underline transition-colors inline-flex items-center gap-1"
                >
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
            <p>&copy; {currentYear} European Camper Trip Planner. Free and open source.</p>
            <p className="text-center sm:text-right">
              Some links may earn us a small commission at no extra cost to you.{' '}
              <Link
                to="/affiliate-disclosure"
                className="underline hover:text-neutral-300 transition-colors"
              >
                Read our affiliate disclosure
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
