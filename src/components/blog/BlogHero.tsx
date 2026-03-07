// Blog article hero image with title overlay

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Calendar, ChevronRight } from 'lucide-react';
import type { BlogPost } from '../../types/blog';
import { BLOG_CATEGORIES } from '../../data/blog';

interface BlogHeroProps {
  post: BlogPost;
}

const BlogHero: React.FC<BlogHeroProps> = ({ post }) => {
  const { t } = useTranslation();
  const categoryInfo = BLOG_CATEGORIES[post.category];
  const formattedDate = new Date(post.publishedDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="relative">
      {/* Hero Image */}
      <div className="relative h-[300px] sm:h-[400px] lg:h-[480px] overflow-hidden">
        <img
          src={post.heroImage.src}
          alt={post.heroImage.alt}
          className="w-full h-full object-cover"
          width={1200}
          height={800}
          onError={e => {
            const img = e.target as HTMLImageElement;
            img.onerror = null;
            img.src = '/images/blog/fallback-hero.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-1.5 text-xs text-white/80 mb-3">
              <Link to="/" className="hover:text-white transition-colors">
                {t('blog.home')}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/guides" className="hover:text-white transition-colors">
                {t('blog.guides')}
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/60 truncate">{categoryInfo.name}</span>
            </nav>

            {/* Category Badge */}
            <span className="inline-block px-2.5 py-1 bg-primary-500/90 text-white text-xs font-display font-semibold rounded-full mb-3">
              {categoryInfo.name}
            </span>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-white leading-tight mb-3">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {t('blog.minuteRead', { min: post.readingTime })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Credit */}
      {post.heroImage.credit && (
        <div className="bg-neutral-100 px-4 py-1.5 text-xs text-neutral-500 text-right">
          {t('blog.photoCredit', { credit: post.heroImage.credit })}
        </div>
      )}
    </div>
  );
};

export default BlogHero;
