import type { Metadata } from 'next';
import './globals.css';
import { SocketProvider } from '@/components/providers/SocketContext';

export const metadata: Metadata = {
  title: 'Tech Mafia',
  description: 'The social deduction game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
