import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consulta de Encomendas | Mundo Atleta",
  description: "Consulte a situação da sua encomenda pelo CPF.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
