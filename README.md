# NutriA

Plataforma web para la gestión y el seguimiento nutricional. Este repositorio contiene el MVP académico de NutriA.

## Arquitectura

```text
NutriA/
├── frontend/   React + Vite + Tailwind CSS
└── backend/    Node.js + Express + MongoDB Atlas + JWT
```

## Requisitos

- Node.js 20 o superior
- npm
- Un clúster de MongoDB Atlas

## Configuración local

### Backend

1. Entra a `backend/`.
2. Ejecuta `npm install`.
3. Copia `.env.example` como `.env`.
4. Configura `MONGODB_URI`, `JWT_SECRET`, Google y las credenciales SMTP del correo que enviará las invitaciones.
5. Ejecuta `npm run seed:admin` una vez.
6. Inicia la API con `npm run dev`.

La API se ejecutará por defecto en `http://localhost:4000` y su endpoint de estado será `GET /api/health`.

### Frontend

1. Entra a `frontend/`.
2. Ejecuta `npm install`.
3. Copia `.env.example` como `.env` si necesitas cambiar la URL de la API.
4. Ejecuta `npm run dev`.

La aplicación se abrirá por defecto en `http://localhost:5173`.

### Invitaciones de pacientes por Gmail

El backend envía las invitaciones mediante SMTP. Si utilizas una cuenta de Gmail, configura en `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-cuenta@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación
EMAIL_FROM=tu-cuenta@gmail.com
CLIENT_URL=http://localhost:5173
```

`SMTP_PASS` debe ser una contraseña de aplicación de Google, no la contraseña normal de la cuenta. En producción, `CLIENT_URL` debe apuntar al dominio publicado del frontend.

## Primer incremento del MVP

- Inicio de sesión con correo y contraseña.
- Sesión basada en JWT.
- Roles de administrador, nutriólogo y paciente.
- Rutas privadas en React y en Express.
- Panel inicial adaptable a escritorio y teléfono.

Los módulos de pacientes, expedientes, mediciones y planes alimenticios se implementarán de forma incremental sobre esta base.

## Seguridad

Nunca subas archivos `.env`, contraseñas, cadenas de conexión o claves JWT al repositorio.
