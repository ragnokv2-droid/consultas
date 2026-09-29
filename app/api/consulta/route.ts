import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AppsScriptShipment = {
  name?: string;
  tracking?: string;
  fee?: number;
  paymentUrl?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cpf = String(body?.cpf || "").replace(/\D/g, "");

    if (cpf.length !== 11) {
      return NextResponse.json({ found: false, message: "CPF inválido." }, { status: 400 });
    }

    const apiUrl = process.env.SHEETS_API_URL;
    if (!apiUrl) {
      return NextResponse.json({ found: false, message: "Consulta não configurada." }, { status: 503 });
    }

    const url = new URL(apiUrl);
    url.searchParams.set("cpf", cpf);

    const response = await fetch(url.toString(), { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error(`Apps Script respondeu ${response.status}`);

    const data = await response.json();
    if (data?.success === false) {
      return NextResponse.json({ found: false, message: data?.error || "Não foi possível realizar a consulta." }, { status: 502 });
    }

    const shipments = Array.isArray(data?.shipments)
      ? data.shipments.map((item: AppsScriptShipment) => ({
          nome: String(item?.name || ""),
          rastreio: String(item?.tracking || ""),
          valorTaxa: Number(item?.fee || 0),
          linkPagamento: String(item?.paymentUrl || ""),
        }))
      : [];

    return NextResponse.json(
      { found: Boolean(data?.found) && shipments.length > 0, shipments },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[consulta]", error);
    return NextResponse.json({ found: false, message: "Não foi possível realizar a consulta agora." }, { status: 500 });
  }
}
