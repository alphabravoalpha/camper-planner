// Inline call-to-action block linking to the planner

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface BlogCTAProps {
  text?: string;
}

const BlogCTA: React.FC<BlogCTAProps> = ({ text = 'Ready to plan this route?' }) => {
  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 my-8 text-center">
      <p className="text-primary-900 font-display font-semibold mb-3">{text}</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-display font-semibold text-sm transition-colors"
      >
        Open the Trip Planner
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default BlogCTA;
