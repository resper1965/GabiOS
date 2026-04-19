import { WebChat } from "~/components/webchat/widget";

export function meta() {
  return [{ title: "WebChat — GabiOS" }];
}

export default function WebChatTest() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-surface-900 mb-2">
          WebChat Demo
        </h1>
        <p className="text-surface-500 mb-4">
          Clique no botão no canto inferior para conversar com o agente.
        </p>
        <p className="text-sm text-surface-400">
          Para funcionar, crie um agente com status "active" via API.
        </p>
      </div>

      {/* WebChat widget — replace with a real agent ID */}
      <WebChat agentId="test-agent" agentName="Assistente Demo" />
    </div>
  );
}
