// Blog card for listing pages

import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { BlogPost } from '../../types/blog';
import { BLOG_CATEGORIES } from '../../data/blog';

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const categoryInfo = BLOG_CATEGORIES[post.category];

  return (
    <Link
      to={`/guides/${post.slug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={post.heroImage.src}
          alt={post.heroImage.alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.onerror = null;
            img.src = '/images/blog/fallback-hero.jpg';
          }}
        />
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary-500/90 text-white text-xs font-display font-semibold rounded-full">
          {categoryInfo.name}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-bold text-neutral-900 mb-2 group-hover:text-primary-700 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
          {post.description}
        </p>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTime} min read
          </span>
          <span>
            {new Date(post.publishedDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
