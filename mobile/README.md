# NutriA Mobile

Aplicación Android/iOS con Expo SDK 54, React Native y Expo Router. Usa la API de NutriA directamente.

## Configuración local

1. Usa Node 22 y prepara Android Studio para Android o Xcode en macOS para iOS.
2. Desde `mobile/`, ejecuta `npm install` y copia `.env.example` a `.env`.
3. Define `EXPO_PUBLIC_API_URL` con la URL HTTPS pública del servicio de Render y el sufijo `/api`.
4. Para el acceso del personal, configura `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` con el mismo ID público que Render tiene en `GOOGLE_CLIENT_ID`. Registra la app Android `com.nutria.mobile` con la huella SHA-1 del certificado de la compilación. En iOS registra `com.nutria.mobile`, configura `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` y usa el esquema invertido de ese cliente en `GOOGLE_IOS_URL_SCHEME`.
5. Ejecuta `npm run android` o `npm run ios` para compilar y abrir el cliente de desarrollo. Después puedes iniciar Metro con `npm start`. Google Sign-In requiere el cliente nativo de desarrollo. Si cambia la configuración nativa de OAuth, regenera la app y vuelve a compilarla.

Las variables `EXPO_PUBLIC_*` son públicas. Usa identificadores de cliente OAuth, sin secretos. [Configuración de Google Sign-In para Expo](https://react-native-google-signin.github.io/docs/setting-up/expo)

## Contrato y alcance

- Paciente activo con contraseña: `POST /auth/paciente/login` recibe `email` y `password`.
- Administrador y nutriólogo con cuenta autorizada: `POST /auth/google` recibe `credential`, el ID token de Google emitido para el cliente web. El primer inicio exitoso puede vincular la cuenta en el servidor.
- El JWT se guarda en SecureStore y `GET /auth/me` valida la sesión al reiniciar. Las consultas usan Bearer y un 401 cierra la sesión local.
- Solo Nutriólogo ve Pacientes y Citas, según los permisos de `GET /pacientes` y `GET /citas`. La agenda empieza en Día, con rangos de Semana y Mes calculados en la zona horaria del dispositivo. Ambas pantallas son de consulta.
- Admin y Paciente tienen un dashboard de cuenta con su rol y cierre de sesión.

## Verificación

- `npm test` verifica roles y rangos de agenda.
- `npm run typecheck` comprueba TypeScript.
- `npm run build` exporta los bundles de Android e iOS. Las compilaciones nativas se ejecutan con `npm run android` o `npm run ios`.

Para verificar contra Render, usa cuentas de prueba ya activas y una cuenta de Google ya vinculada. Prueba inicio y cierre de sesión, restauración tras reiniciar, acceso a Pacientes y Citas con Nutriólogo y navegación protegida con Admin y Paciente.
