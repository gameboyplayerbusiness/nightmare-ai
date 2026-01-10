import "./globals.css";

export const metadata = {
  title: "Nightmare AI",
  description: "The mirror remembers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
