import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cpf = String(body?.cpf || "").replace(/\D/g, "");

    if (cpf.length !== 11) {
      return NextResponse.json({ found: false, message: "CPF inválido." }, { status: 400 });
    }

    const apiUrl = process.env.SHEETS_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { found: false, message: "A consulta ainda não foi conectada à planilha. Configure SHEETS_API_URL na Vercel após criarmos o Apps Script." },
        { status: 503 }
      );
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "consultar", cpf }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Apps Script respondeu ${response.status}`);
    const data = await response.json();
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[consulta]", error);
    return NextResponse.json({ found: false, message: "Não foi possível realizar a consulta agora." }, { status: 500 });
  }
}
