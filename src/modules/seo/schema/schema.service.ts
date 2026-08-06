import { Injectable } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';
import { SchemaType } from '@prisma/client';
import { buildSchemaJsonLd } from '../utils/schema-builder.helper';

@Injectable()
export class SchemaService {
  constructor(private readonly repository: SeoRepository) {}

  async generateAndSaveSchema(
    tenantId: string,
    seoProjectId: string,
    urlPath: string,
    type: SchemaType,
    data: Record<string, any>
  ) {
    const jsonLdContent = buildSchemaJsonLd(type, data);
    const schema = await this.repository.upsertSchemaMarkup(tenantId, seoProjectId, urlPath, type, jsonLdContent);
    await this.repository.logAudit(tenantId, 'Generate Schema Markup', `Schema JSON-LD of type ${type} generated.`);
    return schema;
  }

  async getSchemas(tenantId: string, seoProjectId: string) {
    return this.repository.findSchemaMarkups(tenantId, seoProjectId);
  }
}
