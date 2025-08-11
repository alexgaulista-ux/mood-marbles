export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Função para autenticar admin
    async function autenticarAdmin(request) {
      try {
        const { usuario, senha } = await request.json();
        if (!usuario || !senha) return false;
        const { results } = await env.DB.prepare(
          "SELECT 1 FROM usuarios WHERE usuario = ? AND senha = ? AND role = 'admin'"
        ).bind(usuario, senha).all();
        return results.length > 0;
      } catch {
        return false;
      }
    }

    // REGISTRAR (votação pública, sem autenticação)
    if (request.method === "POST" && url.pathname === "/registrar") {
      const { setor, sentimento } = await request.json();
      if (!setor || !sentimento) {
        return new Response(JSON.stringify({ mensagem: "Dados inválidos" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const data_registro = new Date().toISOString();
      await env.DB.prepare(
        "INSERT INTO registros (setor, sentimento, data_registro) VALUES (?, ?, ?)"
      ).bind(setor, sentimento, data_registro).run();

      return new Response(JSON.stringify({ mensagem: "Voto registrado com sucesso!" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // LOGIN para admin (verifica se usuário é admin)
    if (request.method === "POST" && url.pathname === "/login") {
      const { usuario, senha } = await request.json();
      if (!usuario || !senha) {
        return new Response(JSON.stringify({ sucesso: false, erro: "Dados inválidos" }), {
          headers: { "Content-Type": "application/json" },
          status: 400
        });
      }
      const { results } = await env.DB.prepare(
        "SELECT 1 FROM usuarios WHERE usuario = ? AND senha = ? AND role = 'admin'"
      ).bind(usuario, senha).all();

      return new Response(JSON.stringify({ sucesso: results.length > 0 }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // RESULTADOS - protegido, só admin
    if (request.method === "GET" && url.pathname === "/resultados") {
      // Aqui precisa autenticar admin via headers ou query (ex: Basic Auth, token, ou no corpo)
      // Como é GET, não tem corpo, vamos exigir Basic Auth no header Authorization

      const auth = request.headers.get("Authorization");
      if (!auth || !auth.startsWith("Basic ")) {
        return new Response(JSON.stringify({ erro: "Não autorizado" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
      // Decodificar base64
      const base64Credentials = auth.split(" ")[1];
      const credentials = atob(base64Credentials);
      const [usuario, senha] = credentials.split(":");
      if (!usuario || !senha) {
        return new Response(JSON.stringify({ erro: "Não autorizado" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      const { results } = await env.DB.prepare(
        "SELECT 1 FROM usuarios WHERE usuario = ? AND senha = ? AND role = 'admin'"
      ).bind(usuario, senha).all();

      if (results.length === 0) {
        return new Response(JSON.stringify({ erro: "Não autorizado" }), { status: 401, headers: { "Content-Type": "application/json" });
      }

      // Se autorizado, retorna dados filtrados
      const filtro = url.searchParams.get("filtro") || "todos";
      let filtroSQL = "";
      const agora = new Date();

      if (filtro === "hoje") {
        const dataHoje = agora.toISOString().slice(0, 10);
        filtroSQL = `WHERE data_registro >= '${dataHoje}T00:00:00.000Z'`;
      } else if (filtro === "semana") {
        const seteDiasAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        filtroSQL = `WHERE data_registro >= '${seteDiasAtras}'`;
      }

      const query = `
        SELECT setor, sentimento, COUNT(*) AS total
        FROM registros
        ${filtroSQL}
        GROUP BY setor, sentimento
      `;

      const dados = await env.DB.prepare(query).all();

      return new Response(JSON.stringify(dados.results), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // LIMPAR registros - só admin, POST
    if (request.method === "POST" && url.pathname === "/limpar") {
      const { usuario, senha } = await request.json();
      if (!usuario || !senha) {
        return new Response(JSON.stringify({ sucesso: false, erro: "Dados inválidos" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      const { results } = await env.DB.prepare(
        "SELECT 1 FROM usuarios WHERE usuario = ? AND senha = ? AND role = 'admin'"
      ).bind(usuario, senha).all();

      if (results.length === 0) {
        return new Response(JSON.stringify({ sucesso: false, erro: "Usuário ou senha incorretos" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      await env.DB.prepare("DELETE FROM registros").run();

      return new Response(JSON.stringify({ sucesso: true, mensagem: "Registros apagados com sucesso" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Endpoint não encontrado", { status: 404 });
  }
};
