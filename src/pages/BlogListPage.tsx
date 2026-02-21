// Blog/Guides listing page with category filter tabs

import React, { useState, useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import type { BlogCategory } from '../types/blog';
import { blogPosts, BLOG_CATEGORIES } from '../data/blog';
import BlogCard from '../components/blog/BlogCard';
import SEOHead from '../components/seo/SEOHead';

const ALL_CATEGORIES: (BlogCategory | 'all')[] = [
  'all',
  'destination-guides',
  'route-planning',
  'practical-guides',
  'campsite-guides',
  'vehicle-guides',
];

const BlogListPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | 'all'>('all');

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'all') return blogPosts;
    return blogPosts.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <>
      <SEOHead
        title="Travel Guides & Tips — European Camper Planner"
        description="Expert guides for planning your European camper trip. Destination guides, route planning tips, campsite reviews, and practical advice for motorhome and campervan travel."
        url="https://camperplanning.com/guides"
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-primary-200" />
            <span className="text-primary-200 font-display font-semibold text-sm uppercase tracking-wider">
              Travel Guides
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold mb-3">
            European Camper Travel Guides
          </h1>
          <p className="text-primary-100 text-lg max-w-2xl">
            Destination guides, route planning tips, and practical advice for exploring Europe by motorhome or campervan.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {ALL_CATEGORIES.map((cat) => {
              const label = cat === 'all' ? 'All Guides' : BLOG_CATEGORIES[cat].name;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-display font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500">No guides in this category yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BlogListPage;
