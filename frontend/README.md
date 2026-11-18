# Frontend de NutriA

Interfaz del MVP desarrollada con React, Vite y Tailwind CSS.

## Comandos

- `npm install`: instala las dependencias.
- `npm run dev`: inicia el entorno local.
- `npm run lint`: revisa el código.
- `npm run build`: genera la compilación de producción.

La URL de la API se configura mediante `VITE_API_URL`; consulta `.env.example`.

## Seguridad del entorno de desarrollo

`npm run dev` y `npm run preview` escuchan únicamente en `127.0.0.1` de manera predeterminada. Evita `--host 0.0.0.0` o exponer estos servidores a Internet. Si necesitas probar en otro dispositivo de una red de confianza, usa un túnel privado o un entorno de prueba aislado y vuelve a cerrar el acceso al terminar.

Para revisar dependencias: `npm audit --omit=dev --audit-level=high` verifica el árbol de ejecución, mientras que `npm audit --audit-level=high` también incluye las herramientas de desarrollo. Consulta [SEGURIDAD_DEPENDENCIAS.md](SEGURIDAD_DEPENDENCIAS.md) antes de actualizar Vite.

## Recordatorios automáticos de citas (Vercel Hobby)

El archivo `vercel.json` registra una tarea diaria a las **06:17 UTC**
(`17 6 * * *`). El endpoint servidor `/api/cron/recordatorios`
reenvía una petición autenticada al backend de Render.

**Configuración necesaria para activar el envío:**

1. Crear un secreto aleatorio largo (mínimo 32 bytes) y guardarlo como
   `CRON_SECRET` en el servicio backend de **Render**.
2. Configurar el **mismo** `CRON_SECRET` en el proyecto **nutri-a**
   de Vercel, entorno **Production**. Vercel lo remite en
   `Authorization: Bearer ...` a la función.
3. Verificar que Vercel tenga `VITE_API_URL` en Production apuntando
   al backend (ej. `https://tu-backend.onrender.com/api`); si no,
   configurar `NUTRIA_BACKEND_URL` con esa dirección.
4. Volver a desplegar frontend y backend si se cambiaron variables.
   Comprobar en Vercel → Cron Jobs y en los logs la ejecución exitosa.
   No se deben publicar los secretos en código, GitHub ni capturas.

La revisión diaria envía recordatorios el **día anterior según la zona
horaria de cada cita**. También contempla citas del mismo día creadas
recientemente con un margen mínimo de dos horas. El campo
`recordatorio24hEnviado` evita duplicados, aunque el nombre histórico
se conserva por compatibilidad. No es un envío a una hora exacta de
antelación ni se garantiza entrega durante interrupciones del correo.

El cron anterior de GitHub no funcionaba automáticamente al estar el
workflow solo en `react-mvp`; GitHub programa exclusivamente la rama
predeterminada `main`. Por eso se sustituye por Vercel, que sí despliega
esta rama a producción. Si más adelante se usa otro programador,
desactivar uno de los dos para no provocar llamadas duplicadas.
