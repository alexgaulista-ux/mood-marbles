export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Função para respostas com CORS
    const jsonResponse = (data, status = 200) =>
      new Response(
        typeof data === "string" ? data : JSON.stringify(data),
        {
          status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        }
      );

    // Tratar pré-requisições OPTIONS (CORS)
    if (request.method === "OPTIONS") {
      return jsonResponse("ok", 200);
    }

    // Rota para registrar sentimento
    if (request.method === "POST" && url.pathname === "/registrar") {
      try {
        const { setor, sentimento } = await request.json();
        if (!setor || !sentimento) {
          return jsonResponse({ erro: "Dados inválidos" }, 400);
        }

        await env.DB.prepare(
          "INSERT INTO registros (setor, sentimento) VALUES (?, ?)"
        ).bind(setor, sentimento).run();

        return jsonResponse({ sucesso: true, mensagem: "Registrado com sucesso" });
      } catch (err) {
        return jsonResponse({ erro: err.message }, 500);
      }
    }

    // Rota para obter resultados
    if (request.method === "GET" && url.pathname === "/resultados") {
      try {
        const { results } = await env.DB.prepare(
          `SELECT setor, sentimento, COUNT(*) as total
           FROM registros
           GROUP BY setor, sentimento`
        ).all();

        return jsonResponse(results);
      } catch (err) {
        return jsonResponse({ erro: err.message }, 500);
      }
    }

    return jsonResponse({ erro: "Rota não encontrada" }, 404);
  }



 

};
