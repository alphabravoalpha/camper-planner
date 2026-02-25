// Renders individual blog content sections

import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';
import type { BlogSection } from '../../types/blog';

interface BlogSectionRendererProps {
  section: BlogSection;
  index: number;
}

const BlogSectionRenderer: React.FC<BlogSectionRendererProps> = ({ section, index }) => {
  switch (section.type) {
    case 'heading': {
      const id =
        section.content
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') ?? `section-${index}`;
      if (section.level === 3) {
        return (
          <h3 id={id} className="text-xl font-display font-bold text-neutral-900 mt-8 mb-3">
            {section.content}
          </h3>
        );
      }
      return (
        <h2 id={id} className="text-2xl font-display font-bold text-neutral-900 mt-10 mb-4">
          {section.content}
        </h2>
      );
    }

    case 'paragraph':
      return (
        <p
          className="text-neutral-700 leading-relaxed mb-4"
          dangerouslySetInnerHTML={{ __html: section.content ?? '' }}
        />
      );

    case 'list':
      return (
        <ul className="space-y-2 mb-6 ml-1">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-neutral-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2.5 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      );

    case 'tip':
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p
              className="text-green-800 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.content ?? '' }}
            />
          </div>
        </div>
      );

    case 'warning':
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p
              className="text-amber-800 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.content ?? '' }}
            />
          </div>
        </div>
      );

    case 'image':
      if (!section.image) return null;
      return (
        <figure className="my-8">
          <img
            src={section.image.src}
            alt={section.image.alt}
            className="w-full rounded-lg shadow-soft"
            loading="lazy"
            onError={e => {
              const img = e.target as HTMLImageElement;
              img.onerror = null;
              img.src = '/images/blog/fallback-hero.jpg';
            }}
          />
          <figcaption className="mt-2 text-xs text-neutral-500 text-center">
            {section.image.alt}
            {section.image.credit && (
              <>
                {' — Photo by '}
                <a
                  href={section.image.creditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-neutral-700"
                >
                  {section.image.credit}
                </a>
              </>
            )}
          </figcaption>
        </figure>
      );

    case 'cta':
      return (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 my-8 text-center">
          <p className="text-primary-900 font-display font-semibold mb-3">
            {section.content ?? 'Ready to plan this route?'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-display font-semibold text-sm transition-colors"
          >
            Open the Trip Planner
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="border-l-4 border-primary-300 pl-4 py-1 my-6 italic text-neutral-600">
          <p dangerouslySetInnerHTML={{ __html: section.content ?? '' }} />
        </blockquote>
      );

    default:
      return null;
  }
};

export default BlogSectionRenderer;
