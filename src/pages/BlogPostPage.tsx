// Individual blog post page

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getPostBySlug } from '../data/blog';
import BlogArticle from '../components/blog/BlogArticle';
import SEOHead from '../components/seo/SEOHead';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/guides" replace />;
  }

  return (
    <>
      <SEOHead
        title={`${post.title} — European Camper Planner`}
        description={post.description}
        url={`https://camperplanning.com/guides/${post.slug}`}
        image={post.heroImage.src}
        type="article"
        publishedDate={post.publishedDate}
        updatedDate={post.updatedDate}
      />
      <BlogArticle post={post} />
    </>
  );
};

export default BlogPostPage;
