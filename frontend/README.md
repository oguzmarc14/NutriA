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
