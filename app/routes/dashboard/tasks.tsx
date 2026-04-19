import React, { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { TaskDialog } from "../../components/kanban/TaskDialog";

export async function loader({ context }: { context: any }) {
  const url = new URL(context.cloudflare.env.APP_ENV === "development" ? "http://localhost:8787" : "https://gabios.com"); // Ajuste o host
  const res = await context.cloudflare.env.DB.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
  return { tasks: res.results || [] };
}

export default function KanbanBoard() {
  const { tasks: initialTasks } = useLoaderData<typeof loader>();
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Sync loader data if it changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const columns = [
    { id: "open", title: "Backlog" },
    { id: "in_progress", title: "Working" },
    { id: "awaiting_approval", title: "Approval Gate" },
    { id: "done", title: "Done" },
  ];

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic UI
    setTasks((prev: any[]) => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    // API Call
    await fetch(`/api/tasks/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  return (
    <div className="h-full flex flex-col p-6 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Company Board</h1>
        <p className="text-slate-400 text-sm">Gerencie o fluxo de trabalho dos seus agentes autônomos.</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t: any) => {
            if (col.id === "in_progress") return ["queued", "in_progress"].includes(t.status);
            return t.status === col.id;
          });

          return (
            <div key={col.id} className="flex-1 min-w-[300px] flex flex-col bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-medium text-slate-300 text-sm uppercase tracking-wider">{col.title}</h3>
                <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full font-mono">{colTasks.length}</span>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colTasks.map((task: any) => (
                  <Card 
                    key={task.id} 
                    className={`bg-slate-900 border-slate-700 hover:border-slate-500 cursor-pointer transition-colors ${
                      task.status === "awaiting_approval" ? "ring-1 ring-orange-500/50 border-orange-500/50" : ""
                    }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-200">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">#{task.id.substring(0,6)}</span>
                      <span className="text-emerald-400">{task.cost_in_tokens || task.costInTokens || 0} tkn</span>
                    </CardContent>
                  </Card>
                ))}
                {colTasks.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-sm">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDialog 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onStatusChange={handleStatusChange} 
        />
      )}
    </div>
  );
}
