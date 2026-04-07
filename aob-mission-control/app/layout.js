import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'Mission Control — The Art of Broth',
  description: 'B2B pipeline command center',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
