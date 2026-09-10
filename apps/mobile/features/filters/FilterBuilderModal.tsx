import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { FilterCondition, FilterGroup, FilterOperator, LogicalOperator } from '@relay-ai/types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useFilterBuilderStore } from '../../store/useFilterBuilderStore';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

interface FilterBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
}

const FIELD_OPTIONS = [
  { id: 'channel', label: 'Channel', operators: ['eq', 'neq', 'in'], type: 'enum', values: ['sms', 'whatsapp', 'email', 'webchat'] },
  { id: 'lead_status', label: 'Lead Stage', operators: ['eq', 'neq', 'in'], type: 'enum', values: ['new', 'contacted', 'qualified', 'demo', 'won', 'lost'] },
  { id: 'sentiment', label: 'Sentiment', operators: ['eq', 'neq'], type: 'enum', values: ['positive', 'neutral', 'negative'] },
  { id: 'priority', label: 'Priority', operators: ['eq', 'neq'], type: 'enum', values: ['urgent', 'high', 'normal', 'low'] },
  { id: 'lead_score', label: 'Lead Score', operators: ['gt', 'lt', 'eq'], type: 'number' },
  { id: 'customer_name', label: 'Customer Name', operators: ['contains', 'eq'], type: 'text' },
];

export const FilterBuilderModal: React.FC<FilterBuilderModalProps> = ({
  visible,
  onClose,
  onApply,
}) => {
  const {
    rootGroup,
    setOperator,
    addCondition,
    updateCondition,
    removeCondition,
    addGroup,
    removeGroup,
    resetFilter,
    applyFilter,
    validateAST,
  } = useFilterBuilderStore();

  const { showToast } = useToast();
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validation = validateAST();

  const handleApply = () => {
    if (!validation.isValid) {
      showToast(validation.errors[0] || 'Please resolve filter errors', 'error');
      return;
    }
    applyFilter();
    onApply();
    onClose();
  };

  const handleSaveFilter = async () => {
    if (!saveName.trim()) {
      showToast('Please enter a filter name', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/filters', {
        name: saveName.trim(),
        ast: rootGroup,
      });
      showToast(`Filter "${saveName}" saved successfully!`, 'success');
      setShowSaveInput(false);
      setSaveName('');
    } catch (e: any) {
      showToast(e.message || 'Failed to save filter', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCondition = (cond: FilterCondition, isOnly: boolean) => {
    const fieldDef = FIELD_OPTIONS.find((f) => f.id === cond.field) || FIELD_OPTIONS[0];

    return (
      <View key={cond.id} style={styles.conditionRow}>
        {/* Field Selector */}
        <View style={styles.fieldSelector}>
          <Text style={styles.controlLabel}>FIELD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldScroll}>
            {FIELD_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  const defaultOp = f.operators[0] as FilterOperator;
                  const defaultVal = f.type === 'enum' ? f.values![0] : (f.type === 'number' ? 50 : '');
                  updateCondition(cond.id, { field: f.id, operator: defaultOp, value: defaultVal });
                }}
                style={[
                  styles.selectorChip,
                  cond.field === f.id && styles.selectorChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.selectorChipText,
                    cond.field === f.id && styles.selectorChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Operator Selector */}
        <View style={styles.operatorSelector}>
          <Text style={styles.controlLabel}>OPERATOR</Text>
          <View style={styles.opRow}>
            {fieldDef.operators.map((op) => (
              <TouchableOpacity
                key={op}
                onPress={() => updateCondition(cond.id, { operator: op as FilterOperator })}
                style={[
                  styles.opChip,
                  cond.operator === op && styles.opChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.opChipText,
                    cond.operator === op && styles.opChipTextActive,
                  ]}
                >
                  {op.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dynamic Value Selector */}
        <View style={styles.valueSelector}>
          <Text style={styles.controlLabel}>VALUE</Text>
          {fieldDef.type === 'enum' && fieldDef.values ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldScroll}>
              {fieldDef.values.map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => updateCondition(cond.id, { value: v })}
                  style={[
                    styles.valChip,
                    cond.value === v && styles.valChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.valChipText,
                      cond.value === v && styles.valChipTextActive,
                    ]}
                  >
                    {v.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <RNTextInput
              style={styles.valInput}
              value={String(cond.value || '')}
              onChangeText={(txt) =>
                updateCondition(cond.id, {
                  value: fieldDef.type === 'number' ? (parseInt(txt, 10) || 0) : txt,
                })
              }
              placeholder={fieldDef.type === 'number' ? 'e.g. 75' : 'Search keyword...'}
              placeholderTextColor={COLORS.textSubtle}
              keyboardType={fieldDef.type === 'number' ? 'numeric' : 'default'}
            />
          )}
        </View>

        {/* Delete condition button */}
        {!isOnly ? (
          <TouchableOpacity
            onPress={() => removeCondition(cond.id)}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderGroup = (group: FilterGroup, isRoot: boolean = false) => {
    return (
      <View key={group.id} style={[styles.groupCard, !isRoot && styles.nestedGroup]}>
        {/* Group Header: Operator toggle (AND / OR) */}
        <View style={styles.groupHeader}>
          <View style={styles.opToggle}>
            <TouchableOpacity
              onPress={() => setOperator(group.id, 'AND')}
              style={[styles.toggleBtn, group.operator === 'AND' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, group.operator === 'AND' && styles.toggleTextActive]}>
                AND
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setOperator(group.id, 'OR')}
              style={[styles.toggleBtn, group.operator === 'OR' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, group.operator === 'OR' && styles.toggleTextActive]}>
                OR
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.groupTitle}>
            {group.operator === 'AND'
              ? 'Match ALL of the following rules:'
              : 'Match ANY of the following rules:'}
          </Text>

          {!isRoot ? (
            <TouchableOpacity
              onPress={() => removeGroup(group.id)}
              style={styles.removeGroupBtn}
            >
              <Text style={styles.removeGroupText}>Remove Group</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Conditions and nested groups */}
        <View style={styles.groupContent}>
          {group.conditions.map((child) => {
            if ('conditions' in child) {
              return renderGroup(child as FilterGroup, false);
            }
            return renderCondition(child as FilterCondition, group.conditions.length === 1);
          })}
        </View>

        {/* Group Actions: Add Condition / Add Nested Group */}
        <View style={styles.groupActions}>
          <Button
            title="+ Add Condition"
            variant="outline"
            size="sm"
            onPress={() => addCondition(group.id)}
          />
          {isRoot ? (
            <Button
              title="+ Add Nested Group"
              variant="ghost"
              size="sm"
              onPress={() => addGroup(group.id)}
            />
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Advanced Filter Builder (SQL AST)">
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* SQL AST explanation badge */}
        <View style={styles.astInfoBanner}>
          <Text style={styles.astInfoTitle}>⚡ Strongly Typed AST Filter</Text>
          <Text style={styles.astInfoDesc}>
            Construct compound WHERE conditions with boolean operator precedence. Safely compiled to parameterized database queries.
          </Text>
        </View>

        {/* Render the full recursive Filter AST tree */}
        {renderGroup(rootGroup, true)}

        {/* Validation Errors */}
        {!validation.isValid ? (
          <View style={styles.errorBox}>
            {validation.errors.map((err, i) => (
              <Text key={i} style={styles.errorText}>
                ⚠️ {err}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Save Named Filter Section */}
        {showSaveInput ? (
          <View style={styles.saveSection}>
            <RNTextInput
              style={styles.saveInput}
              placeholder="Filter Preset Name (e.g., Hot WhatsApp Leads)"
              placeholderTextColor={COLORS.textSubtle}
              value={saveName}
              onChangeText={setSaveName}
            />
            <Button
              title="Save Preset"
              variant="primary"
              size="sm"
              loading={isSaving}
              onPress={handleSaveFilter}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Footer controls */}
      <View style={styles.modalFooter}>
        <Button
          title="Reset"
          variant="ghost"
          size="sm"
          onPress={resetFilter}
        />
        {!showSaveInput ? (
          <Button
            title="Save Filter"
            variant="outline"
            size="sm"
            onPress={() => setShowSaveInput(true)}
          />
        ) : null}
        <Button
          title="Apply Filter"
          variant="accent"
          size="md"
          onPress={handleApply}
          style={styles.applyBtn}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingBottom: SPACING.md,
  },
  astInfoBanner: {
    backgroundColor: '#FFF7ED', // Orange 50
    borderWidth: 1,
    borderColor: '#FED7AA', // Orange 200
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  astInfoTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#C2410C', // Orange 700
    marginBottom: 2,
  },
  astInfoDesc: {
    fontSize: 11,
    color: '#9A3412', // Orange 800
    lineHeight: 15,
  },
  groupCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  nestedGroup: {
    backgroundColor: '#FAFAFA',
    borderColor: '#D4D4D8',
    marginLeft: SPACING.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  opToggle: {
    flexDirection: 'row',
    backgroundColor: '#E4E4E7',
    borderRadius: RADIUS.md,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.accent, // Radiant Orange
  },
  toggleText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  groupTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  removeGroupBtn: {
    marginLeft: 'auto',
  },
  removeGroupText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  groupContent: {
    gap: SPACING.sm,
  },
  conditionRow: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
    position: 'relative',
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textSubtle,
    marginBottom: 2,
  },
  fieldSelector: {
    marginBottom: 4,
  },
  fieldScroll: {
    flexDirection: 'row',
  },
  selectorChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    marginRight: 4,
  },
  selectorChipActive: {
    backgroundColor: COLORS.accent, // Radiant Orange
  },
  selectorChipText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  selectorChipTextActive: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  operatorSelector: {
    marginBottom: 4,
  },
  opRow: {
    flexDirection: 'row',
    gap: 4,
  },
  opChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F4F4F5',
  },
  opChipActive: {
    backgroundColor: '#18181B', // Charcoal
  },
  opChipText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
  },
  opChipTextActive: {
    color: '#FFFFFF',
  },
  valueSelector: {
    marginTop: 2,
  },
  valChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F4F4F5',
    marginRight: 4,
  },
  valChipActive: {
    backgroundColor: COLORS.accent, // Radiant Orange
  },
  valChipText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  valChipTextActive: {
    color: '#FFFFFF',
  },
  valInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    fontSize: 12,
    color: COLORS.text,
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 8,
    padding: 2,
  },
  removeIcon: {
    fontSize: 12,
    color: COLORS.textSubtle,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    lineHeight: 16,
  },
  saveSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
  },
  saveInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    fontSize: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  applyBtn: {
    minWidth: 120,
  },
});
