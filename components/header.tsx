"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const whatsapp =
    "https://wa.me/5531993575969?text=Olá!%20Quero%20conhecer%20a%20plataforma%20GIBA."

  const navItems = [
    { name: "Recursos", href: "#recursos" },
    { name: "Funcionalidades", href: "#funcionalidades" },
    { name: "Planos", href: "#planos" },
    { name: "Demonstração", href: "#demo" },
    { name: "Sobre", href: "#sobre" },
    { name: "Contato", href: "#contato" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="GIBA - Gestão Inteligente para Bandas e Artistas"
            width={220}
            height={70}
            className="h-14 w-auto object-contain md:h-16 lg:h-18"
            priority
          />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link href="/login">
            <Button variant="ghost" className="text-foreground">
              Entrar
            </Button>
          </Link>

          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <Button className="bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-violet-600 hover:shadow-violet-500/40">
              Começar agora
            </Button>
          </a>
        </div>

        <button
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-4 px-4 py-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            <div className="mt-4 flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full text-foreground">
                  Entrar
                </Button>
              </Link>

              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-violet-600">
                  Começar agora
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}