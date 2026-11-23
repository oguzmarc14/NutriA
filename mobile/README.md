# NutriA Mobile

Aplicación Android/iOS con Expo SDK 54, React Native y Expo Router. Usa la API de NutriA directamente.

## Configuración local

1. Usa Node 22 y prepara Android Studio para Android o Xcode en macOS para iOS.
2. Desde `mobile/`, ejecuta `npm ci` y copia `.env.example` a `.env`.
3. Define `EXPO_PUBLIC_API_URL` con la URL HTTPS pública del servicio de Render y el sufijo `/api`.
4. Para el acceso del personal, configura `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` con el mismo ID público que Render tiene en `GOOGLE_CLIENT_ID`. Registra la app Android `com.nutria.mobile` con la huella SHA-1 del certificado de la compilación. En iOS registra `com.nutria.mobile`, configura `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` y usa el esquema invertido de ese cliente en `GOOGLE_IOS_URL_SCHEME`.
5. Ejecuta `npm run android` o `npm run ios` para compilar y abrir el cliente de desarrollo. Después puedes iniciar Metro con `npm start`. Google Sign-In requiere el cliente nativo de desarrollo. Si cambia la configuración nativa de OAuth, regenera la app y vuelve a compilarla.

Las variables `EXPO_PUBLIC_*` son públicas. Usa identificadores de cliente OAuth, sin secretos. [Configuración de Google Sign-In para Expo](https://react-native-google-signin.github.io/docs/setting-up/expo)

En Windows, usa una ruta corta para el proyecto, por ejemplo C:/dev/NutriA, y define ANDROID_HOME con la ruta del SDK. Ninja puede fallar al compilar las dependencias C++ desde rutas largas de OneDrive.

## Contrato y alcance

- Paciente activo con contraseña: `POST /auth/paciente/login` recibe `email` y `password`.
- Administrador y nutriólogo con cuenta autorizada: `POST /auth/google` recibe `credential`, el ID token de Google emitido para el cliente web. El primer inicio exitoso puede vincular la cuenta en el servidor.
- El JWT se guarda en SecureStore y `GET /auth/me` valida la sesión al reiniciar. Las consultas usan Bearer y un 401 cierra la sesión local.
- Solo Nutriólogo ve Pacientes y Citas, según los permisos de `GET /pacientes` y `GET /citas`. La agenda empieza en Día, con rangos de Semana y Mes calculados en la zona horaria del dispositivo. Desde Inicio, Citas y la ficha del paciente se puede agendar. La disponibilidad se consulta en GET /horario/disponibilidad, que requiere horario laboral y bloques de citas configurados en la web. La app usa POST /citas para crear, PATCH /citas/:id/estado para confirmar y PUT /citas/:id para reprogramar. Las operaciones reales pueden sincronizarse con Google Calendar según la configuración del backend.
- Paciente consulta, confirma y cancela sus citas en Mis citas. Mi plan permite consultar la dieta por fecha y abrir planes del historial. Admin tiene un dashboard de cuenta con su rol y cierre de sesión.

## Dietas y expediente en la versión 0.3.0

Desde Inicio → Crear o consultar dieta se elige un paciente. Desde su ficha se accede a planes, expediente, mediciones y cálculo. El editor permite comidas, horarios, indicaciones, catálogo paginado, alimentos personalizados, porciones, notas y una meta energética editable con ajustes de 100 kcal. Al guardar conserva los IDs de las comidas existentes y las referencias de preparaciones, necesarias para el seguimiento del paciente.

La creación verifica expediente y mediciones antes de habilitar el guardado; el servidor vuelve a comprobar los requisitos. Desde el aviso se pueden completar datos y regresar al editor. La pantalla de expediente edita los datos clínicos principales mediante una actualización parcial; nutrición, hábitos y deporte se conservan y su edición detallada sigue disponible en la PWA.

Los formularios advierten antes de salir con cambios sin guardar. Esto no sustituye un borrador persistente: cerrar la app o terminar su proceso puede perder cambios no guardados. No se crean registros clínicos de prueba en pacientes reales durante las verificaciones automáticas.

Para revisar el flujo en un dispositivo, usar un paciente de prueba autorizado con expediente y mediciones. Crear una dieta con alimentos, confirmar su consulta desde la cuenta del paciente, editar porciones y comprobar que se conserven los seguimientos de comidas no eliminadas. Probar el retorno desde requisitos y el aviso de cambios sin guardar. Estas pruebas con sesión real siguen pendientes hasta instalar la APK que incluya este código.

## Verificación

- `npm test` verifica roles, agenda, fechas, cálculos, serialización de dietas y conservación de datos clínicos.
- `npm run typecheck` comprueba TypeScript.
- `npm run build` exporta los bundles de Android e iOS. Las compilaciones nativas se ejecutan con `npm run android` o `npm run ios`.

Para verificar contra Render, usa cuentas de prueba ya activas y una cuenta de Google ya vinculada. Prueba inicio y cierre de sesión, restauración tras reiniciar, acceso a Pacientes y Citas con Nutriólogo y navegación protegida con Admin y Paciente.


## Estructura del código

- `app/` declara las rutas y la navegación protegida de Expo Router.
- `src/features/auth/` contiene el acceso, las reglas por rol y el proveedor de sesión.
- `src/features/appointments/` contiene las pantallas de agenda y citas, sus tipos y las funciones de calendario.
- `src/features/patients/` contiene la lista y la ficha del paciente.
- `src/features/nutrition/` contiene mediciones, cálculo, expediente principal, consulta del paciente y el editor de dietas; `plans/` separa sus modelos, catálogo y editor de comidas.
- `src/features/home/` contiene el inicio y los accesos por rol.
- `src/core/api/` contiene el cliente HTTP y los contratos de sesión.
- `src/shared/ui/` contiene los botones, contenedores y estados compartidos.
- `src/shared/hooks/` contiene las consultas con cancelación y recarga al enfocar.
- `tests/` contiene las comprobaciones de contratos, permisos y calendario.

Los imports `@/` se resuelven desde `src/`. Cada pantalla vive dentro de su funcionalidad. Las rutas exportan esa pantalla y los layouts definen qué roles pueden acceder. El backend verifica de nuevo los permisos de cada operación.

## Seguimiento diario en la versión 0.4.0

Desde Mi plan, cada comida permite registrar completa, parcial u omitida, agrado y un comentario opcional de hasta 500 caracteres. Se requiere elegir estado y agrado explícitamente. El registro se identifica por paciente, dieta, comida y fecha. Actualizarlo no modifica otro día. Mi progreso muestra el historial y el resumen de la fecha elegida; la nutrióloga dispone de una consulta de solo lectura desde la ficha del paciente.

El backend acepta fechas durante la vigencia de la dieta y rechaza una dieta reemplazada para ese día. Se conservan las fechas históricas de las comidas que permanecen al editar el plan. Quitar una comida conserva el comportamiento previo del backend: elimina sus registros de seguimiento, con aviso en el editor. El resumen acumulado incluye las comidas de las fechas iniciales de los planes y de los días adicionales con registros; no representa todos los días de calendario sin registro. La vista nativa muestra cifras diarias del menú vigente para evitar confundir ese acumulado con el cumplimiento de hoy.

La app no permite registrar días futuros. Los cambios del formulario permanecen en memoria durante errores de red y se advierte al salir sin guardar; no constituyen almacenamiento offline persistente. Las pruebas automáticas usan fixtures. La verificación de sesión real, persistencia en MongoDB y revisión visual en dispositivo quedan pendientes de la APK y del despliegue del backend.

## Pagos en la versión 0.5.0

El paciente accede desde Inicio → Mis pagos, consulta los últimos 200 reportes como máximo y reporta pagos externos mediante importe en MXN, fecha, método, concepto y referencia opcional. El reporte inicia como «reportado»; no mueve dinero, procesa tarjetas ni emite comprobantes fiscales. El formulario valida centavos exactos, fecha y límites del contrato existente, muestra confirmación y evita envíos simultáneos desde la misma pantalla.

La nutrióloga accede desde Inicio → Pagos de pacientes o desde la ficha del paciente. Confirma o rechaza reportes pendientes con una confirmación explícita. El backend conserva la revisión atómica y los filtros por consultorio. Los totales se separan por estado y corresponden solo a los reportes cargados; no representan una cuenta por cobrar, saldo ni conciliación bancaria. No existe una garantía de idempotencia entre dispositivos o tras una respuesta perdida del servidor; antes de reenviar un reporte, revisar el historial.

Se usan las rutas existentes /pagos/mios, /pagos/consultorio?pacienteId=... y PATCH /pagos/consultorio/:id/estado. La app no permite elegir al propietario del reporte ni confirmarlo desde una cuenta de paciente. Las pruebas automáticas usan datos sintéticos; el registro y revisión con sesiones reales siguen pendientes de la instalación de esta versión.


## Editor móvil 0.9.0

El editor usa tarjetas horizontales de comidas, preparaciones independientes de platillos y bebidas y búsqueda compacta dentro de la comida. Los alimentos agregados se agrupan por preparación y cada uno tiene control de porciones, eliminación y notas desplegables. Las indicaciones, el seguimiento global y las opciones avanzadas se despliegan cuando se necesitan. La meta de la comida compara las calorías agregadas con su porcentaje de la meta personalizada o del cálculo guardado; no utiliza las calorías consumidas como objetivo.

Las pruebas visuales de componentes se realizaron a 320 y 390 píxeles mediante React Native Web y datos de prueba, sin crear dietas en producción. Se comprobó búsqueda, adición de alimento, cambio de una a dos porciones y actualización de 70 a 140 kcal. Esta previsualización no sustituye una prueba de la APK instalada con sesión real.


### Firma de las APK

El workflow mobile-apk.yml utiliza un certificado temporal distinto en cada ejecución. Su artefacto permite pruebas de interfaz, pero no debe sustituir la APK habitual ni se debe asumir que permite iniciar sesión con Google: OAuth valida el paquete y la huella del certificado. La versión para actualizar la app habitual se debe generar con la firma estable guardada en Expo.

La integración del editor 0.9.0 conserva los cambios de pacientes, paciente en atención, Mi clínica y agenda publicados hasta 99875528. La restauración del paciente seleccionado ignora lecturas antiguas si se seleccionó o se dejó de trabajar con otro paciente antes de terminar la lectura de SecureStore.


## Versión 0.11.0 — revisión integral

Incluye cantidades prácticas y notas del plan para pacientes, historial seleccionable por ID, orden guardado de comidas, vista previa/PDF, borradores protegidos por usuario y paciente, expediente completo, horarios y bloqueos, acciones de citas, usuarios y moderación/creación de recetas. Mantiene el seguimiento minimizado de energía y la meta editable con referencia del cálculo.

La sesión local se elimina aunque falle la desasociación remota. Los recordatorios locales se concilian al abrir/volver a NutriA, después de una acción de cita o mientras la app está activa. Si una cita cambia cuando la app está cerrada y el sistema no la ejecuta, puede quedar un recordatorio local antiguo hasta volver a abrirla; no se garantiza sincronización en segundo plano.

La API conserva un buzón de avisos por usuario durante 30 días y procesa receipts de Expo. En Render gratuito el proceso puede dormir; no se garantiza un plazo de entrega. Las credenciales FCM se gestionan en Expo; no se incorporan claves privadas al código.

Comprobaciones de esta entrega: TypeScript, 70 pruebas móviles, 115 pruebas de API, npm audit y exportación Hermes de Android/iOS. La exportación iOS no constituye una app firmada para iPhone: faltan firma Apple, configuración OAuth de iOS y prueba en dispositivo. Las pruebas automáticas y visuales previas usan fixtures; la entrega real de notificaciones y los flujos con sesiones de cada rol en la APK instalada requieren validación en dispositivos.

Las adaptaciones de dependencias en vendor conservan la compatibilidad CommonJS de SDK 54; image-size delega el análisis al paquete original actualizado y solo adapta rutas de archivos de Metro a bytes.

## Versión 0.12.0 — biblioteca de dietas y revisión nutricional

- Después de guardar un plan, la app ofrece crear una copia privada con nombre y fecha en **NutriA Community → Mis dietas**.
- Las copias se guardan en MongoDB por nutriólogo, sin copiar el identificador ni el nombre del paciente; desde la biblioteca pueden abrirse como un plan nuevo para un paciente activo.
- Porciones fraccionarias (¼, ½, ¾, 1/2, 1 1/2) aplicadas proporcionalmente a calorías, macros y gramos. La selección de comidas no tiene flechas laterales; eliminar una comida requiere confirmación y la energía de cada comida indica su porcentaje del plan.
- En cálculo nutricional se recuperan los valores guardados, se muestra una sola medición seleccionada y los resultados estimados de Mifflin-St Jeor antes de guardar. El historial se despliega mediante **Ver anteriores**.
- Para utilizar **Mis dietas** con cuentas reales debe desplegarse también el backend con las rutas nuevas de `/community/mis-dietas`. No basta con compilar solamente la APK.
- Las pruebas automatizadas no sustituyen la verificación con un nutriólogo, un paciente de pruebas y el backend desplegado.

## Versión 0.13.0 — cierre funcional web y móvil

- Gamificación móvil: «Mi camino en NutriA» en Progreso; opt-in del paciente, días con registro, rachas y reconocimientos sin calificar peso ni calorías. El nutriólogo puede permitir o pausar este espacio desde la ficha del paciente.
- La web también incluye «Mis dietas» privadas en Community, con consulta, eliminación de copia y reutilización de una plantilla en el editor, y pregunta para guardarla después de crear o editar una dieta.
- Corrección de fechas clínicas al editarlas; la fecha no depende de la zona horaria local.
- Comparación de mediciones en móvil y control de porciones en pasos de ¼; historial de dietas del paciente plegable.
- Backend: rutas de biblioteca privada ya implementadas en /community/mis-dietas.
- La nueva versión móvil usa versionCode 14. Generar una APK EAS preview con credenciales de firma estables para actualizar la instalación anterior.
- Para cerrar: verificar sesiones reales de Nutriólogo y Paciente, recepción de avisos, uso de plantillas web/móvil, persistencia en MongoDB y comprobación de privacidad. No se ejecutaron pruebas contra expedientes reales.
