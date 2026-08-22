import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
  FEATURE_REGISTRY,
  CompanyFeatureView,
  FeatureTreeNode,
} from './features.registry';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCompanies() {
    return this.prisma.company.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getCompanyFeatures(companyId: string): Promise<CompanyFeatureView[]> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const dbFeatures = await this.prisma.companyFeature.findMany({
      where: { companyId },
    });

    const featureMap = new Map(
      dbFeatures.map((f) => [f.featureKey, f.isEnabled]),
    );

    return Object.keys(FEATURE_REGISTRY).map((key) => {
      const def = FEATURE_REGISTRY[key];
      const explicitVal = featureMap.get(key);
      const isEnabled = explicitVal !== undefined ? explicitVal : true;
      return {
        ...def,
        isEnabled,
        isExplicitlySet: explicitVal !== undefined,
      };
    });
  }

  async getCompanyFeaturesTree(companyId: string): Promise<FeatureTreeNode[]> {
    const features = await this.getCompanyFeatures(companyId);

    const rootNodes: FeatureTreeNode[] = [];
    const childrenMap = new Map<string, FeatureTreeNode[]>();

    for (const f of features) {
      const node: FeatureTreeNode = {
        key: f.key,
        label: f.label,
        isEnabled: f.isEnabled,
        children: [],
      };

      if (!f.parentKey) {
        rootNodes.push(node);
      } else {
        if (!childrenMap.has(f.parentKey)) {
          childrenMap.set(f.parentKey, []);
        }
        childrenMap.get(f.parentKey)!.push(node);
      }
    }

    const connectChildren = (nodes: FeatureTreeNode[]) => {
      for (const node of nodes) {
        const children = childrenMap.get(node.key);
        if (children) {
          node.children = children;
          connectChildren(children);
        }
      }
    };

    connectChildren(rootNodes);
    return rootNodes;
  }

  async updateFeatureState(
    companyId: string,
    featureKey: string,
    isEnabled: boolean,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!FEATURE_REGISTRY[featureKey]) {
      throw new NotFoundException('Invalid feature key');
    }

    const feature = await this.prisma.companyFeature.upsert({
      where: {
        uq_company_feature: {
          companyId,
          featureKey,
        },
      },
      update: { isEnabled },
      create: {
        companyId,
        featureKey,
        isEnabled,
      },
    });

    return {
      message: `Feature '${featureKey}' updated successfully`,
      data: feature,
    };
  }

  async isFeatureEnabled(
    companyId: string,
    featureKey: string,
  ): Promise<boolean> {
    const def = FEATURE_REGISTRY[featureKey];
    if (!def) {
      return true;
    }

    if (def.parentKey) {
      const isParentEnabled = await this.isFeatureEnabled(
        companyId,
        def.parentKey,
      );
      if (!isParentEnabled) {
        return false;
      }
    }

    const record = await this.prisma.companyFeature.findUnique({
      where: {
        uq_company_feature: {
          companyId,
          featureKey,
        },
      },
    });

    if (record) {
      return record.isEnabled;
    }

    return true;
  }
}
