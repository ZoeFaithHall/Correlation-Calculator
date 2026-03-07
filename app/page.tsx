export default function Home() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "1rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#111827", margin: 0 }}>
          Correlations Tool
        </h1>
      </header>

      <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <p style={{ color: "#4b5563", fontSize: "0.875rem" }}>
          Build your UI here. See <code>README.md</code> for
          the full task description and <code>POST /api/correlation</code> API reference.
        </p>
      </div>
    </main>
  );
}
