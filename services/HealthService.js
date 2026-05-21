/**
 * HealthService
 * 
 * Handles reading health data from the device using react-native-health-connect.
 * The expo-health-connect config plugin handles Android manifest configuration during build.
 * Currently focuses on step count data.
 */

import { Platform } from 'react-native';

// Dynamically import react-native-health-connect to handle potential issues
let HealthConnect;
let PermissionType;

try {
  const healthConnectModule = require('react-native-health-connect');
  console.log('Health Connect module structure:', Object.keys(healthConnectModule));
  
  HealthConnect = healthConnectModule.default || healthConnectModule;
  console.log('HealthConnect object type:', typeof HealthConnect);
  console.log('HealthConnect keys:', Object.keys(HealthConnect || {}));
  
  // Try different ways to get PermissionType
  PermissionType = healthConnectModule.PermissionType || 
                   HealthConnect.PermissionType || 
                   { Read: 'read', Write: 'write' };
  
  console.log('PermissionType:', PermissionType);
  console.log('Health Connect module loaded successfully');
} catch (error) {
  console.error('Failed to load react-native-health-connect module:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    code: error.code
  });
}

// Track initialization state
let isInitialized = false;
let initPromise = null;

/**
 * Initialize Health Connect (Android only)
 * This must be called before any other Health Connect operations
 */
async function initializeHealthConnect() {
  // Return existing promise if initialization is in progress
  if (initPromise) return initPromise;
  
  // Already initialized
  if (isInitialized) return true;
  
  // Check if Health Connect module was loaded successfully
  if (!HealthConnect) {
    console.error('Health Connect module is not available. Module loading failed during import.');
    return false;
  }
  
  // Health Connect is Android-only
  if (Platform.OS !== 'android') {
    console.log('Health Connect is not available on this platform');
    return false;
  }

  // Create initialization promise
  initPromise = (async () => {
    try {
      console.log('Attempting to initialize Health Connect...');
      console.log('Health Connect object:', typeof HealthConnect);
      console.log('Health Connect methods:', Object.keys(HealthConnect || {}));
      
      await HealthConnect.initialize();
      isInitialized = true;
      console.log('Health Connect initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Health Connect:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Get today's step count from Health Connect
 * @returns {Promise<number>} Today's step count, or mock data if unavailable
 */
export async function getTodaySteps() {
  try {
    // Try to initialize first
    const initialized = await initializeHealthConnect();
    if (!initialized) {
      console.log('Health Connect not initialized, returning mock data');
      // Return mock data for development/testing or unsupported platforms
      return Math.floor(Math.random() * 5000) + 3000;
    }

    // Check and request permissions before reading data
    console.log('Checking health permissions...');
    const hasPermission = await checkHealthPermissions();
    if (!hasPermission) {
      console.log('Health permissions not granted, requesting...');
      const granted = await requestHealthPermissions();
      if (!granted) {
        console.warn('Health permissions denied by user, returning mock data');
        return Math.floor(Math.random() * 5000) + 3000;
      }
      console.log('Health permissions granted successfully');
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Use readRecords instead of getSteps for react-native-health-connect
    console.log('Reading steps records...');
    const result = await HealthConnect.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      },
    });

    console.log('Steps records:', result);
    
    // Sum up all steps from the records
    let totalSteps = 0;
    if (result && result.records && Array.isArray(result.records)) {
      result.records.forEach(record => {
        if (record.count) {
          totalSteps += record.count;
        }
      });
    }

    console.log('Total steps calculated:', totalSteps);
    return totalSteps;
  } catch (error) {
    console.error('Failed to fetch steps from Health Connect:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    // Return mock data for development/testing
    return Math.floor(Math.random() * 5000) + 3000;
  }
}

/**
 * Check if health permissions are granted
 * @returns {Promise<boolean>} Whether permissions are granted
 */
export async function checkHealthPermissions() {
  console.log('--- checkHealthPermissions called ---');
  try {
    const initialized = await initializeHealthConnect();
    console.log('Initialization status for permission check:', initialized);
    
    if (!initialized) {
      console.log('Health Connect not available for permission check');
      return false;
    }

    console.log('Calling getGrantedPermissions...');
    const grantedPermissions = await HealthConnect.getGrantedPermissions();
    console.log('Granted permissions:', JSON.stringify(grantedPermissions, null, 2));
    
    // Check if READ_STEPS permission is granted
    // Use string comparison as fallback
    const hasReadSteps = grantedPermissions.some(
      (permission) => {
        console.log('Checking permission:', permission);
        const accessType = permission.accessType || permission.type;
        const recordType = permission.recordType || permission.type;
        const matches = (accessType === 'read' || accessType === PermissionType?.Read) && 
               (recordType === 'Steps' || recordType === 'steps');
        console.log(`Permission match: accessType=${accessType}, recordType=${recordType}, matches=${matches}`);
        return matches;
      }
    );
    
    console.log('Has read steps permission:', hasReadSteps);
    return hasReadSteps;
  } catch (error) {
    console.error('Failed to check health permissions:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    return false;
  }
}

/**
 * Open Health Connect settings to manually grant permissions
 */
export async function openHealthConnectSettings() {
  try {
    const initialized = await initializeHealthConnect();
    if (!initialized) {
      console.log('Health Connect not available');
      return false;
    }

    console.log('Opening Health Connect settings...');
    await HealthConnect.openHealthConnectSettings();
    return true;
  } catch (error) {
    console.error('Failed to open Health Connect settings:', error);
    return false;
  }
}

/**
 * Check if Health Connect SDK is available on the device
 */
export async function checkHealthConnectAvailability() {
  try {
    const initialized = await initializeHealthConnect();
    if (!initialized) {
      return { available: false, reason: 'Initialization failed' };
    }

    const status = await HealthConnect.getSdkStatus();
    console.log('Health Connect SDK status:', status);
    
    return {
      available: status === 'available' || status === 3, // SDK_AVAILABLE = 3
      status: status,
      reason: status === 'available' || status === 3 ? 'SDK is available' : 'SDK not available'
    };
  } catch (error) {
    console.error('Failed to check Health Connect availability:', error);
    return { available: false, reason: error.message };
  }
}

/**
 * Request permissions for Health Connect
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export async function requestHealthPermissions() {
  console.log('--- requestHealthPermissions called ---');
  try {
    // Try to initialize first
    console.log('Initializing Health Connect for permission request...');
    const initialized = await initializeHealthConnect();
    console.log('Initialization result:', initialized);
    
    if (!initialized) {
      console.log('Health Connect not available, skipping permission request');
      return false;
    }

    console.log('PermissionType value:', PermissionType);
    console.log('PermissionType.Read:', PermissionType?.Read);
    
    // Use string literal as fallback if PermissionType is not available
    const readAccessType = PermissionType?.Read || 'read';
    
    console.log('Requesting permission with accessType:', readAccessType);
    console.log('Permission request payload:', [{ accessType: readAccessType, recordType: 'Steps' }]);
    
    console.log('Calling HealthConnect.requestPermission...');
    // requestPermission returns an array of granted permissions, not a boolean
    const grantedPermissions = await HealthConnect.requestPermission([
      { accessType: readAccessType, recordType: 'Steps' },
    ]);
    
    console.log('Granted permissions returned:', grantedPermissions);
    console.log('Result type:', typeof grantedPermissions);
    console.log('Is array:', Array.isArray(grantedPermissions));
    
    // Check if Steps read permission is in the granted list
    if (Array.isArray(grantedPermissions)) {
      const hasStepsPermission = grantedPermissions.some(
        (perm) => perm.accessType === readAccessType && perm.recordType === 'Steps'
      );
      console.log('Has Steps permission:', hasStepsPermission);
      return hasStepsPermission;
    }
    
    return false;
  } catch (error) {
    console.error('=== ERROR in requestHealthPermissions ===');
    console.error('Failed to request health permissions:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    return false;
  }
}
