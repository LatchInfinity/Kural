import type { Metadata } from "next";
import GlobalAudioProvider from "@/components/audio/global-audio-provider";
import AudioPlayerPopup from "@/components/audio-player-popup";
import NewspaperMiniPlayer from "@/components/newspaper/newspaper-mini-player";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kural — Tamil AI Voice News",
  description: "Tamil Nadu's premium AI-powered digital newspaper and voice-news platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Tamil:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem("kural-app-storage");
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    var theme = parsed.state && parsed.state.theme;
                    if (theme === "dark") {
                      document.documentElement.setAttribute("data-theme", "dark");
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground font-sans">
        <GlobalAudioProvider>
          {children}
          <NewspaperMiniPlayer />
          <AudioPlayerPopup />
        </GlobalAudioProvider>
      </body>
    </html>
  );
}
