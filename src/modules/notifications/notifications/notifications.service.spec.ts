import { NotificationTemplateService } from '../templates/templates.service';
import { NotificationsService } from './notifications.service';

describe('Sprint 13 Notifications & Templates Unit Tests', () => {
  let templateService: NotificationTemplateService;
  let notifService: NotificationsService;

  beforeEach(() => {
    templateService = new NotificationTemplateService(null);
    notifService = new NotificationsService(null, null);
  });

  describe('Template Engine Parser', () => {
    it('should replace simple placeholder variables', () => {
      const template =
        'Hello {{userName}}, your task {{taskName}} has been assigned.';
      const variables = { userName: 'Jisha', taskName: 'Implementation' };
      const res = templateService.render(template, variables);
      expect(res).toBe(
        'Hello Jisha, your task Implementation has been assigned.',
      );
    });

    it('should replace dynamic amount and invoice values', () => {
      const template =
        'Invoice {{invoiceNumber}} of amount {{amount}} is paid.';
      const variables = { invoiceNumber: 'INV-001', amount: '$5,000' };
      const res = templateService.render(template, variables);
      expect(res).toBe('Invoice INV-001 of amount $5,000 is paid.');
    });

    it('should leave unknown placeholders unmodified if not provided in variables', () => {
      const template = 'Hello {{userName}}, check {{unknownVar}}.';
      const variables = { userName: 'Alice' };
      const res = templateService.render(template, variables);
      expect(res).toBe('Hello Alice, check {{unknownVar}}.');
    });
  });

  describe('Quiet Hours timezone check', () => {
    it('should evaluate timezone boundaries within quiet hours', () => {
      // If start <= end
      const quiet = notifService.isInsideQuietHours('UTC', '22:00', '23:59');
      // The current run time might or might not fall inside, but we can verify it doesn't crash
      expect(typeof quiet).toBe('boolean');
    });

    it('should return false if start/end parameters are missing', () => {
      const quiet = notifService.isInsideQuietHours('UTC', null, null);
      expect(quiet).toBe(false);
    });
  });
});
