// Full blog article layout

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { BlogPost } from '../../types/blog';
import { getRelatedPosts } from '../../data/blog';
import BlogHero from './BlogHero';
import BlogSectionRenderer from './BlogSectionRenderer';
import BlogCard from './BlogCard';

interface BlogArticleProps {
  post: BlogPost;
}

const BlogArticle: React.FC<BlogArticleProps> = ({ post }) => {
  const related = getRelatedPosts(post, 3);

  // Extract headings for table of contents
  const headings = post.content
    .filter(s => s.type === 'heading' && s.level !== 3)
    .map(s => ({
      text: s.content ?? '',
      id:
        s.content
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') ?? '',
    }));

  return (
    <article>
      <BlogHero post={post} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back link */}
        <Link
          to="/guides"
          className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All Guides
        </Link>

        <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Description */}
            <p className="text-lg text-neutral-600 leading-relaxed mb-8 font-medium">
              {post.description}
            </p>

            {/* Content Sections */}
            {post.content.map((section, index) => (
              <BlogSectionRenderer key={index} section={section} index={index} />
            ))}

            {/* Tags */}
            <div className="mt-10 pt-6 border-t border-neutral-200">
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Table of Contents (desktop only) */}
          {headings.length > 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <h4 className="text-xs font-display font-bold text-neutral-500 uppercase tracking-wider mb-3">
                  Contents
                </h4>
                <nav className="space-y-1.5">
                  {headings.map(h => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="block text-sm text-neutral-500 hover:text-primary-600 transition-colors py-0.5"
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Related Posts */}
      {related.length > 0 && (
        <div className="bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-xl font-display font-bold text-neutral-900 mb-6">Related Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(p => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default BlogArticle;
