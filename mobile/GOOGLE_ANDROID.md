# Google en Android · NutriA React Native

## Causa verificada el 19 de noviembre de 2026

El cliente Android existente en el proyecto `nutria-508016` está registrado para `com.nutria.app` (Capacitor). React Native usa `com.nutria.mobile`. No cambiar el cliente anterior, porque lo utiliza Capacitor.

Registrar un cliente Android adicional en https://console.cloud.google.com/auth/clients?project=nutria-508016 con:

- Nombre: NutriA React Native Android
- Paquete: `com.nutria.mobile`
- SHA-1 de la firma de prueba verificada: `E5:92:BE:F5:73:F7:EE:17:5E:C0:DF:13:00:81:99:1D:1F:67:C6:F2`

El cliente web utilizado por la app y la audiencia del backend deben coincidir:
`664061363853-nt772bl1bh9o9q032cf679pjuhadta46.apps.googleusercontent.com`.

Firebase `nutria-a9121` se utiliza para notificaciones FCM. Su archivo google-services.json no sustituye el registro OAuth Android del proyecto anterior. Esta app intercambia un ID token con el backend; no utiliza Firebase Authentication para iniciar sesión.

## Estado de verificación

Se verificaron la firma de la APK 0.1.0 y el cliente anterior. El usuario creó el cliente adicional «NutriA React Native Android» el 19 de noviembre de 2026; las capturas muestran com.nutria.mobile y la SHA-1 anterior en el formulario, y después el cliente en la lista. Sigue pendiente verificar un inicio de sesión real. No declarar corregido Google hasta comprobarlo.

Después de registrar el cliente, esperar la propagación indicada por Google y probar la APK firmada, no Expo Go. Verificar la respuesta de /api/auth/google y el rol que devuelve /api/auth/me. No publicar tokens ni claves privadas en logs.

Dispositivos sin Servicios de Google Play necesitan otra integración para acceso nativo de Google y para notificaciones remotas FCM. El acceso de pacientes con correo utiliza el backend existente.
