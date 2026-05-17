import "./globals.css";

export const metadata = {
  title: "GIBA",
  description: "Gestão Inteligente para Bandas e Artistas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}