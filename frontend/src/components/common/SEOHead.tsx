import React, { useEffect } from 'react';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const DEFAULT_TITLE = 'MadK Store - Thiết bị công nghệ chính hãng & Trải nghiệm 3D';
const DEFAULT_DESCRIPTION =
  'MadK Store phân phối điện thoại, laptop gaming, linh kiện PC và phụ kiện công nghệ chính hãng với trải nghiệm tương tác mô hình 3D trực quan.';
const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80';
const SITE_NAME = 'MadK Store';
const DOMAIN = 'https://madk.store';

function setMetaTag(attr: 'name' | 'property', attrValue: string, content: string) {
  let element = document.querySelector(`meta[${attr}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
}) => {
  useEffect(() => {
    // 1. Page Title
    const formattedTitle = title
      ? title.includes(SITE_NAME)
        ? title
        : `${title} | ${SITE_NAME}`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description);
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 3. Canonical URL
    const resolvedCanonical =
      canonicalUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : DOMAIN);
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', resolvedCanonical);

    // 4. Open Graph Tags
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:title', ogTitle || formattedTitle);
    setMetaTag('property', 'og:description', ogDescription || description);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', resolvedCanonical);
    setMetaTag('property', 'og:locale', 'vi_VN');

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', twitterCard);
    setMetaTag('name', 'twitter:title', ogTitle || formattedTitle);
    setMetaTag('name', 'twitter:description', ogDescription || description);
    setMetaTag('name', 'twitter:image', ogImage);

    // 6. Schema.org JSON-LD Structured Data
    const SCRIPT_ID = 'seo-structured-data';
    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      // Optional cleanup on unmount
      const scriptToRemove = document.getElementById(SCRIPT_ID);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [
    title,
    description,
    keywords,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    twitterCard,
    structuredData,
  ]);

  return null;
};

// ──── Schema.org Builders ────

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MadK Store',
    url: DOMAIN,
    logo: `${DOMAIN}/favicon.svg`,
    description: DEFAULT_DESCRIPTION,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+84-1900-8888',
      contactType: 'customer service',
      areaServed: 'VN',
      availableLanguage: ['Vietnamese', 'English'],
    },
    sameAs: [
      'https://www.facebook.com/madkstore',
      'https://www.instagram.com/madkstore',
      'https://youtube.com/@madkstore',
    ],
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MadK Store',
    url: DOMAIN,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${DOMAIN}/categories?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${DOMAIN}${item.url}`,
    })),
  };
}

export interface ProductSchemaInput {
  name: string;
  description?: string;
  images: string[];
  sku: string;
  brandName?: string;
  categoryName?: string;
  price: number;
  inStock: boolean;
  slug: string;
  ratingValue?: number;
  reviewCount?: number;
}

export function buildProductSchema(input: ProductSchemaInput) {
  const canonicalUrl = `${DOMAIN}/products/${input.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    image: input.images.length > 0 ? input.images : [DEFAULT_OG_IMAGE],
    description: input.description || DEFAULT_DESCRIPTION,
    sku: input.sku,
    mpn: input.sku,
    brand: {
      '@type': 'Brand',
      name: input.brandName || 'MadK Store',
    },
    category: input.categoryName,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'VND',
      price: input.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: input.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'MadK Store',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (input.ratingValue || 4.9).toString(),
      reviewCount: (input.reviewCount || 128).toString(),
      bestRating: '5',
      worstRating: '1',
    },
  };
}

export default SEOHead;
