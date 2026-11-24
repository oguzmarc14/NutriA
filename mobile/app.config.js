module.exports = {
  name: 'NutriA',
  icon: './assets/nutria-icon.png',
  version: '0.15.0',
  slug: 'nutria-oguzmarc',
  owner: 'oguzmarc',
  scheme: 'nutriamobile',
  orientation: 'portrait',
  ios: { bundleIdentifier: 'com.nutria.mobile' },
  android: { versionCode: 25, package: 'com.nutria.mobile', googleServicesFile: process.env.GOOGLE_SERVICES_FILE || './google-services.json' },
  extra: {
    eas: { projectId: 'b43c4e23-5353-4dc2-824a-fd4b19bc3453' },
  },
  platforms: ['android', 'ios'],
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
    ['expo-image-picker', { photosPermission: 'Permitir seleccionar el logo de tu clínica.', cameraPermission: false, microphonePermission: false }],
    ...(process.env.GOOGLE_IOS_URL_SCHEME
      ? [['@react-native-google-signin/google-signin', {
          iosUrlScheme: process.env.GOOGLE_IOS_URL_SCHEME,
        }]]
      : []),
  ],
}
