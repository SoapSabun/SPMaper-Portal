import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPMaper",
  description: "SPM past papers, all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="signatureMark">uymz</div>
      </body>
    </html>
  );
}
