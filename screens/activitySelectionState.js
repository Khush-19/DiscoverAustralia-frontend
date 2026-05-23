// Global state for passing activity selection between screens
let globalSelectedActivities = [];

export const setGlobalSelectedActivities = (activities) => {
  console.log('Setting global selected activities:', activities.length);
  globalSelectedActivities = activities;
};

export const getGlobalSelectedActivities = () => {
  console.log('Getting global selected activities:', globalSelectedActivities.length);
  return globalSelectedActivities;
};

export const clearGlobalSelectedActivities = () => {
  console.log('Clearing global selected activities');
  globalSelectedActivities = [];
};
