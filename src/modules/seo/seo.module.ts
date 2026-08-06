import { Module } from '@nestjs/common';
import { SeoRepository } from './repositories/seo.repository';
import { ProjectsService } from './projects/projects.service';
import { KeywordsService } from './keywords/keywords.service';
import { PagesService } from './pages/pages.service';
import { AuditsService } from './audits/audits.service';
import { RankingsService } from './rankings/rankings.service';
import { BacklinksService } from './backlinks/backlinks.service';
import { CompetitorsService } from './competitors/competitors.service';
import { ContentService } from './content/content.service';
import { SchemaService } from './schema/schema.service';
import { SitemapService } from './sitemap/sitemap.service';
import { RobotsService } from './robots/robots.service';
import { RedirectsService } from './redirects/redirects.service';
import { AnalyticsService } from './analytics/analytics.service';
import { DashboardService } from './dashboard/dashboard.service';
import { ReportsService } from './reports/reports.service';

import { ProjectsController } from './controllers/projects.controller';
import { KeywordsController } from './controllers/keywords.controller';
import { PagesController } from './controllers/pages.controller';
import { AuditsController } from './controllers/audits.controller';
import { RankingsController } from './controllers/rankings.controller';
import { BacklinksController } from './controllers/backlinks.controller';
import { CompetitorsController } from './controllers/competitors.controller';
import { RedirectsController } from './controllers/redirects.controller';
import { SitemapsController } from './controllers/sitemaps.controller';
import { RobotsController } from './controllers/robots.controller';
import { SchemaController } from './controllers/schema.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { DashboardController } from './controllers/dashboard.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    ProjectsController,
    KeywordsController,
    PagesController,
    AuditsController,
    RankingsController,
    BacklinksController,
    CompetitorsController,
    RedirectsController,
    SitemapsController,
    RobotsController,
    SchemaController,
    AnalyticsController,
    DashboardController,
  ],
  providers: [
    SeoRepository,
    ProjectsService,
    KeywordsService,
    PagesService,
    AuditsService,
    RankingsService,
    BacklinksService,
    CompetitorsService,
    ContentService,
    SchemaService,
    SitemapService,
    RobotsService,
    RedirectsService,
    AnalyticsService,
    DashboardService,
    ReportsService,
  ],
  exports: [
    ProjectsService,
    KeywordsService,
    AuditsService,
    RankingsService,
    BacklinksService,
    SchemaService,
    SitemapService,
    RedirectsService,
    AnalyticsService,
    DashboardService,
  ],
})
export class SeoModule {}
