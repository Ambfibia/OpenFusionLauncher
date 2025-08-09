"use client";

import "@fortawesome/fontawesome-free/css/all.css";
import "./css/bootstrap.scss";
import "./css/openfusion-behavior.scss";
import "./css/openfusion-layout.scss";
import "./css/openfusion-theming.scss";
import TitleBar from "./components/TitleBar";
import { LanguageProvider } from "./i18n";

function getInitialLang(): string {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("lang");
    if (stored) {
      return stored;
    }
  }
  return "en";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = getInitialLang();

  return (
    <html lang={lang} data-bs-theme="dark">
      <body>
        <LanguageProvider>
          <TitleBar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
