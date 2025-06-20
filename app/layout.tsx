import type { Metadata } from "next";
import localFont from "next/font/local";
// import { Lato } from "next/font/google";
import "./globals.css";

// const lato = Lato({
//   weight: ["100", "300", "400", "700", "900"], // Select weights you need
//   variable: "--font-lato",
//   display: "swap",
//   subsets: ["latin"],
// });

const axiforma = localFont({
  src: [
    {
      path: "../public/fonts/Axiforma/Axiforma_Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/Axiforma/Axiforma_Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts//Axiforma/Axiforma_Medium.otf",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-axiforma",
});

export const metadata: Metadata = {
  title: "NCC 2025",
  description: "NCC 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={axiforma.variable}>
      <body>{children}</body>
    </html>
  );
}
