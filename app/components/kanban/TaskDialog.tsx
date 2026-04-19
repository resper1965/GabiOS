import { useEffect, useState } from "react";
import { Button } from "../ui/button";

// ─── Types ────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  status: string;
  costInTokens: number;
  cost_in_tokens?: number;
}

interface TaskEvent {
  id: string;
  taskId: string;
  actorId: string;
  actorType: string;
  eventType: string;
  details: string;
  createdAt: string;
}

interface TaskDialogProps {
  task: Task;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}

export function TaskDialog({ task, onClose, onStatusChange }: TaskDialogProps) {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tasks/${task.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data?.events) setEvents(data.data.events);
        setLoading(false);
      });
  }, [task.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "awaiting_approval": return "text-orange-500";
      case "in_progress": return "text-blue-500";
      case "done": return "text-green-500";
      case "failed": return "text-red-500";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-[800px] h-[600px] flex overflow-hidden shadow-2xl">
        {/* Left Pane - Details */}
        <div className="w-1/3 border-r border-slate-800 p-6 flex flex-col bg-slate-900/50">
          <h2 className="text-xl font-semibold text-white mb-2">{task.title}</h2>
          <p className="text-xs text-slate-400 font-mono mb-4">ID: {task.id.split('-')[0]}</p>
          
          <div className="mb-6">
            <span className="text-xs text-slate-500 uppercase font-semibold">Status</span>
            <p className={`font-medium ${getStatusColor(task.status)} capitalize`}>{task.status.replace("_", " ")}</p>
          </div>

          <div className="mb-6">
            <span className="text-xs text-slate-500 uppercase font-semibold">Custo Atual</span>
            <p className="text-lg font-mono text-emerald-400">{task.costInTokens || task.cost_in_tokens || 0} tkns</p>
          </div>

          <div className="mt-auto space-y-2">
            {task.status === "awaiting_approval" && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
                <p className="text-orange-400 text-xs mb-3 font-medium">Approval Required</p>
                <div className="flex gap-2">
                  <Button variant="default" className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={() => onStatusChange(task.id, "in_progress")}>Approve</Button>
                  <Button variant="destructive" className="w-full" onClick={() => onStatusChange(task.id, "failed")}>Reject</Button>
                </div>
              </div>
            )}
            
            <Button variant="outline" className="w-full" onClick={() => onStatusChange(task.id, "done")}>Force Complete</Button>
            <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
          </div>
        </div>

        {/* Right Pane - Log */}
        <div className="w-2/3 bg-black flex flex-col">
          <div className="border-b border-slate-800 p-3 bg-slate-900">
            <h3 className="text-xs font-mono text-slate-400">Task Event Ledger (Agent Mind)</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-xs">
            {loading ? (
              <div className="text-slate-500 animate-pulse">Rehydrating context...</div>
            ) : events.length === 0 ? (
              <div className="text-slate-600">No events logged yet.</div>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="border-l-2 border-slate-700 pl-3 py-1">
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span>[{new Date(ev.createdAt).toLocaleTimeString()}] {ev.actorType}:{ev.actorId.substring(0,6)}</span>
                    <span className="uppercase text-[10px] text-slate-600">{ev.eventType}</span>
                  </div>
                  <div className="text-slate-300">
                    {(() => {
                      try {
                        const parsed = JSON.parse(ev.details);
                        if (ev.eventType === "approval_request") return <span className="text-orange-400">{parsed.reason}</span>;
                        if (ev.eventType === "status_change") return <span className="text-blue-400">Status changed from {parsed.previous} to {parsed.current}</span>;
                        return JSON.stringify(parsed, null, 2);
                      } catch {
                        return ev.details;
                      }
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
