import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lesson Plan Generator",
  description: "Generate complete lesson plans for teacher candidates."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
