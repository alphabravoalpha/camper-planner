// Dynamic SEO meta tag management

import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedDate?: string;
  updatedDate?: string;
}

const DEFAULT_IMAGE = 'https://camperplanning.com/og-image.png';

const setMeta = (property: string, content: string) => {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement | null;
  }
  if (el) {
    el.setAttribute('content', content);
  } else {
    el = document.createElement('meta');
    if (
      property.startsWith('og:') ||
      property.startsWith('twitter:') ||
      property.startsWith('article:')
    ) {
      el.setAttribute('property', property);
    } else {
      el.setAttribute('name', property);
    }
    el.setAttribute('content', content);
    document.head.appendChild(el);
  }
};

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  url,
  image = DEFAULT_IMAGE,
  type = 'website',
  publishedDate,
  updatedDate,
}) => {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Update meta tags
    setMeta('description', description);
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:type', type);
    setMeta('og:image', image);
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    if (url) {
      setMeta('og:url', url);

      // Update canonical
      const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonical) {
        canonical.href = url;
      }
    }

    if (type === 'article' && publishedDate) {
      setMeta('article:published_time', publishedDate);
      if (updatedDate) {
        setMeta('article:modified_time', updatedDate);
      }
    }

    // Add Article JSON-LD for blog posts
    if (type === 'article') {
      const existingScript = document.querySelector('script[data-seo="article"]');
      if (existingScript) existingScript.remove();

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'article');
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title.split(' — ')[0],
        description,
        image,
        datePublished: publishedDate,
        dateModified: updatedDate || publishedDate,
        author: {
          '@type': 'Organization',
          name: 'CamperPlanning',
          url: 'https://camperplanning.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'CamperPlanning',
          url: 'https://camperplanning.com',
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
      });
      document.head.appendChild(script);

      return () => {
        script.remove();
      };
    }
  }, [title, description, url, image, type, publishedDate, updatedDate]);

  return null;
};

export default SEOHead;
