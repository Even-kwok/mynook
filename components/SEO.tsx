import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title = 'MyNook.AI - AI-Powered Interior Design & Home Renovation',
  description = 'Transform your space with AI-powered interior design. Generate stunning room designs, exterior makeovers, and home renovation ideas in seconds. Free templates and professional results.',
  keywords = 'AI interior design, home design, room design, interior decoration, AI home renovation, virtual staging, room planner, design ideas',
  image = 'https://mynook.ai/og-image.jpg',
  url = 'https://mynook.ai',
  type = 'website',
  noindex = false,
}) => {
  const fullTitle = title.includes('MyNook') ? title : `${title} | MyNook.AI`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="MyNook.AI" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO Tags */}
      <link rel="canonical" href={url} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="author" content="MyNook.AI" />
    </Helmet>
  );
};

