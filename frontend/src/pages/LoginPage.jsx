import { zodResolver } from "@hookform/resolvers/zod";
import {
  Apple,
  BarChart3,
  Eye,
  EyeOff,
  Heart,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../context/auth";

const schema = z.object({
  email: z
    .string()
    .trim()
    .email("Ingresa un correo válido"),

  password: z
    .string()
    .min(
      8,
      "La contraseña debe tener al menos 8 caracteres",
    ),
});

function LoginPage() {
  const {
    loginGoogle,
    loginPaciente,
    user,
  } = useAuth();

  const [apiError, setApiError] =
    useState("");

  const [googleError, setGoogleError] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(true);

  const googleButtonRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    formState: {
      errors,
      isSubmitting,
    },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      return undefined;
    }

    const clientId =
      import.meta.env
        .VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setGoogleError(
        "Google no está configurado correctamente",
      );

      setGoogleLoading(false);

      return undefined;
    }

    async function handleGoogleCredential(
      response,
    ) {
      setGoogleError("");

      try {
        await loginGoogle(
          response.credential,
        );

        navigate(
          location.state?.from?.pathname ||
            "/",
          {
            replace: true,
          },
        );
      } catch (error) {
        setGoogleError(
          error.response?.data?.message ||
            "No fue posible iniciar sesión con Google",
        );
      }
    }

    function initializeGoogle() {
      if (
        !window.google?.accounts?.id ||
        !googleButtonRef.current
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback:
          handleGoogleCredential,
      });

      googleButtonRef.current.innerHTML =
        "";

      const availableWidth =
        googleButtonRef.current
          .parentElement?.clientWidth ||
        340;

      const googleButtonWidth =
        Math.min(
          340,
          Math.max(
            220,
            availableWidth - 8,
          ),
        );

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width:
            googleButtonWidth,
        },
      );

      setGoogleLoading(false);
    }

    if (
      window.google?.accounts?.id
    ) {
      initializeGoogle();

      return undefined;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        initializeGoogle,
      );

      return () => {
        existingScript.removeEventListener(
          "load",
          initializeGoogle,
        );
      };
    }

    const script =
      document.createElement(
        "script",
      );

    script.src =
      "https://accounts.google.com/gsi/client";

    script.async = true;
    script.defer = true;

    script.onload =
      initializeGoogle;

    script.onerror = () => {
      setGoogleError(
        "No fue posible cargar el acceso con Google",
      );

      setGoogleLoading(false);
    };

    document.head.appendChild(
      script,
    );

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [
    location.state,
    loginGoogle,
    navigate,
    user,
  ]);

  if (user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  async function onSubmit(
    values,
  ) {
    setApiError("");

    try {
      await loginPaciente(
        values,
      );

      navigate(
        location.state?.from
          ?.pathname || "/",
        {
          replace: true,
        },
      );
    } catch (error) {
      setApiError(
        error.response?.data
          ?.message ||
          "No fue posible iniciar sesión",
      );
    }
  }

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#edf2e7] lg:h-[100dvh] lg:overflow-hidden">
      {/* FONDO */}

      <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#7f9563]/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[500px] w-[500px] rounded-full bg-[#315c49]/15 blur-3xl" />

      {/* CONTENEDOR GENERAL */}

      <div className="relative min-h-[100dvh] p-0 lg:h-full lg:min-h-0 lg:p-4">
        <div className="grid min-h-[100dvh] w-full bg-white shadow-[0_35px_90px_rgba(28,67,53,0.16)] lg:h-full lg:min-h-0 lg:grid-cols-[0.95fr_1.05fr] lg:overflow-hidden lg:rounded-[32px]">
          {/* PANEL IZQUIERDO */}

          <section className="relative hidden h-full overflow-hidden bg-gradient-to-br from-[#e5ecd8] via-[#eef2df] to-[#d6e1ca] px-10 py-8 lg:flex lg:flex-col lg:justify-between xl:px-14">
            <div className="absolute -left-16 top-[32%] h-72 w-72 rounded-full bg-[#6f8957]/10" />

            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/40" />

            {/* LOGO */}

            <div className="relative z-10 text-center">
              <img
                src="/imagenes/logo-nutria.png"
                alt="NutriA"
                className="mx-auto max-h-[190px] w-[230px] object-contain xl:w-[260px]"
              />

              <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#60754f]">
                Hábitos hoy, un mejor mañana
              </p>
            </div>

            {/* MENSAJE */}

            <div className="relative z-10 mx-auto max-w-xl text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#b9c9a9] bg-white/45 px-4 py-1.5">
                <Leaf
                  size={14}
                  className="text-[#5d7747]"
                />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5e7251]">
                  Bienestar que acompaña
                </span>
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-[#173f34] xl:text-[46px]">
                Tu bienestar
                <span className="block text-[#758f55]">
                  comienza aquí.
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#5e6e67] xl:text-base">
                Una plataforma para mejorar tu
                relación con la alimentación,
                seguir tu progreso y construir
                hábitos sostenibles.
              </p>
            </div>

            {/* BENEFICIOS */}

            <div className="relative z-10 mx-auto grid w-full max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/70 bg-white/55 p-4 text-center backdrop-blur">
                <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl bg-[#d9e5cd] text-[#356047]">
                  <Apple size={17} />
                </div>

                <p className="text-xs font-extrabold text-[#173f34]">
                  Nutrición
                </p>

                <p className="mt-1 text-[11px] text-[#718078]">
                  Planes personalizados
                </p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/55 p-4 text-center backdrop-blur">
                <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl bg-[#e1e6ce] text-[#627542]">
                  <Heart size={17} />
                </div>

                <p className="text-xs font-extrabold text-[#173f34]">
                  Bienestar
                </p>

                <p className="mt-1 text-[11px] text-[#718078]">
                  Hábitos sostenibles
                </p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/55 p-4 text-center backdrop-blur">
                <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl bg-[#d8e1d8] text-[#355c4d]">
                  <BarChart3
                    size={17}
                  />
                </div>

                <p className="text-xs font-extrabold text-[#173f34]">
                  Progreso
                </p>

                <p className="mt-1 text-[11px] text-[#718078]">
                  Resultados visibles
                </p>
              </div>
            </div>

            <p className="relative z-10 text-center text-xs font-semibold italic text-[#697a58]">
              Cuidar de ti también es un logro.
            </p>
          </section>

          {/* PANEL DERECHO */}

          <section className="flex min-h-[100dvh] w-full items-start justify-center bg-[#fbfaf5] px-4 py-5 sm:px-7 sm:py-6 lg:h-full lg:min-h-0 lg:items-center lg:px-10 lg:py-5 xl:px-14">
            <div className="w-full min-w-0 max-w-[520px]">
              {/* LOGO MÓVIL */}

              <div className="mb-2 text-center lg:hidden">
                <img
                  src="/imagenes/logo-nutria.png"
                  alt="NutriA"
                  className="mx-auto max-h-[105px] w-[140px] object-contain sm:max-h-[130px] sm:w-[165px]"
                />
              </div>

              {/* HEADER */}

              <div className="text-center">
                <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#718557] sm:text-[10px] lg:text-xs">
                  Bienvenido a NutriA
                </p>

                <h2 className="text-[28px] font-black leading-tight tracking-tight text-[#163f34] sm:text-3xl lg:text-4xl">
                  Inicia sesión
                </h2>

                <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-[#6c7772] sm:text-sm">
                  Selecciona el acceso
                  correspondiente a tu cuenta.
                </p>
              </div>

              {/* PERSONAL */}

              <div className="mt-4 min-w-0 rounded-[20px] border border-[#ccd9c6] bg-[#edf3e8] p-3.5 shadow-[0_10px_28px_rgba(41,82,64,0.07)] sm:p-4 lg:mt-5 lg:p-5">
                <div className="mb-3 flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d3e4c9] text-[#285c45] sm:h-11 sm:w-11">
                    <ShieldCheck
                      size={19}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#173f34] sm:text-base">
                      Personal de NutriA
                    </h3>

                    <p className="text-[11px] text-[#6d7973] sm:text-xs">
                      Administradores y nutriólogos
                    </p>
                  </div>
                </div>

                {/* GOOGLE */}

                <div className="w-full min-w-0 overflow-hidden rounded-xl border border-[#c7d4ce] bg-white px-2 py-1.5 shadow-[0_6px_18px_rgba(35,72,57,0.07)]">
                  <div className="relative flex min-h-[40px] w-full min-w-0 justify-center overflow-hidden">
                    {googleLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <LoaderCircle
                          className="animate-spin text-[#246b55]"
                          size={18}
                        />
                      </div>
                    )}

                    <div
                      ref={
                        googleButtonRef
                      }
                      className={`max-w-full overflow-hidden ${
                        googleLoading
                          ? "invisible"
                          : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold text-[#5b6f65] sm:text-[11px]">
                  <LockKeyhole
                    size={12}
                    className="shrink-0"
                  />

                  <span>
                    Solo cuentas previamente
                    autorizadas
                  </span>
                </div>

                {googleError && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-[#fff1f1] px-3 py-2 text-center text-[11px] font-semibold text-red-600 sm:text-xs">
                    {googleError}
                  </div>
                )}
              </div>

              {/* SEPARADOR */}

              <div className="my-3 flex items-center gap-3 lg:my-4">
                <div className="h-px flex-1 bg-[#d2d8d2]" />

                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#cdd8d0] bg-[#f7f8f4] text-[10px] font-extrabold text-[#859089]">
                  o
                </span>

                <div className="h-px flex-1 bg-[#d2d8d2]" />
              </div>

              {/* PACIENTE */}

              <div className="min-w-0 rounded-[20px] border border-[#dfd7c7] bg-[#f7f1e6] p-3.5 shadow-[0_10px_28px_rgba(94,76,48,0.06)] sm:p-4 lg:p-5">
                <div className="mb-3 flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9dec6] text-[#355b4c] sm:h-11 sm:w-11">
                    <UserRound
                      size={19}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-[#173f34] sm:text-base">
                      Paciente
                    </h3>

                    <p className="text-[11px] text-[#776f63] sm:text-xs">
                      Accede con tu correo y contraseña
                    </p>
                  </div>
                </div>

                <form
                  className="space-y-3"
                  onSubmit={handleSubmit(
                    onSubmit,
                  )}
                  noValidate
                >
                  {/* EMAIL */}

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-[11px] font-bold text-[#2d4c42] sm:text-xs"
                    >
                      Correo electrónico
                    </label>

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="paciente@correo.com"
                      className="w-full min-w-0 rounded-xl border border-[#c9d2cd] bg-[#fffefa] px-3.5 py-2.5 text-sm text-[#173f34] shadow-inner outline-none transition placeholder:text-[#a8b1ad] focus:border-[#678463] focus:bg-white focus:ring-4 focus:ring-[#dce7d9]"
                      {...register(
                        "email",
                      )}
                    />

                    {errors.email && (
                      <p className="mt-1 text-[10px] text-red-600">
                        {
                          errors.email
                            .message
                        }
                      </p>
                    )}
                  </div>

                  {/* PASSWORD */}

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-[11px] font-bold text-[#2d4c42] sm:text-xs"
                    >
                      Contraseña
                    </label>

                    <div className="relative min-w-0">
                      <input
                        id="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="current-password"
                        placeholder="Mínimo 8 caracteres"
                        className="w-full min-w-0 rounded-xl border border-[#c9d2cd] bg-[#fffefa] px-3.5 py-2.5 pr-11 text-sm text-[#173f34] shadow-inner outline-none transition placeholder:text-[#a8b1ad] focus:border-[#678463] focus:bg-white focus:ring-4 focus:ring-[#dce7d9]"
                        {...register(
                          "password",
                        )}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (
                              current,
                            ) =>
                              !current,
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#83908a] transition hover:text-[#315c49]"
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff
                            size={18}
                          />
                        ) : (
                          <Eye
                            size={18}
                          />
                        )}
                      </button>
                    </div>

                    {errors.password && (
                      <p className="mt-1 text-[10px] text-red-600">
                        {
                          errors
                            .password
                            .message
                        }
                      </p>
                    )}
                  </div>

                  {apiError && (
                    <div className="rounded-lg border border-red-200 bg-[#fff1f1] px-3 py-2 text-center text-[11px] font-semibold text-red-600 sm:text-xs">
                      {apiError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#246b55] px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(36,107,85,0.18)] transition hover:bg-[#1d5947] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting && (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    )}

                    {isSubmitting
                      ? "Ingresando..."
                      : "Iniciar sesión"}
                  </button>
                </form>
              </div>

              <p className="mt-4 pb-2 text-center text-[10px] leading-4 text-[#8b938f] sm:text-[11px] lg:pb-0">
                NutriA · Plataforma de seguimiento
                nutricional
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;