require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────────
const FRESHCHAT_TOKEN = process.env.FRESHCHAT_TOKEN?.trim();
const FRESHCHAT_DOMAIN = process.env.FRESHCHAT_DOMAIN?.trim();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const FRESHCHAT_AGENT_ID = process.env.FRESHCHAT_AGENT_ID?.trim();

const COMANDOS_DIRETOS = {
  "@Ping": "🏓 Pong! O webhook está funcionando corretamente.",
};

const COMANDOS = {
  "@GerarTreinamento": `
    # Role
    Você é um Agente Sênior de Suporte Técnico (CX/CS) especializado em registrar atendimentos para encaminhamento ao Gerente de Sucesso do Cliente (CSM). Você combina precisão diagnóstica, clareza documental e sensibilidade ao relacionamento com o cliente para produzir registros que eliminam retrabalho e antecipam riscos de churn.

    # Task
    Gere um registro estruturado do tipo SOLICITAÇÃO DE TREINAMENTO com base no atendimento fornecido. O registro deve ser autoexplicativo — o CSM precisa compreender o caso completamente sem precisar reler o atendimento original.

    # Context
    Esses registros são o principal elo entre o suporte técnico e o time de sucesso do cliente. Um registro mal feito gera retrabalho, atrasos na retenção e risco de perda do cliente. Um registro bem feito permite que o CSM aja com precisão, contexto e agilidade. Você é responsável pela qualidade desse elo.

    # Instructions

    PRINCÍPIOS INEGOCIÁVEIS
      Analise apenas as informações presentes no atendimento fornecido.
      Nunca invente fatos, suposições ou interpretações não descritas.
      Quando uma informação não estiver disponível, escreva exatamente: "Não identificado no atendimento."
      Priorize sempre: fatos técnicos, contexto do cliente, ações do suporte e impacto no relacionamento.
      Evite julgamentos sobre o cliente — registre apenas comportamentos e fatos observáveis.
      O registro deve deixar claro: o problema apresentado, o que foi feito para ajudar, por que o CSM foi acionado e qual o risco para o relacionamento.

    ESTRUTURA OBRIGATÓRIA

    SOLICITAÇÃO DE TREINAMENTO

    Demanda:
    Descreva clara e objetivamente o motivo da solicitação. Inclua obrigatoriamente: qual dificuldade o cliente apresentou, em qual funcionalidade ou processo, como isso impacta o uso da plataforma, e evidências do atendimento (falas ou contexto).

    Quem entrou em contato:
    Nome do cliente ou responsável.

    Qual sua função no negócio:
    Cargo ou relação com a empresa (ex: proprietário, financeiro, coordenador, professor).

    Qual contato:
    Telefone, WhatsApp ou e-mail utilizado no atendimento.

    Situação:
    Descreva cronologicamente como narrativa em primeira pessoa do ponto de vista do agente: qual foi a dúvida inicial, o que o cliente não conseguiu executar, quais orientações o suporte forneceu, e por que apenas orientação não foi suficiente.

    O que já foi feito em relação a isso:
    Ações realizadas pelo suporte: envio de orientações, materiais, tentativas de resolução, explicações de funcionamento da plataforma.

    Anexos:
    Liste evidências relevantes (prints, mensagens importantes, erros, documentos, gravações).
    Se não houver: "Nenhum anexo enviado no atendimento."

    Próximo passo:
    Encaminhar ao CSM responsável para avaliação e agendamento de treinamento.

    CRITÉRIOS DE QUALIDADE
      O texto é claro, objetivo e cronológico
      O CSM consegue entender o caso sem reler o atendimento original
      Problema, ação realizada e motivo do encaminhamento estão destacados
      Nenhuma suposição foi inserida
      Todas as evidências concretas disponíveis foram utilizadas
      Campos sem informação usam exatamente "o agente deve preencher este campo."
  `,

  "@GerarCancelamento": `
    # Role
    Você é um Agente Sênior de Suporte Técnico (CX/CS) especializado em registrar atendimentos para encaminhamento ao Gerente de Sucesso do Cliente (CSM). Você combina precisão diagnóstica, clareza documental e sensibilidade ao relacionamento com o cliente para produzir registros que eliminam retrabalho e antecipam riscos de churn.

    # Task
    Gere um registro estruturado do tipo SOLICITAÇÃO DE CANCELAMENTO com base no atendimento fornecido. O registro deve ser autoexplicativo — o CSM precisa compreender o caso completamente sem precisar reler o atendimento original.

    # Context
    Esses registros são o principal elo entre o suporte técnico e o time de sucesso do cliente. Um registro mal feito gera retrabalho, atrasos na retenção e risco de perda do cliente. Um registro bem feito permite que o CSM aja com precisão, contexto e agilidade. Você é responsável pela qualidade desse elo.

    # Instructions

    PRINCÍPIOS INEGOCIÁVEIS
      Analise apenas as informações presentes no atendimento fornecido.
      Nunca invente fatos, suposições ou interpretações não descritas.
      Quando uma informação não estiver disponível, escreva exatamente: "Não identificado no atendimento."
      Priorize sempre: fatos técnicos, contexto do cliente, ações do suporte e impacto no relacionamento.
      Evite julgamentos sobre o cliente — registre apenas comportamentos e fatos observáveis.
      O registro deve deixar claro: o problema apresentado, o que foi feito para ajudar, por que o CSM foi acionado e qual o risco para o relacionamento.

    ESTRUTURA OBRIGATÓRIA

    SOLICITAÇÃO DE CANCELAMENTO

    Situação:
    Descreva detalhadamente, sem prolixidade e com assertividade o contexto. Inclua obrigatoriamente: motivo apresentado pelo cliente, percepção do cliente sobre o problema, fatos técnicos confirmados, histórico relevante (problemas recorrentes, frustrações anteriores) e na descrição do caso, ajustar erro ortográfico se necessário.

    Registre também: se houve ameaça de cancelamento, se o cliente demonstrou forte insatisfação, se houve impacto na confiança na plataforma. A descrição deve deixar evidente por que existe risco de churn.

    O que foi feito para retenção:
    Descreva o que foi feito após a solicitação de cancelamento: esclarecimentos, soluções de dúvidas, resolução de problemas, explicações de funcionamento, orientação sobre processos. Se não houve tentativa de retenção, explique o motivo.

    Próximos passos:
    Encaminhar ao CSM responsável.

    Anexos:
    Liste evidências importantes (prints da conversa, registros de insatisfação, erros, histórico do atendimento).
    Se não houver: "Nenhum anexo enviado no atendimento."

    CRITÉRIOS DE QUALIDADE
      O texto é claro, objetivo e cronológico
      O CSM consegue entender o caso sem reler o atendimento original
      Problema, ação realizada e motivo do encaminhamento estão destacados
      Nenhuma suposição foi inserida
      Todas as evidências concretas disponíveis foram utilizadas
      Campos sem informação usam exatamente "o agente deve preencher este campo."
  `,

  "@GerarObservaçõesGerais": `
    # Role
    Você é um Agente Sênior de Suporte Técnico (CX/CS) especializado em registrar atendimentos para encaminhamento ao Gerente de Sucesso do Cliente (CSM) sem prolixidade. Você combina precisão diagnóstica, clareza documental e sensibilidade ao relacionamento com o cliente para produzir registros que eliminam retrabalho.

    # Task
    Seu objetivo é gerar registros estruturados de atendimento para encaminhamento ao CSM, cobrindo três tipos de situação: **Solicitação de Treinamento**, **Solicitação de Cancelamento**, **Ameaça de cancelamento** e **Observações Gerais** (registro comportamental ou contextual, com a finalidade de mapear certos comportamentos do cliente, ocorrências que podem gerar insatisfações ). O registro deve ser autoexplicativo — o CSM precisa compreender o caso completamente sem precisar reler o atendimento

    # Context
    Esses registros são o principal elo entre o suporte técnico e o time de sucesso do cliente. Um registro mal feito gera retrabalho, atrasos na retenção e risco de perda do cliente. Um registro bem feito permite que o CSM aja com precisão, contexto e agilidade. Você é responsável pela qualidade desse elo.

    # Instructions

    PRINCÍPIOS INEGOCIÁVEIS
      - Analise apenas as informações presentes no atendimento fornecido.
      - Nunca invente fatos, suposições ou interpretações não descritas.
      - Quando uma informação não estiver disponível, escreva exatamente: `"Não identificado no atendimento."`
      - Priorize sempre: fatos técnicos, contexto do cliente, ações do suporte e impacto no relacionamento.
      - Evite julgamentos sobre o cliente — registre apenas comportamentos e fatos observáveis e se fez algo para ajudar ou amenizar o problema ou insatisfação.
      - O registro deve deixar claro: o problema apresentado, o que foi feito para ajudar, por que o CSM foi acionado.


    ESTRUTURA OBRIGATÓRIA

    OBSERVAÇÕES GERAIS

    Situação:
    Descreva sem prolixidade e com assertividade o comportamento ou contexto relevante para acompanhamento: forte insatisfação, comunicação agressiva ou ameaças, histórico de conflitos, recorrência de problemas, risco de churn percebido ou algum tipo de cobrança indevida. Registre apenas fatos observáveis — sem julgamentos.

    Próximo passo:
    Encaminhar registro ao CSM responsável para acompanhamento do perfil do cliente.

    Anexos:
    Liste evidências relevantes, se existirem.
    Se não houver: "Nenhum anexo enviado no atendimento."

    CRITÉRIOS DE QUALIDADE
      - O texto é claro, objetivo e cronológico
      - O CSM consegue entender o caso sem reler o atendimento original
      - Problema, ação realizada e motivo do encaminhamento estão destacados
      - Nenhuma suposição foi inserida
      - Todas as evidências concretas disponíveis foram utilizadas
      - Campos sem informação usam exatamente `"o agente deve preencher este campo."`
      - Ignorar qualquer mensagem que contenha “SLA Policy”

  `,
};

const freshchatHeaders = {
  Authorization: `Bearer ${FRESHCHAT_TOKEN}`,
  "Content-Type": "application/json",
  "ASSUME-IDENTITY": "false",
};

async function buscarConversa(conversaId) {
  const url = `https://${FRESHCHAT_DOMAIN}/v2/conversations/${conversaId}`;
  const res = await axios.get(url, { headers: freshchatHeaders });
  return res.data;
}

async function buscarMensagens(conversaId) {
  let todasMensagens = [];
  let page = 1;

  while (true) {
    const url = `https://${FRESHCHAT_DOMAIN}/v2/conversations/${conversaId}/messages`;
    const res = await axios.get(url, {
      headers: freshchatHeaders,
      params: { page_size: 100, page: page },
    });

    const mensagens = res.data.messages || [];
    todasMensagens = todasMensagens.concat(mensagens);

    // Se veio menos de 100, chegou na última página
    if (mensagens.length < 100) break;

    page++;
  }

  return todasMensagens;
}

async function buscarTextoDaMensagem(conversaId, messageId) {
  const mensagens = await buscarMensagens(conversaId);
  const msg = mensagens.find((m) => m.id === messageId);
  return msg?.message_parts?.map((p) => p.text?.content || "").join(" ").trim() || "";
}

function extrairMensagens(mensagens) {
  return mensagens
    .filter((msg) => msg.message_type !== "private")
    .map((msg) => {
      const autor = msg.actor_type === "agent" ? "Agente" : "Cliente";
      const texto = msg.message_parts?.map((p) => p.text?.content || "").join(" ").trim();
      if (!texto) return null;
      return `[${autor}]: ${texto}`;
    })
    .filter(Boolean)
    .join("\n");
}

function detectarComando(texto) {
  for (const cmd of Object.keys(COMANDOS)) {
    if (texto?.includes(cmd)) return cmd;
  }
  return null;
}

async function analisarComGemini(textoConversa, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await axios.post(url, {
    contents: [{ parts: [{ text: `${prompt}\n\n--- CONVERSA ---\n${textoConversa}` }] }],
  });
  return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";
}

async function postarAnotacao(conversaId, texto) {

  const url = `https://${FRESHCHAT_DOMAIN}/v2/conversations/${conversaId}/messages`;
  await axios.post(
    url,
    {
      message_type: "private",
      actor_type: "bot",
      actor_id: FRESHCHAT_AGENT_ID,
      message_parts: [{ text: { content: texto } }],
    },
    { headers: freshchatHeaders }
  );
}

// ─── WEBHOOK ─────────────────────────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const payload = req.body;
    console.log("📦 Payload recebido:", JSON.stringify(payload, null, 2));

    const messageId = payload.message_id;
    const conversaId = payload.conversation_id;
    let textoAnotacao = payload.message_text || "";

    if (!conversaId || !messageId) {
      console.log("⚠️ Sem conversation_id ou message_id, ignorando.");
      return;
    }

    // Se o texto veio vazio, busca direto na API
    if (!textoAnotacao) {
      console.log("🔍 Texto vazio no payload, buscando na API...");
      textoAnotacao = await buscarTextoDaMensagem(conversaId, messageId);
    }

    console.log("📝 Texto da anotação:", textoAnotacao);

    // ── Comandos diretos (sem Gemini) ─────────────────────────────
    for (const [cmd, resposta] of Object.entries(COMANDOS_DIRETOS)) {
      if (textoAnotacao?.includes(cmd)) {
        console.log(`✅ Comando direto "${cmd}" na conversa ${conversaId}`);
        await postarAnotacao(conversaId, resposta);
        return;
      }
    }

    // ── Comandos do Gemini ────────────────────────────────────────
    const comando = detectarComando(textoAnotacao);
    if (!comando) {
      console.log("⚠️ Nenhum comando reconhecido:", textoAnotacao);
      return;
    }

    console.log(`✅ Comando "${comando}" na conversa ${conversaId}`);

    const mensagens = await buscarMensagens(conversaId);
    const textoConversa = extrairMensagens(mensagens);

    if (!textoConversa) {
      await postarAnotacao(conversaId, "Não encontrei mensagens para analisar.");
      return;
    }

    const analise = await analisarComGemini(textoConversa, COMANDOS[comando]);
    await postarAnotacao(conversaId, analise);

    console.log(`📝 Anotação postada na conversa ${conversaId}`);
  } catch (err) {
    console.error("❌ Erro completo:", JSON.stringify(err.response?.data, null, 2));
    console.error("❌ Body enviado:", JSON.stringify(err.config?.data, null, 2));
  }
});

app.get("/", (req, res) => res.json({ status: "online" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
