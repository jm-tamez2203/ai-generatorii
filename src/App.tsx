import { useState, type FormEvent } from "react";
import { Loader } from "@aws-amplify/ui-react";
import "./App.css";

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import amplifyOutputs from "./amplify_outputs.json";

import "@aws-amplify/ui-react/styles.css";

// Configura Amplify
Amplify.configure(amplifyOutputs);

// Crea cliente Amplify Data
const amplifyClient = generateClient<Schema>({
  authMode: "userPool",
});

// Tipo de mensaje para historial
type Message = {
  role: "user" | "assistant";
  content: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const prompt = formData.get("prompt")?.toString().trim();

    if (!prompt) {
      setLoading(false);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    (event.currentTarget.elements.namedItem("prompt") as HTMLInputElement).value = "";

    try {
      const { data, errors } = await amplifyClient.queries.askBedrock({ prompt });

      const response = data?.body || "No response received.";

      if (!errors) {
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "An error occurred while processing your prompt." },
        ]);
        console.error(errors);
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Unexpected error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const lastAssistantMessage = [...messages].reverse().find((msg) => msg.role === "assistant");
    if (lastAssistantMessage) {
      navigator.clipboard.writeText(lastAssistantMessage.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="app-container">
      <div className="header-container">
        <h1 className="main-header">Gelpharma - Vitae</h1>
        <h1 className="main-header">Tu asesor personal de Mejora Continua</h1>
        <p className="description">Pregunta algo y te responderé</p>
      </div>

      <div className="chat-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.role === "user" ? "user-message" : "assistant-message"}`}
          >
            <strong>{msg.role === "user" ? "Tu" : "Asesor"}:</strong> {msg.content}
          </div>
        ))}

        {loading && (
          <div className="assistant-message">
            <strong>Asesor:</strong> <Loader size="small" />
          </div>
        )}

        {/* Mostrar botón solo si hay al menos una respuesta */}
        {messages.some((msg) => msg.role === "assistant") && (
          <button className="copy-button" onClick={handleCopy}>
            📋 {copied ? "¡Copiado!" : "Copiar respuesta"}
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="chat-input-container">
        <input
          type="text"
          name="prompt"
          className="chat-input"
          placeholder="Escribe tu mensaje..."
          autoComplete="off"
        />
        <button type="submit" className="send-button" disabled={loading}>
          Enviar
        </button>
      </form>
    </div>
  );
}

export default App;
