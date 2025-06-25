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
  title: "HOLY रास्ता | NCC 2025",
  description: "Your journey to enlightenment starts here",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ncc25.vercel.app/",
    siteName: "HOLY रास्ता | NCC 2025",
    title: "HOLY रास्ता | NCC 2025",
    description: "Your journey to enlightenment starts here",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "HOLY रास्ता | NCC 2025",
      },
    ],
  },
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
