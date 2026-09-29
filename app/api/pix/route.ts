import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

function field(id: string, value: string) {
  return id + String(value.length).padStart(2, "0") + value;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function cleanText(value: string, max: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 .-]/g, "")
    .toUpperCase()
    .slice(0, max);
}

function buildPix(key: string, name: string, city: string, amount: number, txid: string) {
  const merchantAccount = field("00", "BR.GOV.BCB.PIX") + field("01", key);
  const additional = field("05", txid);

  let payload =
    field("00", "01") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986") +
    field("54", amount.toFixed(2)) +
    field("58", "BR") +
    field("59", cleanText(name, 25)) +
    field("60", cleanText(city, 15)) +
    field("62", additional) +
    "6304";

  return payload + crc16(payload);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) {
      return NextResponse.json({ message: "Valor PIX inválido." }, { status: 400 });
    }

    const key = process.env.PIX_KEY;
    const name = process.env.PIX_RECEIVER_NAME;
    const city = process.env.PIX_RECEIVER_CITY;

    if (!key || !name || !city) {
      return NextResponse.json(
        { message: "Configuração PIX não encontrada no servidor." },
        { status: 500 }
      );
    }

    const txid = `MA${Date.now()}`.slice(0, 25);
    const brCode = buildPix(key.trim(), name.trim(), city.trim(), amount, txid);
    const qrCode = await QRCode.toDataURL(brCode, { width: 360, margin: 1 });

    return NextResponse.json({ brCode, qrCode, amount });
  } catch {
    return NextResponse.json({ message: "Não foi possível gerar o PIX." }, { status: 500 });
  }
}
