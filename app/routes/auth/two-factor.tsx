import { useState } from "react";
import { useNavigate } from "react-router";
import { Bot, ShieldCheck } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { twoFactor } from "~/lib/auth.client";

export function meta() {
  return [{ title: "Verificação 2FA — GabiOS" }];
}

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await twoFactor.verifyTotp({ code });
      if (result.error) {
        setError(result.error.message || "Código inválido");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Erro ao verificar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-accent-900/10" />

      <div className="relative w-full max-w-md">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Verificação em duas etapas</h1>
          <p className="text-surface-400 text-sm mt-2">
            Insira o código de 6 dígitos do seu app autenticador
          </p>
        </div>

        <Card variant="elevated" className="bg-surface-900 border-surface-800">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Código TOTP"
                type="text"
                name="totp-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                className="bg-surface-800 border-surface-700 text-white placeholder:text-surface-500 text-center text-2xl tracking-[0.5em] font-mono"
              />

              <Button type="submit" loading={loading} className="w-full">
                Verificar
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-surface-800">
              <p className="text-sm text-surface-500 text-center">
                Perdeu acesso ao autenticador?{" "}
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Backup code flow
                  }}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Usar código de backup
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
