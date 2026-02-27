import React from 'react';
import logoSomaet from '../../../assets/Logo_somaet.png';

const SeoMeta = ({
  title = "SevaNow Reviews - Trusted Service Reviews",
  description = "Find authentic reviews for various services. Make informed decisions with SevaNow.",
  keywords = "reviews, services, ratings, feedback, customer reviews, service providers",
  canonical = "https://sevanow.com",
  ogImage = "/og-default.jpg",
  ogType = "website",
  twitterCard = "summary_large_image",
  children
}) => {
  const siteName = "SevaNow Reviews";
  const siteUrl = "https://sevanow.com";
  
  // Ensure title includes site name if not already
  const pageTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  
  // Default structured data
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": siteUrl,
    "description": description,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@sevanow" />
      <meta name="twitter:creator" content="@sevanow" />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#22c55e" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Favicon Links */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Preload Critical Resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(defaultStructuredData)
      }} />
      
      {/* Additional Structured Data for Reviews */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": siteName,
          "url": siteUrl,
          "logo": `${siteUrl}${logoSomaet}`,
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+855-968812310",
            "contactType": "customer service",
            "availableLanguage": ["English", "Khmer"]
          },
          "sameAs": [
            "https://facebook.com/sevanow",
            "https://twitter.com/sevanow",
            "https://instagram.com/sevanow"
          ]
        })
      }} />
      
      {/* Additional children meta tags */}
      {children}
    </>
  );
};

// Helper function for review-specific meta tags
export const generateReviewMeta = (reviewData) => {
  const {
    serviceName,
    rating,
    content,
    author,
    datePublished,
    serviceDescription
  } = reviewData;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Review",
          "itemReviewed": {
            "@type": "Service",
            "name": serviceName,
            "description": serviceDescription
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": rating.toString(),
            "bestRating": "5"
          },
          "author": {
            "@type": "Person",
            "name": author
          },
          "datePublished": datePublished,
          "reviewBody": content,
          "publisher": {
            "@type": "Organization",
            "name": "SevaNow Reviews"
          }
        })
      }} />
    </>
  );
};

// Helper function for breadcrumb structured data
export const generateBreadcrumbSchema = (breadcrumbs) => {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
          }))
        })
      }} />
    </>
  );
};

// Helper for FAQ structured data
export const generateFAQSchema = (faqs) => {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        })
      }} />
    </>
  );
};

export default SeoMeta;
