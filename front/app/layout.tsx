import type { Metadata } from 'next';
import { fontVariables } from './fonts';
import { ThemeProvider } from '@/components/ThemeProvider';
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
    <html lang="en" data-palette="teal" suppressHydrationWarning>
      <body className={`${fontVariables} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
