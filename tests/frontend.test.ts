import { analytics } from '../apps/mobile/services/analytics';
import { useFilterBuilderStore } from '../apps/mobile/store/useFilterBuilderStore';
import { useOfflineStore } from '../apps/mobile/store/useOfflineStore';

describe('Frontend Architecture Tests', () => {
  describe('Zero-PII Analytics Sanitizer', () => {
    it('strips customer message body, emails, and phone numbers from telemetry payloads', () => {
      const rawPayload = {
        conversation_id: 101,
        channel: 'sms',
        lead_stage: 'qualified',
        content: 'Hey, my credit card is 4111 2222 and my email is test@domain.com',
        body: 'Confidential client text',
        phone: '+1 555 123 4567',
        confidence: 0.94,
        response_time_ms: 18400,
      };

      const sanitized = analytics.sanitizePayload(rawPayload);

      expect(sanitized.conversation_id).toBe(101);
      expect(sanitized.channel).toBe('sms');
      expect(sanitized.lead_stage).toBe('qualified');
      expect(sanitized.confidence).toBe(0.94);
      expect(sanitized.response_time_ms).toBe(18400);

      // PII dropped
      expect(sanitized.content).toBeUndefined();
      expect(sanitized.body).toBeUndefined();
      expect(sanitized.phone).toBeUndefined();
    });

    it('drops strings longer than 64 characters to avoid accidental customer message leakage', () => {
      const longString = 'a'.repeat(65);
      const shortString = 'valid_enum_value';

      const sanitized = analytics.sanitizePayload({
        long_field: longString,
        category: shortString,
      });

      expect(sanitized.long_field).toBeUndefined();
      expect(sanitized.category).toBe(shortString);
    });
  });

  describe('SQL-Style Filter AST Builder Store', () => {
    it('builds a valid initial root group with default condition', () => {
      const store = useFilterBuilderStore.getState();
      store.resetFilter();
      const state = useFilterBuilderStore.getState();

      expect(state.rootGroup.operator).toBe('AND');
      expect(state.rootGroup.conditions.length).toBe(1);

      const validation = state.validateAST();
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('adds conditions and allows updating field, operator, and dynamic values', () => {
      const store = useFilterBuilderStore.getState();
      store.resetFilter();
      store.addCondition('root');

      let state = useFilterBuilderStore.getState();
      expect(state.rootGroup.conditions.length).toBe(2);

      const cond = state.rootGroup.conditions[1] as any;
      store.updateCondition(cond.id, {
        field: 'lead_status',
        operator: 'eq',
        value: 'qualified',
      });

      state = useFilterBuilderStore.getState();
      const updated = state.rootGroup.conditions.find((c: any) => c.id === cond.id) as any;
      expect(updated.field).toBe('lead_status');
      expect(updated.value).toBe('qualified');
    });

    it('flags invalid AST if condition value is empty', () => {
      useFilterBuilderStore.getState().resetFilter();
      const state = useFilterBuilderStore.getState();
      const cond = state.rootGroup.conditions[0] as any;
      useFilterBuilderStore.getState().updateCondition(cond.id, { value: '' });

      const validation = useFilterBuilderStore.getState().validateAST();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Offline Queue Manager', () => {
    it('queues messages locally when offline with temporary status waiting_to_send', () => {
      const offlineStore = useOfflineStore.getState();
      offlineStore.setIsOnline(false);

      const queued = offlineStore.enqueueMessage(42, 'Offline drafted response');
      expect(queued.status).toBe('waiting_to_send');
      expect(queued.conversationId).toBe(42);
      expect(queued.content).toBe('Offline drafted response');

      const state = useOfflineStore.getState();
      expect(state.queuedMessages.some((m) => m.tempId === queued.tempId)).toBe(true);
    });
  });
});
