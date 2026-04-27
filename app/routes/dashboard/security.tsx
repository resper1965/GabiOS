import { useState, useEffect } from "react";
import { ShieldCheck, ShieldOff, Copy, Check, QrCode } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { twoFactor, getSession } from "~/lib/auth.client";

export function meta() {
  return [{ title: "Segurança — GabiOS" }];
}

type SetupState = "idle" | "enabling" | "verifying" | "enabled" | "disabling";

export default function SecuritySettings() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [state, setState] = useState<SetupState>("idle");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch session on mount (client-side only)
  useEffect(() => {
    getSession().then((res) => {
      const user = res.data?.user as Record<string, unknown> | undefined;
      if (user?.twoFactorEnabled) {
        setIs2FAEnabled(true);
      }
    }).catch(() => {});
  }, []);

  async function handleEnable() {
    setError("");
    setLoading(true);
    try {
      const result = await twoFactor.enable({ password });
      if (result.error) {
        setError(result.error.message || "Erro ao ativar 2FA");
      } else {
        setTotpURI(result.data?.totpURI || "");
        setBackupCodes(result.data?.backupCodes || []);
        setState("verifying");
      }
    } catch {
      setError("Erro ao ativar 2FA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError("");
    setLoading(true);
    try {
      const result = await twoFactor.verifyTotp({ code });
      if (result.error) {
        setError(result.error.message || "Código inválido");
      } else {
        setState("enabled");
      }
    } catch {
      setError("Erro ao verificar código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setError("");
    setLoading(true);
    try {
      const result = await twoFactor.disable({ password });
      if (result.error) {
        setError(result.error.message || "Erro ao desativar 2FA");
      } else {
        setState("idle");
      }
    } catch {
      setError("Erro ao desativar 2FA.");
    } finally {
      setLoading(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Segurança</h1>
        <p className="text-slate-400">
          Gerencie a autenticação em duas etapas da sua conta.
        </p>
      </div>

      {/* ─── 2FA Status Card ─────────────────────────── */}
      <Card variant="elevated" className="bg-slate-900 border-slate-800">
        <CardContent>
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                is2FAEnabled
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-slate-800 border border-slate-700"
              }`}
            >
              {is2FAEnabled ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <ShieldOff className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Autenticação em duas etapas (2FA)
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {is2FAEnabled
                  ? "Sua conta está protegida com autenticação TOTP."
                  : "Adicione uma camada extra de segurança usando Google Authenticator, Authy ou outro app TOTP."}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    is2FAEnabled
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      is2FAEnabled ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  {is2FAEnabled ? "Ativo" : "Desativado"}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
              {error}
            </div>
          )}

          {/* ─── Idle: Enable or Disable ──── */}
          {state === "idle" && !is2FAEnabled && (
            <div className="space-y-4">
              <Input
                label="Confirme sua senha"
                type="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                onClick={handleEnable}
                loading={loading}
                disabled={!password}
                className="w-full"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Ativar 2FA
              </Button>
            </div>
          )}

          {state === "idle" && is2FAEnabled && (
            <div className="space-y-4">
              <Input
                label="Confirme sua senha para desativar"
                type="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button
                variant="outline"
                onClick={handleDisable}
                loading={loading}
                disabled={!password}
                className="w-full border-danger-500/30 text-danger-400 hover:bg-danger-500/10"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Desativar 2FA
              </Button>
            </div>
          )}

          {/* ─── Verifying: QR + Code Input ──── */}
          {state === "verifying" && (
            <div className="space-y-6">
              {/* QR Code Section */}
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">
                    Escaneie com seu app autenticador
                  </span>
                </div>
                {totpURI && (
                  <div className="bg-white p-4 rounded-lg w-fit mx-auto">
                    {/* 
                      In production, render a QR code from totpURI using a library like 'qrcode.react'.
                      For now we show the URI for manual entry.
                    */}
                    <div className="text-center text-xs text-slate-600 break-all max-w-[250px]">
                      <p className="font-medium text-slate-800 mb-1">URI para entrada manual:</p>
                      <code className="text-[10px]">{totpURI}</code>
                    </div>
                  </div>
                )}
              </div>

              {/* Backup Codes */}
              {backupCodes.length > 0 && (
                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-amber-400">
                      Códigos de backup — salve-os com segurança!
                    </span>
                    <button
                      onClick={copyBackupCodes}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {backupCodes.map((code, i) => (
                      <code
                        key={i}
                        className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 font-mono text-center"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Verify Code */}
              <div className="space-y-3">
                <Input
                  label="Código do autenticador"
                  type="text"
                  name="totp-verify"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-center text-xl tracking-[0.4em] font-mono"
                />
                <Button
                  onClick={handleVerify}
                  loading={loading}
                  disabled={code.length !== 6}
                  className="w-full"
                >
                  Confirmar ativação
                </Button>
              </div>
            </div>
          )}

          {/* ─── Enabled: Success ──── */}
          {state === "enabled" && (
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-300 font-medium">
                2FA ativado com sucesso!
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Sua conta agora está protegida com autenticação em duas etapas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
