import { useEffect } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { prefetchCatalog } from "@lib/api";
import "../index.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    void prefetchCatalog();
  }, []);

  return (
    <div className={`${manrope.variable} ${bricolage.variable} ${manrope.className}`}>
      <Head>
        <title>Tecmipickup</title>
        <link rel="icon" href="/favicon.png" type="image/png" sizes="64x64" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
    </div>
  );
}
