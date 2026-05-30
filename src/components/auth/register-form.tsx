"use client";

import { useState }      from "react";
import { useForm }       from "react-hook-form";
import { zodResolver }   from "@hookform/resolvers/zod";
import { z }             from "zod";
import Link              from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { createClient }  from "@/lib/supabase/client";
import { LogoFull }      from "@/components/ui/logo";

const schema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  email:     z.string().email("Email inválido"),
  password:  z.string().min(8, "Mínimo 8 caracteres"),
  confirm:   z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Las contraseñas no coinciden",
  path:    ["confirm"],
});
type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const [showPwd, setShowPwd] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options: {
        data:        { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  if (done) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-400" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-slate-100 mb-2">¡Revisa tu email!</h2>
        <p className="text-sm text-slate-400 mb-6">
          Te enviamos un enlace de confirmación. Haz clic en él para activar tu cuenta y acceder a Infrale 3D.
        </p>
        <Link href="/login" className="btn-secondary w-full justify-center">
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card p-8">
      <div className="mb-8">
        <LogoFull size={32} />
      </div>

      <h2 className="text-lg font-semibold text-slate-100 mb-1">Crear cuenta</h2>
      <p className="text-sm text-slate-500 mb-6">Empieza a gestionar tus infraestructuras 3D</p>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Nombre completo</label>
          <input {...register("full_name")} type="text" placeholder="Juan Pérez" className="input-field" />
          {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="label">Email</label>
          <input {...register("email")} type="email" placeholder="tu@empresa.com" className="input-field" />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Contraseña</label>
          <div className="relative">
            <input {...register("password")} type={showPwd ? "text" : "password"} placeholder="Mínimo 8 caracteres" className="input-field pr-10" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">Confirmar contraseña</label>
          <input {...register("confirm")} type={showPwd ? "text" : "password"} placeholder="Repite la contraseña" className="input-field" />
          {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full divider" /></div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-brand-900 text-slate-500">o regístrate con</span>
        </div>
      </div>

      <button onClick={signInWithGoogle} disabled={googleLoading} className="btn-secondary w-full justify-center">
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Google
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand-200 hover:text-cyan-300 transition-colors font-medium">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
