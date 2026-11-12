module.exports = {
  name: 'NutriA',
  slug: 'nutria-mobile',
  scheme: 'nutriamobile',
  orientation: 'portrait',
  ios: { bundleIdentifier: 'com.nutria.mobile' },
  android: { package: 'com.nutria.mobile' },
  platforms: ['android', 'ios'],
  plugins: [
    'expo-router',
    'expo-secure-store',
    ...(process.env.GOOGLE_IOS_URL_SCHEME
      ? [['@react-native-google-signin/google-signin', {
          iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME,
        }]]
      : []),
  ],
}
