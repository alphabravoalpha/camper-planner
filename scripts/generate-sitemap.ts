// Generate sitemap.xml from blog post data
// Run with: npx tsx scripts/generate-sitemap.ts

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://camperplanning.com';

// Static pages with their priorities and change frequencies
const staticPages = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/guides', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/help', changefreq: 'monthly', priority: '0.7' },
  { path: '/support', changefreq: 'monthly', priority: '0.6' },
  { path: '/feedback', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/affiliate-disclosure', changefreq: 'yearly', priority: '0.3' },
];

// Read blog post slugs from the data directory
function getBlogSlugs(): string[] {
  const blogDir = path.join(__dirname, '..', 'src', 'data', 'blog');
  const files = fs.readdirSync(blogDir);
  return files
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.replace('.ts', ''));
}

function generateSitemap(): string {
  const blogSlugs = getBlogSlugs();
  const today = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static pages
  for (const page of staticPages) {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${page.path}</loc>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  // Blog posts
  for (const slug of blogSlugs) {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/guides/${slug}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return xml;
}

// Write sitemap
const sitemap = generateSitemap();
const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, sitemap, 'utf-8');

const blogCount = getBlogSlugs().length;
console.log(`Sitemap generated with ${staticPages.length + blogCount} URLs (${staticPages.length} static + ${blogCount} blog posts)`);
