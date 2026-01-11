import type { Metadata } from 'next';
import { fontVariables } from './fonts';
import './index.css';

export const metadata: Metadata = {
  title: 'PDF Template Builder',
  description: 'Design and generate professional PDF documents with a visual drag-and-drop builder',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontVariables} font-sans antialiased`}>{children}</body>
    </html>
  );
}
