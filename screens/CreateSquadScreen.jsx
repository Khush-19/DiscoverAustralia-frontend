import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../hooks/useUser';
import { useSquad } from '../hooks/useSquad';
import {
  ArrowLeft,
  Check,
  Plus,
  X,
} from 'lucide-react-native';
import { VIBES } from '../constants/vibes';
import { getGlobalSelectedActivities, clearGlobalSelectedActivities } from './activitySelectionState';

// ─── Tag Selection Chip ──────────────────────────────────────────────────────

function TagChip({ label, selected, onPress, colors }) {
  const s = getStyles(colors);
  return (
    <TouchableOpacity
      style={[
        s.tagChip,
        selected && s.tagChipSelected,
        {
          backgroundColor: selected ? colors.primary + '20' : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          s.tagChipText,
          selected && { color: colors.primary },
        ]}
      >
        {label}
      </Text>
      {selected && (
        <Check size={14} color={colors.primary} strokeWidth={2.5} style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateSquadScreen({ route }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useUser();
  const { createSquadWithDetails } = useSquad();
  const s = useMemo(() => getStyles(colors), [colors]);

  // Use refs to persist form state across navigation
  const formDataRef = useRef({
    name: '',
    subtitle: '',
    selectedTags: [],
    customTagInput: '',
    selectedActivities: [],
  });

  // Form state
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);



  // Sync state with refs
  useEffect(() => {
    formDataRef.current.name = name;
  }, [name]);

  useEffect(() => {
    formDataRef.current.subtitle = subtitle;
  }, [subtitle]);

  useEffect(() => {
    formDataRef.current.selectedTags = selectedTags;
  }, [selectedTags]);

  useEffect(() => {
    formDataRef.current.customTagInput = customTagInput;
  }, [customTagInput]);

  useEffect(() => {
    formDataRef.current.selectedActivities = selectedActivities;
  }, [selectedActivities]);

  // Available tags - predefined categories
  const availableTags = useMemo(() => [
    { id: 'tech', label: 'Tech' },
    { id: 'outdoor', label: 'Outdoor' },
    { id: 'study', label: 'Study' },
    { id: 'food', label: 'Food' },
    { id: 'music', label: 'Music' },
  ], []);

  // Navigate to activity selection screen
  const handleSelectActivities = () => {
    console.log('Navigating to SelectActivity with', selectedActivities.length, 'activities');
    
    navigation.navigate('SelectActivity', {
      selectedActivities: selectedActivities,
    });
  };

  // Listen for when screen comes back into focus (after selecting activities)
  useFocusEffect(
    useCallback(() => {
      console.log('CreateSquad focused - checking for updated activities');
      
      // Check global state for updated activities
      const updatedActivities = getGlobalSelectedActivities();
      if (updatedActivities.length > 0) {
        console.log('Found', updatedActivities.length, 'activities in global state');
        setSelectedActivities(updatedActivities);
        formDataRef.current.selectedActivities = updatedActivities;
        // Clear global state after using it
        clearGlobalSelectedActivities();
      }
    }, [])
  );


  // Toggle tag selection
  const toggleTag = (tagId) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // Add custom tag
  const handleAddCustomTag = () => {
    const trimmedTag = customTagInput.trim();
    if (!trimmedTag) {
      Alert.alert('Validation Error', 'Please enter a tag name');
      return;
    }

    // Check if tag already exists (case-insensitive)
    const tagExists = availableTags.some(
      tag => tag.label.toLowerCase() === trimmedTag.toLowerCase()
    ) || selectedTags.some(
      tag => typeof tag === 'string' && tag.toLowerCase() === trimmedTag.toLowerCase()
    );

    if (tagExists) {
      Alert.alert('Validation Error', 'This tag already exists');
      return;
    }

    // Add custom tag to selected tags
    setSelectedTags(prev => [...prev, trimmedTag]);
    setCustomTagInput('');
  };

  // Remove activity from selection
  const removeActivity = (activityToRemove) => {
    setSelectedActivities(prev => {
      const activityId = activityToRemove._id || activityToRemove.idString || activityToRemove.activityId || activityToRemove.id;
      return prev.filter(a => {
        const id = a._id || a.idString || a.activityId || a.id;
        return id !== activityId;
      });
    });
  };

  // Validate and submit
  const handleCreateSquad = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a squad name');
      return;
    }

    if (!subtitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a subtitle');
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one tag');
      return;
    }

    if (selectedActivities.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one activity');
      return;
    }

    if (!user || !user.email) {
      Alert.alert('Error', 'User information not available. Please log in again.');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare squad data according to API spec
      const squadData = {
        name: name.trim(),
        subtitle: subtitle.trim(),
        alive: true,
        tags: selectedTags,
        activities: selectedActivities.map(activity => activity.idString || activity._id || activity.id),
      };

      console.log('=== Create Squad API Request ===');
      console.log('Request Body (JSON):', JSON.stringify(squadData, null, 2));
      console.log('================================');

      await createSquadWithDetails(squadData);

      Alert.alert(
        'Success',
        'Squad created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Squads tab without resetting the entire stack
              navigation.navigate('Tabs', {
                screen: 'Squads',
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create squad:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create squad. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
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
          <Text style={s.headerTitle}>Create Squad</Text>
          <Text style={s.headerSubtitle}>Build your community</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Squad Info Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Squad Details</Text>

          <View style={s.inputGroup}>
            <Text style={s.label}>Squad Name *</Text>
            <TextInput
              style={s.input}
              placeholder="Enter squad name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>Subtitle *</Text>
            <TextInput
              style={s.input}
              placeholder="Enter a catchy subtitle"
              placeholderTextColor={colors.textMuted}
              value={subtitle}
              onChangeText={setSubtitle}
            />
          </View>
        </View>

        {/* Tags Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Select Tags * (at least one)</Text>
          <View style={s.tagsContainer}>
            {availableTags.map(tag => (
              <TagChip
                key={tag.id}
                label={tag.label}
                selected={selectedTags.includes(tag.id)}
                onPress={() => toggleTag(tag.id)}
                colors={colors}
              />
            ))}
          </View>

          {/* Custom tag input */}
          <View style={s.customTagRow}>
            <TextInput
              style={s.customTagInput}
              placeholder="Add custom tag"
              placeholderTextColor={colors.textMuted}
              value={customTagInput}
              onChangeText={setCustomTagInput}
              onSubmitEditing={handleAddCustomTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={s.addTagButton}
              onPress={handleAddCustomTag}
              activeOpacity={0.7}
            >
              <Plus size={18} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Display custom tags */}
          {selectedTags.filter(tag => typeof tag === 'string').length > 0 && (
            <View style={s.customTagsContainer}>
              {selectedTags
                .filter(tag => typeof tag === 'string')
                .map((tag, index) => (
                  <TagChip
                    key={`custom-${index}`}
                    label={tag}
                    selected={true}
                    onPress={() => toggleTag(tag)}
                    colors={colors}
                  />
                ))}
            </View>
          )}
        </View>

        {/* Activities Section */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Select Activities *</Text>
            <View style={s.selectedCount}>
              <Text style={s.selectedCountText}>
                {selectedActivities.length} selected
              </Text>
            </View>
          </View>

          {/* Select button */}
          <TouchableOpacity
            style={s.selectButton}
            onPress={handleSelectActivities}
            activeOpacity={0.7}
          >
            <View style={s.selectButtonContent}>
              <Plus size={20} color={colors.primary} strokeWidth={2.5} />
              <Text style={s.selectButtonText}>Choose Activities</Text>
            </View>
          </TouchableOpacity>

          {/* Display selected activities */}
          {selectedActivities.length > 0 && (
            <View style={s.selectedActivitiesList}>
              {selectedActivities.map((activity, index) => {
                const activityId = activity._id || activity.idString || activity.activityId || activity.id;
                const activityTitle = activity.title || 'Untitled Activity';
                const activityKind = activity.kind || 'Activity';
                
                return (
                  <View key={activityId || index} style={s.selectedActivityItem}>
                    <View style={s.selectedActivityInfo}>
                      <Text style={s.selectedActivityTitle} numberOfLines={1}>{activityTitle}</Text>
                      <View style={s.selectedActivityKindBadge}>
                        <Text style={s.selectedActivityKindText}>{activityKind}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={s.removeActivityBtn}
                      onPress={() => removeActivity(activity)}
                      activeOpacity={0.7}
                    >
                      <X size={16} color={colors.textMuted} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom padding to ensure content doesn't get hidden behind fixed button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Create Button at bottom */}
      <View style={s.fixedButtonContainer}>
        <TouchableOpacity
          style={[
            s.createButton,
            submitting && s.createButtonDisabled,
          ]}
          onPress={handleCreateSquad}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={submitting ? [colors.textMuted, colors.textMuted] : [colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.createButtonGrad}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.createButtonText}>Create Squad</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipSelected: {
    borderWidth: 1.5,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  addTagButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectedCount: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  selectButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  selectedActivitiesList: {
    gap: 10,
  },
  selectedActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  selectedActivityInfo: {
    flex: 1,
    gap: 6,
  },
  selectedActivityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  selectedActivityKindBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  selectedActivityKindText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  removeActivityBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loader: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  buttonContainer: {
    marginTop: 8,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  createButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  createButtonGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.2,
  },
});
