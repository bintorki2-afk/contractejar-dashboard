import '@fortawesome/fontawesome-free/css/all.min.css';
import './globals.css';
import { Toaster } from 'sonner';
import localFont from 'next/font/local';
import ReactQueryProvider from '../utils/providers/react-query-provider';
import StoreHydrator from '@/components/auth/store-hydrator';
import FirebaseMessagingProvider from '@/components/firebase/firebase-messaging-provider';
import ThemeProvider from '@/components/theme/theme-provider';
import { ConfirmProvider } from '@/components/shared/confirm-provider';

// د22: نفس خط الموقع (IBM Plex Sans Arabic، مستضاف محلياً — نفس ملفات contractejar-frontend/app/fonts).
// اسم المتغيّر --font-tajawal باقٍ للتوافق مع الأنماط القائمة التي تشير إليه.
const brandFont = localFont({
  variable: '--font-tajawal',
  display: 'swap',
  src: [
    { path: '../fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2', weight: '700', style: 'normal' },
  ],
});

export const viewport = {
  width: 'device-width',
  initialScale: 0.80,
  minimumScale: 0.80,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata() {
  return {
    // لوحة داخلية لـ «عقد إيجار» — لا تُفهرس ولا تشير إلى aqdi.sa (موقع آخر منفصل).
    title: 'عقد إيجار · لوحة الموظفين',
    description: 'لوحة تحكم الموظفين — عقد إيجار',
    robots: { index: false, follow: false },
    other: {
      viewport: 'width=device-width, initial-scale=0.80, minimum-scale=0.80, maximum-scale=1, user-scalable=no',
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={brandFont.variable} suppressHydrationWarning>
      <body suppressHydrationWarning={true}>
        <ThemeProvider>
          <ReactQueryProvider>
            <StoreHydrator />
            <FirebaseMessagingProvider />
            <ConfirmProvider>{children}</ConfirmProvider>
            <Toaster
              position="top-center"
              dir="rtl"
              richColors
              closeButton
              expand
              visibleToasts={4}
              toastOptions={{
                className: "font-[family-name:var(--font-tajawal)]",
              }}
            />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
