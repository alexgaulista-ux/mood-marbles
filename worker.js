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


/**
 * Generates a PDF report of the results by fetching data from the API.
 */
async function exportarPDF() {
  console.log("[Gerar PDF] Iniciando geração de PDF...");
  const doc = new jsPDF();

  try {
    const response = await fetch(`${API_URL}/resultados`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.mensagem || response.statusText);
    }

    doc.setFontSize(16);
    doc.text("Relatório de Clima por Setor", 20, 20);

    let y = 30;
    const sectorsInResults = [...new Set(data.map(r => r.setor))];

    sectorsInResults.forEach(setor => {
        // Prepare data for the current sector
        const sectorData = data.filter(item => item.setor === setor);
        let totalMoods = 0;
        const moodCounts = {}; // { apiId: count }

        moodApiIds.forEach(apiId => {
            const moodItem = sectorData.find(d => d.sentimento === apiId);
            const count = moodItem ? moodItem.total : 0;
            moodCounts[apiId] = count;
            totalMoods += count;
        });

        doc.setFontSize(12);
        doc.text(`${setor.charAt(0).toUpperCase() + setor.slice(1)}:`, 20, y);
        y += 8;

        moods.forEach(mood => {
            const count = moodCounts[mood.apiId] || 0;
            const perc = totalMoods > 0 ? ((count / totalMoods) * 100).toFixed(1) : 0;
            doc.setFontSize(10);
            doc.text(`  ${mood.emoji} ${mood.label}: ${count} (${perc}%)`, 25, y);
            y += 6;
        });
        y += 4;
        if (y > doc.internal.pageSize.height - 30) { // Check if new page is needed
            doc.addPage();
            y = 20; // Reset y for new page
            console.log("[Gerar PDF] Adicionada nova página ao PDF.");
        }
    });

    doc.save("relatorio_clima_setores.pdf");
    console.log("[Gerar PDF] PDF salvo como 'relatorio_clima_setores.pdf'.");
  } catch (error) {
    console.error("[Gerar PDF] Erro ao gerar PDF:", error);
    alert("Erro ao gerar PDF: " + error.message);
  }

 

};
