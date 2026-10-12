import React, { ReactNode } from 'react'
import ShopHeader from '../components/Shop/ShopHeader'
import ShopFooter from '../components/Shop/ShopFooter'
import AppProviders from './Provider'
import { useI18n } from '@/lib/i18n'

export default function ShopFrontLayout({children}: {children: ReactNode}) {
  const { direction, locale } = useI18n()

  return (

    <AppProviders>
      <div dir={direction} lang={locale} className="shop-theme min-h-[100dvh] bg-background text-foreground">
        <ShopHeader />
          {children}
        <ShopFooter />
      </div>
    </AppProviders>

  )
}
