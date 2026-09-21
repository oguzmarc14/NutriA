import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'

import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import PacientesPage from './pages/PacientesPage'
import ExpedientePage from './pages/ExpedientePage'
import MedicionesPage from './pages/MedicionesPage'
import PlanesAlimenticiosPage from './pages/PlanesAlimenticiosPage'
import UsuariosPage from './pages/UsuariosPage'
import ActivarCuentaPage from './pages/ActivarCuentaPage'
import MiExpedientePage from './pages/MiExpedientePage'
import MisMedicionesPage from './pages/MisMedicionesPage'
import MiPlanPage from './pages/MiPlanPage'

function App() {
  return (
    <Routes>
      {/* LOGIN */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/activar-cuenta"
        element={<ActivarCuentaPage />}
      />

      {/* RUTAS PROTEGIDAS */}

      <Route
        element={
          <ProtectedRoute />
        }
      >
        <Route
          element={
            <DashboardLayout />
          }
        >
          {/* RESUMEN GENERAL */}

          <Route
            index
            element={
              <DashboardPage />
            }
          />

          {/* ============================================
              NUTRIÓLOGO
          ============================================ */}

          <Route
            element={
              <ProtectedRoute
                roles={[
                  'nutritionist',
                ]}
              />
            }
          >
            <Route
              path="pacientes"
              element={
                <PacientesPage />
              }
            />

            <Route
              path="pacientes/:pacienteId/expediente"
              element={
                <ExpedientePage />
              }
            />

            <Route
              path="mediciones"
              element={
                <MedicionesPage />
              }
            />

            <Route
              path="planes"
              element={
                <PlanesAlimenticiosPage />
              }
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                roles={[
                  'patient',
                ]}
              />
            }
          >
            <Route
              path="mi-expediente"
              element={<MiExpedientePage />}
            />

            <Route
              path="mis-mediciones"
              element={<MisMedicionesPage />}
            />

            <Route
              path="mi-plan"
              element={<MiPlanPage />}
            />
          </Route>

          {/* ============================================
              ADMINISTRADOR
          ============================================ */}

          <Route
            element={
              <ProtectedRoute
                roles={[
                  'admin',
                ]}
              />
            }
          >
            <Route
              path="usuarios"
              element={
                <UsuariosPage />
              }
            />
          </Route>
        </Route>
      </Route>

      {/* RUTA NO ENCONTRADA */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}

export default App
