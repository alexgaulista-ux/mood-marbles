export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/registrar") {
      const { setor, sentimento } = await request.json();

      if (!setor || !sentimento) {
        return new Response("Dados inválidos", { status: 400 });
      }

      await env.DB.prepare(
        "INSERT INTO registros (setor, sentimento) VALUES (?, ?)"
      ).bind(setor, sentimento).run();

      return new Response("Registrado com sucesso", { status: 200 });
    }

    if (request.method === "GET" && url.pathname === "/resultados") {
      const { results } = await env.DB.prepare(
        `SELECT setor, sentimento, COUNT(*) as total
         FROM registros
         GROUP BY setor, sentimento`
      ).all();

      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Rota não encontrada", { status: 404 });
  }
};
