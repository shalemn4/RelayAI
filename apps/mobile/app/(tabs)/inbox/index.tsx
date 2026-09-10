import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Conversation, SavedFilter } from '@relay-ai/types';
import { api } from '../../../services/api';
import { ConversationCard } from '../../../features/inbox/ConversationCard';
import { FilterChips } from '../../../features/inbox/FilterChips';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { FilterBuilderModal } from '../../../features/filters/FilterBuilderModal';
import { useFilterBuilderStore } from '../../../store/useFilterBuilderStore';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../constants/theme';
import { analytics } from '../../../services/analytics';

export default function InboxScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const { appliedAST, activeFilterName, loadAST, clearAppliedFilter } = useFilterBuilderStore();

  // 1. Fetch saved filters for quick presets
  const { data: savedFilters } = useQuery<SavedFilter[]>({
    queryKey: ['saved-filters'],
    queryFn: async () => {
      const res = await api.get('/filters');
      return res.data;
    },
  });

  // 2. Fetch conversations with pagination, search, quick filter & applied AST
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['conversations', { search, quickFilter, appliedAST }],
    queryFn: async ({ pageParam = 0 }) => {
      const params: Record<string, any> = {
        cursor: pageParam,
        limit: 15,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (quickFilter === 'unread') params.status = 'all';
      else if (quickFilter === 'sms' || quickFilter === 'whatsapp') params.channel = quickFilter;
      else if (quickFilter !== 'all') params.status = quickFilter;

      if (appliedAST) {
        params.filter_ast = JSON.stringify(appliedAST);
      }

      const res = await api.get('/conversations', { params });
      return res.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.next_cursor ? parseInt(lastPage.next_cursor, 10) : undefined),
  });

  // Flatten all pages
  const allConversations: Conversation[] = useMemo(() => {
    if (!data?.pages) return [];
    let items = data.pages.flatMap((page) => page.items);
    if (quickFilter === 'unread') {
      items = items.filter((c) => c.unread_count > 0);
    }
    return items;
  }, [data, quickFilter]);

  const totalCount = data?.pages[0]?.total ?? 0;

  const handleConversationPress = (conversation: Conversation) => {
    analytics.track('conversation_opened', {
      conversation_id: conversation.id,
      channel: conversation.channel,
      status: conversation.status,
      sentiment: conversation.sentiment,
    });
    router.push(`/(tabs)/inbox/${conversation.id}`);
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationCard
      conversation={item}
      onPress={() => handleConversationPress(item)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Top Header: Title, Search & Filter Bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.headerTitle}>Unified Inbox</Text>
            <Text style={styles.headerSubtitle}>
              Multi-channel customer conversations & AI triage operations
            </Text>
          </View>

          {/* New Conversation or Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (allConversations.length > 0) {
                router.push(`/(tabs)/inbox/${allConversations[0].id}`);
              }
            }}
            style={styles.headerActionBtn}
          >
            <Text style={styles.headerActionText}>+ New Reply</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Trigger Bar */}
        <View style={styles.searchBarRow}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations by customer, company, or message..."
            style={styles.searchInput}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFilterModalOpen(true)}
            style={[
              styles.filterBtn,
              appliedAST && styles.filterBtnActive,
            ]}
          >
            <Text style={[styles.filterBtnText, appliedAST && styles.filterBtnTextActive]}>
              ⚡ {appliedAST ? 'Filter Active' : 'Filter (SQL)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Applied Filter AST Banner */}
        {appliedAST ? (
          <View style={styles.activeFilterBanner}>
            <Text style={styles.activeFilterText}>
              Filtering by: <Text style={styles.filterNameHighlight}>{activeFilterName || 'Custom SQL AST'}</Text>
            </Text>
            <TouchableOpacity onPress={clearAppliedFilter} style={styles.clearFilterBtn}>
              <Text style={styles.clearFilterText}>Clear Filter ✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Saved Presets */}
        {savedFilters && savedFilters.length > 0 ? (
          <View style={styles.savedFilterBar}>
            <Text style={styles.savedFilterLabel}>PRESETS:</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={savedFilters}
              keyExtractor={(f) => String(f.id)}
              renderItem={({ item: filter }) => (
                <TouchableOpacity
                  onPress={() => loadAST(filter.ast as any, filter.name)}
                  style={styles.savedPresetChip}
                >
                  <Text style={styles.savedPresetText}>{filter.name}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.savedPresetsContent}
            />
          </View>
        ) : null}

        {/* Quick Filter Chips */}
        <FilterChips
          activeFilter={quickFilter}
          onSelect={(filterId) => {
            setQuickFilter(filterId);
            analytics.track('inbox_filter_changed', { filter_type: filterId });
          }}
        />
      </View>

      {/* Subheader with Count */}
      <View style={styles.listSubheader}>
        <Text style={styles.listCountText}>
          Showing {allConversations.length} of {totalCount} conversations
        </Text>
      </View>

      {/* Conversation List */}
      {isLoading ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3, 4, 5].map((key) => (
            <View key={key} style={styles.skeletonCard}>
              <Skeleton width={40} height={40} borderRadius={20} />
              <View style={styles.skeletonContent}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} style={{ marginVertical: 6 }} />
                <Skeleton width="90%" height={14} />
              </View>
            </View>
          ))}
        </View>
      ) : isError ? (
        <ErrorState
          message={(error as any)?.message || 'Failed to load conversations'}
          onRetry={() => refetch()}
        />
      ) : allConversations.length === 0 ? (
        <EmptyState
          title="No conversations found"
          description={
            appliedAST
              ? 'No conversations match the current SQL AST criteria. Try adjusting or clearing your filter.'
              : 'There are no conversations matching your query.'
          }
          actionLabel={appliedAST ? 'Clear Filter' : 'Reset Search'}
          onAction={() => {
            clearAppliedFilter();
            setSearch('');
            setQuickFilter('all');
          }}
        />
      ) : (
        <FlatList
          data={allConversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={COLORS.accent}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={styles.loadingMoreText}>Loading more conversations...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Filter Builder Modal */}
      <FilterBuilderModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={() => refetch()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Off-white/light grey luxury canvas
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.title,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerActionBtn: {
    backgroundColor: COLORS.accent, // Warm Radiant Orange pill
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    borderRadius: RADIUS.full,
  },
  filterBtn: {
    backgroundColor: COLORS.primary, // Deep pitch black pill
    paddingHorizontal: 16,
    height: 42,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  filterBtnActive: {
    backgroundColor: COLORS.accent,
  },
  filterBtnText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
  },
  activeFilterBanner: {
    backgroundColor: COLORS.accentLight,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.accentBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeFilterText: {
    fontSize: 11,
    color: COLORS.accent,
  },
  filterNameHighlight: {
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  clearFilterBtn: {
    padding: 2,
  },
  clearFilterText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  savedFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  savedFilterLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textSubtle,
    marginRight: 8,
  },
  savedPresetsContent: {
    gap: 6,
  },
  savedPresetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  savedPresetText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  listSubheader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
  },
  listCountText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  listContent: {
    paddingTop: SPACING.xs,
    paddingBottom: 40,
  },
  skeletonList: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  skeletonContent: {
    flex: 1,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  loadingMoreText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
  },
});
