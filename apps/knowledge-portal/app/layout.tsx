import type { Metadata } from 'next';
import { KnowledgePortalProvider } from '@/components/provider';
import './global.css';

export const metadata: Metadata = {
  title: {
    default: 'Ratzeburg AI Brain',
    template: '%s | Ratzeburg AI Brain',
  },
  description: 'Read-only knowledge portal for governed source documents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <KnowledgePortalProvider>{children}</KnowledgePortalProvider>
      </body>
    </html>
  );
}
