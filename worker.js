export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

   if (request.method === "POST" && url.pathname === "/login") {
  const { usuario, senha } = await request.json();
  if (!usuario || !senha) {
    return new Response(JSON.stringify({ sucesso: false, erro: "Dados inválidos" }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    });
  }

  const { results } = await env.DB.prepare(
    "SELECT 1 FROM usuarios WHERE usuario = ? AND senha = ?"
  ).bind(usuario, senha).all();

  return new Response(JSON.stringify({ sucesso: results.length > 0 }), {
    headers: { "Content-Type": "application/json" }
  });
}

