import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Cloud, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Trava scroll vertical apenas enquanto o login está montado
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response.access_token) {
        localStorage.setItem("token", response.access_token);
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao realizar login. Verifique suas credenciais.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d1117] flex items-center justify-center">
      <div className="w-full max-w-[430px] h-dvh sm:h-auto flex flex-col bg-[#0d1117] text-[#e6edf3] overflow-hidden sm:rounded-3xl sm:ring-1 sm:ring-[#21262d] sm:shadow-[0_32px_80px_rgba(0,0,0,0.85)]">
        <div
          className="relative h-[200px] shrink-0 sm:rounded-t-3xl overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: "url('/login-hero.png')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/65" />
          <div className="absolute bottom-5 left-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[1.3rem] font-bold text-white leading-tight tracking-tight m-0">
                Climate Sync
              </h1>
              <p className="text-[0.72rem] text-white/75 m-0">
                Seu painel climático inteligente
              </p>
            </div>
          </div>
        </div>

        {/* ── Form area ─────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-6 py-6 overflow-y-auto">

          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="text-[1.7rem] font-extrabold text-[#f0f6fc] tracking-tight m-0 mb-1">
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-[#8b949e] m-0">
              Acesse para monitorar o clima em tempo real
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-4" noValidate>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-email"
                className="text-[0.83rem] font-semibold text-[#c9d1d9]"
              >
                Endereço de E-mail
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-3.5 pl-4 pr-12 bg-[#161b22] border border-[#21262d] rounded-2xl text-[0.95rem] text-[#c9d1d9] placeholder-[#484f58] outline-none transition-all duration-200 focus:border-[#388bfd] focus:ring-2 focus:ring-[#388bfd]/20"
                />
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#484f58] pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-[0.83rem] font-semibold text-[#c9d1d9]"
                >
                  Senha
                </label>
                <a
                  href="https://wa.me/5511977869073"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8rem] font-semibold text-[#388bfd] hover:text-[#58a6ff] transition-colors underline-offset-2 hover:underline"
                >
                  Esqueceu?
                </a>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-3.5 pl-4 pr-12 bg-[#161b22] border border-[#21262d] rounded-2xl text-[0.95rem] text-[#c9d1d9] placeholder-[#484f58] outline-none transition-all duration-200 focus:border-[#388bfd] focus:ring-2 focus:ring-[#388bfd]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center bg-transparent border-none cursor-pointer p-0 group"
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px] text-[#484f58] group-hover:text-[#8b949e] transition-colors" />
                  ) : (
                    <Eye className="w-[18px] h-[18px] text-[#484f58] group-hover:text-[#8b949e] transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isLoading}
              className="w-full py-4 mt-1 rounded-full border-none bg-gradient-to-r from-[#1f6feb] via-[#388bfd] to-[#58a6ff] text-white text-base font-bold tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(56,139,253,0.45)] transition-all duration-200 hover:opacity-90 hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(56,139,253,0.55)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Login
                  <ArrowRight className="w-[18px] h-[18px]" />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-[#8b949e] m-0">
            Não tem uma conta?{" "}
            <a
              href="https://wa.me/5511977869073"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#388bfd] font-semibold hover:text-[#58a6ff] transition-colors underline-offset-2 hover:underline"
            >
              entre em contato com o suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
