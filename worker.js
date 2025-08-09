export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // LOGIN
    if (path === "/login" && request.method === "POST") {
      const { usuario, senha } = await request.json();
      const { results } = await env.DB
        .prepare("SELECT * FROM usuarios WHERE usuario = ? AND senha = ?")
        .bind(usuario, senha)
        .all();

      if (results.length > 0) {
        return new Response(JSON.stringify({ sucesso: true }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } else {
        return new Response(JSON.stringify({ sucesso: false, mensagem: "Credenciais inválidas" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    return new Response("Rota não encontrada", { status: 404, headers: corsHeaders });
  },
};
