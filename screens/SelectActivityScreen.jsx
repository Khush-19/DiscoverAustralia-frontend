import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import {
  ArrowLeft,
  Check,
  Search,
  X,
} from 'lucide-react-native';
import { VIBES } from '../constants/vibes';
import { searchActivities } from '../services/AuraAPI';
import { setGlobalSelectedActivities, getGlobalSelectedActivities, clearGlobalSelectedActivities } from './activitySelectionState';

// ─── Activity Card Component ─────────────────────────────────────────────────

function ActivityCard({ activity, isSelected, onToggle }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <TouchableOpacity 
      style={[
        s.activityCard,
        isSelected && s.activityCardSelected,
      ]}
      onPress={() => {
        console.log('Activity clicked:', activity.title);
        console.log('Currently selected:', isSelected);
        onToggle(activity);
      }}
      activeOpacity={0.85}
    >
      <View style={s.activityCardContent}>
        <View style={s.activityInfo}>
          <Text style={s.activityTitle} numberOfLines={2}>{activity.title}</Text>
          <View style={s.activityKindBadge}>
            <Text style={s.activityKindText}>{activity.kind}</Text>
          </View>
        </View>
        <View
          style={[
            s.checkbox,
            isSelected && s.checkboxSelected,
          ]}
        >
          {isSelected && <Check size={16} color="#fff" strokeWidth={3} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Vibe Card Component ──────────────────────────────────────────────────────

function VibeCard({ item, onPress }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <TouchableOpacity
      style={s.vibeCardShell}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[
          s.vibeCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Left — emoji circle */}
        <View style={[s.emojiCircle, { backgroundColor: item.colorGradientFull[0] + '20' }]}>
          <Text style={s.emojiText}>{item.emoji}</Text>
        </View>

        {/* Centre — title + subtitle */}
        <View style={s.vibeTextBlock}>
          <Text style={[s.vibeTitle, { color: colors.text }]}>{item.label}</Text>
          <Text style={[s.vibeSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>

        {/* Right — arrow */}
        <View style={s.arrowContainer}>
          <Text style={{ fontSize: 18, color: colors.primary }}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SelectActivityScreen({ route }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const s = getStyles(colors);

  // Get previously selected activities from route params
  const [previouslySelected, setPreviouslySelected] = useState(route.params?.selectedActivities || []);
  
  console.log('SelectActivity rendered, previouslySelected:', previouslySelected.length);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  
  // Local selection state for searched activities
  const [localSelection, setLocalSelection] = useState([]);

  // Listen for when screen comes back into focus (after selecting activities in DetailScreen)
  useFocusEffect(
    useCallback(() => {
      console.log('SelectActivityScreen focused - checking for global state updates');
      
      // Check if there are updated activities from SelectActivityDetailScreen
      const globalActivities = getGlobalSelectedActivities();
      if (globalActivities && globalActivities.length > 0) {
        console.log('Found', globalActivities.length, 'activities in global state');
        // Update previouslySelected with the global state
        setPreviouslySelected(globalActivities);
        // Clear global state after using it
        clearGlobalSelectedActivities();
      }
    }, [])
  );

  // Toggle activity selection in search results
  const toggleActivitySelection = (activity) => {
    const activityId = activity.id || activity._id;
    console.log('Toggle activity:', activity.title, 'ID:', activityId);
    setLocalSelection(prev => {
      const isCurrentlySelected = prev.includes(activityId);
      console.log('Was selected:', isCurrentlySelected);
      if (isCurrentlySelected) {
        const newSelection = prev.filter(id => id !== activityId);
        console.log('New selection after remove:', newSelection.length);
        return newSelection;
      } else {
        const newSelection = [...prev, activityId];
        console.log('New selection after add:', newSelection.length);
        return newSelection;
      }
    });
  };

  // Check if activity is selected
  const isActivitySelected = (activity) => {
    const activityId = activity.id || activity._id;
    // Check in previously selected or local selection
    return previouslySelected.some(a => {
      const id = a.id || a._id || a.activityId;
      return id === activityId;
    }) || localSelection.includes(activityId);
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setLocalSelection([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchActivities(searchQuery.trim());
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleVibePress = (vibe) => {
    navigation.navigate('SelectActivityDetail', { 
      vibe: vibe,
      selectedActivities: previouslySelected,
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setLocalSelection([]);
  };



  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <View style={s.headerTitleBlock}>
          <Text style={s.headerTitle}>Select Activities</Text>
          <Text style={s.headerSubtitle}>Choose activities for your squad</Text>
        </View>
        
        <TouchableOpacity
          style={s.doneBtnSmall}
          onPress={() => {
            console.log('=== SelectActivity Done Button Pressed ===');
            console.log('Previously selected:', previouslySelected.length);
            console.log('Local selection:', localSelection);
            console.log('Search results:', searchResults?.length || 0);
            
            // Start with previously selected activities
            let finalSelection = [...previouslySelected];
            
            // If in search mode, merge newly selected from search results
            if (searchResults !== null) {
              console.log('In search mode - merging search results');
              searchResults.forEach(activity => {
                const activityId = activity.id || activity._id;
                if (localSelection.includes(activityId)) {
                  const alreadyExists = finalSelection.some(a => {
                    const id = a.id || a._id || a.activityId;
                    return id === activityId;
                  });
                  if (!alreadyExists) {
                    console.log('Adding activity from search:', activity.title);
                    finalSelection.push(activity);
                  }
                }
              });
            } else {
              // Not in search mode - check for updates from global state (from SelectActivityDetailScreen)
              const globalActivities = getGlobalSelectedActivities();
              if (globalActivities && globalActivities.length > 0) {
                console.log('Found', globalActivities.length, 'in global state, using as final selection');
                finalSelection = globalActivities;
                clearGlobalSelectedActivities();
              }
            }
            
            console.log('Saving', finalSelection.length, 'activities to global state');
            // Save to global state
            setGlobalSelectedActivities(finalSelection);
            
            // Simply go back - CreateSquad will read from global state
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Text style={s.doneBtnSmallText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={s.searchContainer}>
        <View style={s.searchBar}>
          <Search size={18} color={colors.textMuted} strokeWidth={2} />
          <TextInput
            style={s.searchInput}
            placeholder="Search vibes..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={s.clearBtn}>
              <X size={16} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Vibe list or Search Results */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {searchResults !== null ? (
          // Show search results (activities)
          searching ? (
            <View style={s.loadingState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : searchResults.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🔍</Text>
              <Text style={s.emptyTitle}>No activities found</Text>
              <Text style={s.emptyText}>Try a different search term</Text>
            </View>
          ) : (
            <View style={s.activityList}>
              {searchResults.map(activity => (
                <ActivityCard
                  key={activity.id || activity._id}
                  activity={activity}
                  isSelected={isActivitySelected(activity)}
                  onToggle={toggleActivitySelection}
                />
              ))}
            </View>
          )
        ) : (
          // Show vibe categories
          <View style={s.cardList}>
            {VIBES.map(v => (
              <VibeCard 
                key={v.id} 
                item={v} 
                onPress={() => handleVibePress(v)}
              />
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    minHeight: 60,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  doneBtnSmall: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  doneBtnSmallText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  activityList: {
    gap: 10,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  activityCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  activityInfo: {
    flex: 1,
    gap: 6,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  activityKindBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activityKindText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: 16,
  },
  cardList: {
    gap: 12,
  },
  vibeCardShell: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  vibeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 20,
  },
  emojiCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
  vibeTextBlock: {
    flex: 1,
    gap: 3,
  },
  vibeTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  vibeSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 30,
    alignItems: 'center',
  },
});
