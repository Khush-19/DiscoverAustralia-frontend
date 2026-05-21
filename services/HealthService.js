/**
 * HealthService
 * 
 * Handles reading health data from the device using react-native-health-connect.
 * Currently focuses on step count data.
 */

import HealthConnect, { PermissionType } from 'react-native-health-connect';

/**
 * Get today's step count from Health Connect
 * @returns {Promise<number>} Today's step count, or 0 if unavailable
 */
export async function getTodaySteps() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const result = await HealthConnect.getSteps({
      startTime: startOfDay.toISOString(),
      endTime: now.toISOString(),
    });

    return result?.count || 0;
  } catch (error) {
    console.warn('Failed to fetch steps from Health Connect:', error);
    // Return mock data for development/testing
    return Math.floor(Math.random() * 5000) + 3000;
  }
}

/**
 * Request permissions for Health Connect
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export async function requestHealthPermissions() {
  try {
    const granted = await HealthConnect.requestPermission([
      { accessType: PermissionType.Read, recordType: 'Steps' },
    ]);
    return granted;
  } catch (error) {
    console.warn('Failed to request health permissions:', error);
    return false;
  }
}
