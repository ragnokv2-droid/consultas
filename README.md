# Consulta de Encomendas — Mundo Atleta

Projeto Next.js pronto para GitHub + Vercel.

## Dados esperados da planilha

`CPF | NOME | RASTREIO | DATA_CHEGADA | VALOR_TAXA | LINK_PAGAMENTO`

Origem, status e motivo ficam fixos no front-end. O produto não é armazenado nem exibido.

## Rodar localmente

```bash
npm install
npm run dev
```

## Conectar ao Apps Script

Na próxima etapa, publique o Apps Script como Web App e configure:

```bash
SHEETS_API_URL=https://script.google.com/macros/s/SEU_ID/exec
```

Na Vercel: Project > Settings > Environment Variables > `SHEETS_API_URL`.

## Contrato esperado da API

POST com:

```json
{ "action": "consultar", "cpf": "12345678900" }
```

Resposta encontrada:

```json
{
  "found": true,
  "shipments": [{
    "nome": "Maria da Silva",
    "rastreio": "BR844291202CN",
    "dataChegada": "04/10/2026",
    "valorTaxa": 27.67,
    "linkPagamento": "https://..."
  }]
}
```

Resposta não encontrada:

```json
{ "found": false, "shipments": [] }
```

## Deploy

1. Suba todo o conteúdo deste diretório para um repositório GitHub.
2. Importe o repositório na Vercel.
3. Na próxima etapa, adicione `SHEETS_API_URL`.
4. Faça novo deploy.

A interface identifica claramente que é uma área da Mundo Atleta e não um site oficial da Receita Federal ou dos Correios.
