# Seguridad de dependencias del frontend de NutriA

## Situación comprobada: 17 de noviembre de 2026

La auditoría completa de `npm` reporta cinco alertas **altas** relacionadas con una misma dependencia transitiva de desarrollo: `picomatch@4.0.7`, utilizada por `vite` y `tinyglobby`.

- Aviso: [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) / CVE-2026-112366 (ReDoS ante patrones extglob maliciosos).
- El aviso de GitHub indica **sin versión oficial corregida** a esa fecha.
- Los paquetes `picomatch`, `tinyglobby` y `vite` figuran como `devDependencies` en el lockfile. Se usan al desarrollar o compilar, pero no forman parte del código JavaScript que Vercel sirve a los pacientes.
- El frontend compilado en producción es estático; no se despliega el servidor de desarrollo de Vite.

## Mitigaciones aplicadas

1. Mantener Vite 8, sin degradarlo a Vite 6.2.7 (versión con otros avisos conocidos).
2. Los servidores `vite dev` y `vite preview` escuchan solo en la interfaz local `127.0.0.1`, con puerto estricto.
3. Evitar aceptar patrones glob suministrados por usuarios y evitar publicar el servidor Vite en Internet. Toda consulta de pacientes y rutas de API se valida en el backend.
4. Ejecutar `npm ci` con el lockfile versionado y conservar las pruebas de React, PWA y compilación en CI.
5. Mantener **ambas** auditorías visibles en GitHub Actions: dependencias de ejecución (`npm audit --omit=dev --audit-level=high`) y todas las dependencias (`npm audit --audit-level=high`).

## Pendiente para resolución definitiva

Actualizar `picomatch` a una versión oficial que repare CVE-2026-112366 cuando el equipo mantenedor publique el parche, validar compatibilidad con Vite 8, regenerar y verificar el lockfile, ejecutar toda la suite de CI y exigir que la auditoría completa quede sin alertas altas.

**No equivale a cero vulnerabilidades:** la auditoría completa continúa fallando deliberadamente hasta resolver el aviso de desarrollo. No se ignoran ni se rebajan alertas con `audit-level`, `--omit=dev` en la auditoría completa, o `continue-on-error`.
