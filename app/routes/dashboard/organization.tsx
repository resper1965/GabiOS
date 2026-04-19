import { useLoaderData } from "react-router";
import { Building2, Bot, Plus, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export async function loader({ context }: { context: any }) {
  const url = new URL(context.cloudflare.env.APP_ENV === "development" ? "http://localhost:8787" : "https://gabios.com");
  
  // Como estamos testando o DB via worker binding diretamente no SSR do Hono/ReactRouter:
  const db = context.cloudflare.env.DB;
  
  const depts = await db.prepare("SELECT * FROM departments").all();
  const roles = await db.prepare("SELECT * FROM agent_roles").all();
  
  const orgStructure = (depts.results || []).map(dept => {
    return {
      ...dept,
      roles: (roles.results || []).filter(r => r.department_id === dept.id || r.departmentId === dept.id)
    };
  });
  
  return { organization: orgStructure };
}

export default function OrganizationPage() {
  const { organization } = useLoaderData<typeof loader>();

  return (
    <div className="h-full flex flex-col p-6 text-white overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Organization</h1>
          <p className="text-slate-400 text-sm">Gerencie departamentos, orçamentos e cargos (Roles) da sua empresa de IAs.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Novo Departamento
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {organization.map((dept: any) => (
          <Card key={dept.id} className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-200">{dept.name}</CardTitle>
                  <p className="text-xs text-slate-500 font-mono">ID: {dept.id.substring(0,8)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Monthly Budget</span>
                <span className="text-emerald-400 font-mono font-medium">{dept.budgetLimit || dept.budget_limit} tkns</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400">Agent Roles ({dept.roles?.length || 0})</h3>
                <Button variant="outline" size="sm" className="h-7 text-xs border-slate-700 text-slate-300">
                  <Plus className="w-3 h-3 mr-1" /> Add Role
                </Button>
              </div>
              
              <div className="space-y-3">
                {dept.roles?.length > 0 ? (
                  dept.roles.map((role: any) => (
                    <div key={role.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/30">
                      <div className="flex items-center gap-3">
                        <Bot className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-200">{role.title}</p>
                          <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={role.instructions}>{role.instructions}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-md">{role.model || role.modelId}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg">
                    <p className="text-slate-500 text-sm">Nenhum Agent Role definido.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {organization.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <Landmark className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Sem Organograma</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Sua empresa ainda não possui departamentos ou agentes. Comece criando um departamento para alocar orçamento e regras.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
