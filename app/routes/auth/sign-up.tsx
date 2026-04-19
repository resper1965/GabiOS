import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Bot } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent } from "~/components/ui/card";
import { signUp } from "~/lib/auth.client";

export function meta() {
  return [{ title: "Criar conta — GabiOS" }];
}

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      setLoading(false);
      return;
    }

    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message || "Erro ao criar conta");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-accent-900/10" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">GabiOS</span>
          </Link>
        </div>

        <Card variant="elevated" className="bg-surface-900 border-surface-800">
          <CardContent>
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-white">Criar sua conta</h1>
              <p className="text-surface-400 text-sm mt-1">Comece a criar seus agentes de IA</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-400 text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Nome"
                type="text"
                name="name"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-surface-800 border-surface-700 text-white placeholder:text-surface-500"
              />

              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-surface-800 border-surface-700 text-white placeholder:text-surface-500"
              />

              <Input
                label="Senha"
                type="password"
                name="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="Mínimo de 8 caracteres"
                className="bg-surface-800 border-surface-700 text-white placeholder:text-surface-500"
              />

              <Button type="submit" loading={loading} className="w-full">
                Criar conta
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-surface-400">
              Já tem uma conta?{" "}
              <Link to="/auth/sign-in" className="text-primary-400 hover:text-primary-300 font-medium">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
