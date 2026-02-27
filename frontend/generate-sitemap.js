const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');

// Define your routes
const links = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/reviews', changefreq: 'weekly', priority: 0.8 },
  { url: '/services', changefreq: 'weekly', priority: 0.8 },
  { url: '/about', changefreq: 'monthly', priority: 0.5 },
  { url: '/contact', changefreq: 'monthly', priority: 0.5 },
  { url: '/write-review', changefreq: 'weekly', priority: 0.7 },
  { url: '/settings', changefreq: 'weekly', priority: 0.6 },
];

// Make sure the `dist` folder exists
const fs = require('fs');
const distPath = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath);
}

// Create the sitemap stream
const sitemap = new SitemapStream({ hostname: 'https://sevanow.biz' });

// Pipe to a file
const writeStream = createWriteStream(path.join(distPath, 'sitemap.xml'));
sitemap.pipe(writeStream);

// Write all links
links.forEach(link => sitemap.write(link));

// Close the stream
sitemap.end();

// Wait for writing to finish
streamToPromise(sitemap)
  .then(() => console.log('✅ Sitemap generated successfully!'))
  .catch(err => console.error('❌ Error generating sitemap:', err));
