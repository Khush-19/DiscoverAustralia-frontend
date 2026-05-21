import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { fetchHelp } from '../services/helpService';
import RenderHtml from 'react-native-render-html';

export default function HelpScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [helpData, setHelpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHelpData();
  }, []);

  const loadHelpData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHelp();
      setHelpData(data);
    } catch (err) {
      console.error('Error fetching help data:', err);
      setError(err.message || 'Failed to load help information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading help...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        </View>
        <View style={styles.errorContainer}>
          <HelpCircle size={48} color="#EF4444" />
          <Text style={[styles.errorText, { color: colors.text }]}>Error loading help</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]} 
            onPress={loadHelpData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Function to render HTML content properly
  const renderHelpContent = (htmlContent) => {
    if (!htmlContent) return null;
    
    return (
      <RenderHtml
        contentWidth={300}
        source={{ html: htmlContent }}
        baseStyle={{ color: colors.text, fontSize: 16, lineHeight: 24 }}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#0F9688', '#0D7A6E', '#0A5C53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.helpCard}
        >
          <View style={styles.helpHeader}>
            <HelpCircle size={32} color="#FFFFFF" />
            <Text style={styles.helpTitle}>Help Information</Text>
          </View>
          
          <View style={styles.helpBody}>
            {helpData && helpData.help ? (
              renderHelpContent(helpData.help)
            ) : (
              <Text style={[styles.noHelpText, { color: colors.textSecondary }]}>
                No help information available.
              </Text>
            )}
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  helpCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  helpBody: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 16,
  },
  noHelpText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});