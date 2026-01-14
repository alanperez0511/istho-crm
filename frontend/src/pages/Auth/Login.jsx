/**
 * ============================================================================
 * ISTHO CRM - Página de Login
 * ============================================================================
 * Página de inicio de sesión con diseño corporativo ISTHO.
 * Incluye validación de formulario con React Hook Form + Yup.
 * 
 * @author Coordinación TI ISTHO
 * @version 1.0.0
 * @date Enero 2026
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// ICONOS SVG (inline para evitar dependencias)
// ============================================================================

const EyeIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

const MailIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LockIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const AlertIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SpinnerIcon = ({ className }) => (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

// ============================================================================
// ESQUEMA DE VALIDACIÓN
// ============================================================================

const loginSchema = yup.object({
    email: yup
        .string()
        .required('El email es requerido')
        .email('Ingresa un email válido'),
    password: yup
        .string()
        .required('La contraseña es requerida')
        .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// ============================================================================
// COMPONENTE
// ============================================================================

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isLoading: authLoading, error: authError, clearError } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Obtener la ruta de origen (si viene de una redirección)
    const from = location.state?.from || '/dashboard';

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors },
        setFocus,
    } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // EFECTOS
    // ──────────────────────────────────────────────────────────────────────────

    // Redirigir si ya está autenticado
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, authLoading, navigate, from]);

    // Focus en email al montar
    useEffect(() => {
        setFocus('email');
    }, [setFocus]);

    // Limpiar errores al desmontar
    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    // ──────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ──────────────────────────────────────────────────────────────────────────

    const onSubmit = async (data) => {
        setIsSubmitting(true);

        try {
            const result = await login(data.email, data.password);

            if (result.success) {
                // Redirigir a la página original o dashboard
                navigate(from, { replace: true });
            }
        } catch (error) {
            console.error('Error en login:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePassword = () => setShowPassword(prev => !prev);

    // ──────────────────────────────────────────────────────────────────────────
    // RENDER
    // ──────────────────────────────────────────────────────────────────────────

    // Mostrar loading si está verificando autenticación
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <SpinnerIcon className="w-10 h-10 text-[#E65100]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* LADO IZQUIERDO - Formulario */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Logo y Título */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#E65100] to-[#FF6D00] rounded-2xl shadow-lg mb-4">
                            <span className="text-white font-bold text-2xl">I</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Bienvenido al CRM
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Ingresa tus credenciales para continuar
                        </p>
                    </div>

                    {/* Mensaje de error */}
                    {authError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                            <AlertIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800">
                                    Error de autenticación
                                </p>
                                <p className="text-sm text-red-600 mt-1">
                                    {authError}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Campo Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MailIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="usuario@istho.com.co"
                                    {...register('email')}
                                    className={`
                    w-full pl-12 pr-4 py-3 rounded-xl border bg-gray-50
                    focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100]
                    transition-all duration-200
                    ${errors.email
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                            : 'border-gray-200'
                                        }
                  `}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <AlertIcon className="w-4 h-4" />
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Campo Contraseña */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    {...register('password')}
                                    className={`
                    w-full pl-12 pr-12 py-3 rounded-xl border bg-gray-50
                    focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100]
                    transition-all duration-200
                    ${errors.password
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                            : 'border-gray-200'
                                        }
                  `}
                                />
                                <button
                                    type="button"
                                    onClick={togglePassword}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOffIcon className="w-5 h-5" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <AlertIcon className="w-4 h-4" />
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Recordar / Olvidé contraseña */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-[#E65100] focus:ring-[#E65100]"
                                />
                                <span className="text-sm text-gray-600">Recordarme</span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-[#E65100] hover:text-[#BF360C] font-medium transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {/* Botón Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`
                w-full py-3 px-4 rounded-xl font-semibold text-white
                bg-gradient-to-r from-[#E65100] to-[#FF6D00]
                hover:from-[#BF360C] hover:to-[#E65100]
                focus:outline-none focus:ring-2 focus:ring-[#E65100] focus:ring-offset-2
                transition-all duration-200
                disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                shadow-lg shadow-orange-500/25
              `}
                        >
                            {isSubmitting ? (
                                <>
                                    <SpinnerIcon className="w-5 h-5" />
                                    <span>Iniciando sesión...</span>
                                </>
                            ) : (
                                <span>Iniciar Sesión</span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            ¿Problemas para acceder?{' '}
                            <a
                                href="mailto:soporte@istho.com.co"
                                className="text-[#E65100] hover:text-[#BF360C] font-medium"
                            >
                                Contactar soporte
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* LADO DERECHO - Branding */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#E65100] via-[#FF6D00] to-[#FF8F00] relative overflow-hidden">
                {/* Patrón de fondo */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Círculos decorativos */}
                <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

                {/* Contenido */}
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
                    {/* Logo grande */}
                    <div className="mb-8">
                        <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl">
                            <span className="text-white font-bold text-6xl">ISTHO</span>
                        </div>
                    </div>

                    <h2 className="text-4xl font-bold mb-4 text-center">
                        Sistema CRM
                    </h2>

                    <p className="text-xl text-white/80 text-center max-w-md mb-8">
                        Gestión integral de clientes, inventario y operaciones logísticas
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                        {[
                            { icon: '📊', text: 'Dashboard en tiempo real' },
                            { icon: '👥', text: 'Gestión de clientes' },
                            { icon: '📦', text: 'Control de inventario' },
                            { icon: '🚚', text: 'Trazabilidad de despachos' },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"
                            >
                                <span className="text-2xl">{feature.icon}</span>
                                <span className="text-sm font-medium">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-8 text-center">
                        <p className="text-white/60 text-sm">
                            ISTHO S.A.S. © 2026 - Centro Logístico Industrial del Norte
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                            Girardota, Antioquia • ISO 9001:2015
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// EXPORT
// ============================================================================

export default LoginPage;