module.exports = {
  name: 'NutriA',
  slug: 'nutria-mobile',
  scheme: 'nutriamobile',
  orientation: 'portrait',
  ios: { bundleIdentifier: 'com.nutria.mobile' },
  android: { package: 'com.nutria.mobile', ...(process.env.GOOGLE_SERVICES_FILE && { googleServicesFile: process.env.GOOGLE_SERVICES_FILE }) },
  extra: {
    ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID && { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } }),
  },
  platforms: ['android', 'ios'],
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
    ...(process.env.GOOGLE_IOS_URL_SCHEME
      ? [['@react-native-google-signin/google-signin', {
          iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME,
        }]]
      : []),
  ],
}
