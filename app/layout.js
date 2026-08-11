import "./globals.css";

import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Snoozelet",
  description:
    "Study smarter after dark.",
  applicationName: "Snoozelet",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Snoozelet" },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09122b",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
