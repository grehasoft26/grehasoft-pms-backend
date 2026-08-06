import { SchemaType } from '@prisma/client';

export function buildSchemaJsonLd(type: SchemaType, data: Record<string, any>): string {
  const base: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  switch (type) {
    case 'ORGANIZATION':
      base.name = data.name || 'Grehasoft Enterprise';
      base.url = data.url || 'https://grehasoft.com';
      base.logo = data.logo || 'https://grehasoft.com/logo.png';
      break;

    case 'FAQ':
      base.mainEntity = (data.questions || []).map((q: any) => ({
        '@type': 'Question',
        'name': q.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': q.answer,
        },
      }));
      break;

    case 'PRODUCT':
      base.name = data.name || 'Enterprise PMS Software';
      base.description = data.description || 'SaaS Project management suite';
      base.offers = {
        '@type': 'Offer',
        'price': data.price || '99.00',
        'priceCurrency': data.currency || 'USD',
      };
      break;

    case 'LOCAL_BUSINESS':
      base.name = data.name || 'Grehasoft Corporate Office';
      base.address = {
        '@type': 'PostalAddress',
        'streetAddress': data.street || '101 Corporate Way',
        'addressLocality': data.city || 'Bangalore',
        'addressRegion': data.state || 'KA',
        'postalCode': data.zip || '560001',
      };
      break;

    default:
      base.name = data.name || 'Website Generic';
      break;
  }

  return JSON.stringify(base, null, 2);
}
