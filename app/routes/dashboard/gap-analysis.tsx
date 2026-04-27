import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

export default function GapAnalysis() {
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/standards/frameworks")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFrameworks(data.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const runAnalysis = async (frameworkId: string) => {
    setAnalyzing(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch("/api/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameworkId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gap Analysis</h1>
          <p className="text-muted-foreground">Avaliação autônoma contra normas globais (Aegis API)</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center gap-2 mb-6 border border-destructive/50">
          <AlertTriangle className="h-4 w-4" />
          <div className="flex-1">
            <h4 className="font-semibold">Erro</h4>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {!result && (
        <Card>
          <CardHeader>
            <CardTitle>Frameworks Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando frameworks...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {frameworks.map((fw) => (
                  <Card key={fw.id} className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{fw.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Controles: {fw.control_count} | Setor: {fw.sector || "Geral"}
                      </p>
                      <Button 
                        className="w-full" 
                        onClick={() => runAnalysis(fw.id)}
                        disabled={analyzing}
                      >
                        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Executar Análise"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <Button variant="outline" onClick={() => setResult(null)}>Voltar aos Frameworks</Button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Resultado: {result.standard}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{result.summary}</p>
                <div className="space-y-4">
                  {result.domains.map((domain: any, i: number) => (
                    <div key={i} className="border rounded p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{domain.name}</h3>
                        <span className="text-sm font-mono bg-secondary px-2 py-1 rounded">Score: {domain.score}</span>
                      </div>
                      <ul className="space-y-2 mt-4">
                        {domain.findings.map((f: any, j: number) => (
                          <li key={j} className="text-sm p-3 bg-secondary/30 rounded border border-border/50">
                            <span className="font-bold">{f.control}</span>: {f.finding}
                            <div className="mt-2 text-xs text-muted-foreground">Recomendação: {f.recommendation}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Score Geral</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="text-5xl font-bold text-primary mb-2">{result.overallCompliance}%</div>
                  <ShieldCheck className="h-12 w-12 text-muted-foreground opacity-20" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gaps Críticos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-destructive">
                    {result.criticalGaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Ações</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {result.nextActions.map((a: string, i: number) => <li key={i}>{a}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
