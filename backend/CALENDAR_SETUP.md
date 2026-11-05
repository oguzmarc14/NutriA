# Google Calendar y recordatorios de citas

## Configuración en Google Cloud

1. Habilitar **Google Calendar API** en el proyecto.
2. Configurar pantalla de consentimiento OAuth (usuarios de prueba durante desarrollo).
3. Crear credenciales OAuth tipo **Aplicación web**.
4. Registrar como URI de redirección autorizado: `https://TU-BACKEND.onrender.com/api/calendar/callback`.
5. En Render, configurar estas variables:
   - `GOOGLE_CALENDAR_CLIENT_ID`
   - `GOOGLE_CALENDAR_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_REDIRECT_URI` (URI exacta del paso 4)
   - `CALENDAR_ENCRYPTION_KEY` (32 bytes aleatorios en hexadecimal; generar con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `CLIENT_URL` (URL del frontend, sin barra final)
6. Reiniciar backend y abrir **Citas → Conectar Google Calendar**. Cada nutriólogo concede permiso individualmente.

El login de Google existente **no** otorga permisos de Calendar. Se utiliza un consentimiento separado con alcance `calendar.events`. Nunca poner el client secret ni la clave de cifrado en el frontend.

## Recordatorios por Gmail

Configurar las variables de Gmail ya usadas por el proyecto: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER`.

Crear `CRON_SECRET` como valor largo aleatorio y configurar una tarea externa **cada hora** para llamar:

```
POST https://TU-BACKEND.onrender.com/api/recordatorios/procesar
x-cron-secret: TU_CRON_SECRET
```

El proceso selecciona citas que comienzan entre 23 y 24 horas después de la ejecución y envía correo al paciente si tiene dirección. La programación externa es necesaria: subir el código a Render no ejecuta recordatorios por sí solo.

## Limitaciones actuales y pendientes

- La conexión con Google requiere configuración OAuth real; sin ella el botón no podrá completar la autorización.
- La sincronización ocurre al crear o editar citas **después** de conectar el calendario. Las citas anteriores no se importan automáticamente.
- Si falla la sincronización se conserva la cita en NutriA, pero todavía no existe una cola de reintentos de Calendar.
- Al desconectar se elimina la credencial almacenada, no los eventos ya creados en Google.
- El proceso de recordatorios requiere Gmail funcional, cron externo y pruebas end-to-end.
- Para producción: implementar registro de entregas, reconciliación, controles de concurrencia más estrictos y pruebas de cambios/cancelaciones.
- No se envían notas clínicas a Google Calendar.

## Pruebas recomendadas

1. Crear cita y comprobarla en NutriA y Google Calendar.
2. Editar hora y comprobar que se actualiza el mismo evento.
3. Cancelar y comprobar que desaparece de Google Calendar.
4. Intentar citas solapadas y verificar error 409.
5. Programar cita para 23–24 horas en el futuro y ejecutar el cron; comprobar correo y evitar reenvío.
6. Desconectar Google y verificar que NutriA permite registrar citas.
