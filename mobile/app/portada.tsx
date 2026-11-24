import { useState } from 'react'
import { router } from 'expo-router'
import { ActivityIndicator, Image, Linking, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import { Button, colors } from '@/shared/ui/primitives'

const origin = 'https://nutri-a-six.vercel.app'
const landingUrl = origin + '/portada?app=android'

export default function Portada() {
  const [failed, setFailed] = useState(false)
  const login = () => router.push('/login')

  return <SafeAreaView style={styles.safe}>
    {failed ? <View style={styles.center}>
      <Image source={require('../assets/nutria-icon.png')} style={styles.logo} accessibilityLabel="NutriA" />
      <Text style={styles.title}>La nutrición también ocurre entre consultas.</Text>
      <Text style={styles.body} accessibilityRole="alert">La portada no está disponible en este momento.</Text>
      <Button label="Iniciar sesión" onPress={login} />
      <Button label="Volver a cargar la portada" selected={false} onPress={() => setFailed(false)} />
    </View> : <WebView
      source={{ uri: landingUrl }}
      originWhitelist={['*']}
      mixedContentMode="never"
      allowFileAccess={false}
      javaScriptCanOpenWindowsAutomatically={false}
      onShouldStartLoadWithRequest={({ url }) => {
        if (url === landingUrl || url.startsWith(landingUrl + '#')) return true
        if (url === origin + '/login') login()
        else if (/^https:\/\/nutri-a-six\.vercel\.app\/(privacidad|terminos|fuentes-nutricionales)(#pagos)?$/.test(url)) {
          void Linking.openURL(url).catch(() => {})
        }
        return false
      }}
      onError={() => setFailed(true)}
      onHttpError={({ nativeEvent }) => { if (nativeEvent.url === landingUrl) setFailed(true) }}
      startInLoadingState
      renderLoading={() => <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Cargando portada de NutriA" color={colors.green} />
        <Button label="Iniciar sesión" onPress={login} />
      </View>}
    />}
  </SafeAreaView>
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fbf9f1' },
  center: { flex: 1, justifyContent: 'center', gap: 14, padding: 24 },
  logo: { width: 94, height: 94, alignSelf: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  body: { color: colors.ink, textAlign: 'center' },
})
