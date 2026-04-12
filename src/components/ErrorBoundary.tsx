import { Component, ReactNode } from "react";
import { secureStore } from "@/lib/store";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private handleReset = async () => {
    // Menghapus data dari tauri-plugin-store (Secure Store)
    await secureStore.delete("auth_token");
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 24,
            background: "#f8fafc",
            height: "100vh",
          }}
        >
          <h1 style={{ color: "#ef4444", marginBottom: 16 }}>
            ⚠️ Aplikasi Crash
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: 8 }}>Error:</p>
          <pre
            style={{
              color: "#fbbf24",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {this.state.error?.message}
          </pre>
          <pre
            style={{
              color: "#64748b",
              fontSize: 12,
              marginTop: 16,
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error?.stack}
          </pre>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: 24,
              padding: "10px 24px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Reset & Kembali ke Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
