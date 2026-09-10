import { create } from 'zustand';
import { FilterCondition, FilterGroup, FilterOperator, LogicalOperator } from '@relay-ai/types';

interface FilterBuilderState {
  rootGroup: FilterGroup;
  appliedAST: FilterGroup | null;
  activeFilterName: string | null;

  setOperator: (groupId: string, operator: LogicalOperator) => void;
  addCondition: (groupId: string) => void;
  updateCondition: (conditionId: string, updates: Partial<FilterCondition>) => void;
  removeCondition: (conditionId: string) => void;
  addGroup: (parentGroupId: string) => void;
  removeGroup: (groupId: string) => void;
  resetFilter: () => void;
  loadAST: (ast: FilterGroup, name?: string) => void;
  applyFilter: () => void;
  clearAppliedFilter: () => void;
  validateAST: () => { isValid: boolean; errors: string[] };
}

const createDefaultCondition = (): FilterCondition => ({
  id: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  field: 'channel',
  operator: 'eq',
  value: 'sms',
});

const createInitialRoot = (): FilterGroup => ({
  id: 'root',
  operator: 'AND',
  conditions: [createDefaultCondition()],
});

export const useFilterBuilderStore = create<FilterBuilderState>((set, get) => ({
  rootGroup: createInitialRoot(),
  appliedAST: null,
  activeFilterName: null,

  setOperator: (groupId: string, operator: LogicalOperator) => {
    const updateGroupOp = (group: FilterGroup): FilterGroup => {
      if (group.id === groupId) {
        return { ...group, operator };
      }
      return {
        ...group,
        conditions: group.conditions.map((child) =>
          'conditions' in child ? updateGroupOp(child as FilterGroup) : child
        ),
      };
    };

    set((state) => ({ rootGroup: updateGroupOp(state.rootGroup) }));
  },

  addCondition: (groupId: string) => {
    const addCondToGroup = (group: FilterGroup): FilterGroup => {
      if (group.id === groupId) {
        return {
          ...group,
          conditions: [...group.conditions, createDefaultCondition()],
        };
      }
      return {
        ...group,
        conditions: group.conditions.map((child) =>
          'conditions' in child ? addCondToGroup(child as FilterGroup) : child
        ),
      };
    };

    set((state) => ({ rootGroup: addCondToGroup(state.rootGroup) }));
  },

  updateCondition: (conditionId: string, updates: Partial<FilterCondition>) => {
    const updateCondInGroup = (group: FilterGroup): FilterGroup => {
      return {
        ...group,
        conditions: group.conditions.map((child) => {
          if ('conditions' in child) {
            return updateCondInGroup(child as FilterGroup);
          }
          if (child.id === conditionId) {
            return { ...child, ...updates };
          }
          return child;
        }),
      };
    };

    set((state) => ({ rootGroup: updateCondInGroup(state.rootGroup) }));
  },

  removeCondition: (conditionId: string) => {
    const removeCondFromGroup = (group: FilterGroup): FilterGroup => {
      return {
        ...group,
        conditions: group.conditions
          .filter((child) => ('conditions' in child ? true : child.id !== conditionId))
          .map((child) => ('conditions' in child ? removeCondFromGroup(child as FilterGroup) : child)),
      };
    };

    set((state) => ({ rootGroup: removeCondFromGroup(state.rootGroup) }));
  },

  addGroup: (parentGroupId: string) => {
    const newGroup: FilterGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      operator: 'OR',
      conditions: [createDefaultCondition()],
    };

    const addGroupToParent = (group: FilterGroup): FilterGroup => {
      if (group.id === parentGroupId) {
        return {
          ...group,
          conditions: [...group.conditions, newGroup],
        };
      }
      return {
        ...group,
        conditions: group.conditions.map((child) =>
          'conditions' in child ? addGroupToParent(child as FilterGroup) : child
        ),
      };
    };

    set((state) => ({ rootGroup: addGroupToParent(state.rootGroup) }));
  },

  removeGroup: (groupId: string) => {
    if (groupId === 'root') return;
    const removeGroupNode = (group: FilterGroup): FilterGroup => {
      return {
        ...group,
        conditions: group.conditions
          .filter((child) => ('conditions' in child ? child.id !== groupId : true))
          .map((child) => ('conditions' in child ? removeGroupNode(child as FilterGroup) : child)),
      };
    };

    set((state) => ({ rootGroup: removeGroupNode(state.rootGroup) }));
  },

  resetFilter: () => {
    set({ rootGroup: createInitialRoot() });
  },

  loadAST: (ast: FilterGroup, name?: string) => {
    set({
      rootGroup: JSON.parse(JSON.stringify(ast)),
      activeFilterName: name || null,
    });
  },

  applyFilter: () => {
    const { rootGroup, validateAST } = get();
    const validation = validateAST();
    if (validation.isValid) {
      set({ appliedAST: JSON.parse(JSON.stringify(rootGroup)) });
    }
  },

  clearAppliedFilter: () => {
    set({ appliedAST: null, activeFilterName: null, rootGroup: createInitialRoot() });
  },

  validateAST: () => {
    const errors: string[] = [];
    const validateGroup = (group: FilterGroup) => {
      if (!group.conditions || group.conditions.length === 0) {
        errors.push(`Group ${group.id} has no conditions.`);
      }
      for (const child of group.conditions) {
        if ('conditions' in child) {
          validateGroup(child as FilterGroup);
        } else {
          const cond = child as FilterCondition;
          if (!cond.field) errors.push('Condition is missing field.');
          if (!cond.operator) errors.push('Condition is missing operator.');
          if (cond.value === undefined || cond.value === null || cond.value === '') {
            errors.push(`Field "${cond.field}" has an empty value.`);
          }
        }
      }
    };

    validateGroup(get().rootGroup);
    return {
      isValid: errors.length === 0,
      errors,
    };
  },
}));
