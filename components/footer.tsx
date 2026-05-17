import Link from "next/link"
import Image from "next/image"

const whatsapp =
  "https://wa.me/5531993575969?text=Olá!%20Quero%20conhecer%20a%20plataforma%20GIBA."

const footerLinks = {
  produto: [
    { name: "Recursos", href: "#recursos" },
    { name: "Funcionalidades", href: "#funcionalidades" },
    { name: "Planos", href: "#planos" },
    { name: "Demonstração", href: "#demo" },
  ],
  empresa: [
    { name: "Sobre", href: "#sobre" },
    { name: "Contato", href: whatsapp },
    { name: "Blog", href: whatsapp },
    { name: "Carreiras", href: whatsapp },
  ],
  legal: [
    { name: "Termos de uso", href: whatsapp },
    { name: "Privacidade", href: whatsapp },
    { name: "Cookies", href: whatsapp },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/20">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/images/logo.png"
                alt="GIBA - Gestão Inteligente para Bandas e Artistas"
                width={140}
                height={40}
                className="h-8 w-auto object-contain sm:h-10"
              />
            </Link>

            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
              A plataforma completa para gestão de bandas e artistas. Organize
              sua carreira musical de forma profissional.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:col-span-2 lg:col-span-3 lg:gap-8">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground sm:mb-4 sm:text-sm">
                Produto
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.produto.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground sm:mb-4 sm:text-sm">
                Empresa
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.empresa.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground sm:mb-4 sm:text-sm">
                Legal
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-center sm:flex-row sm:text-left lg:mt-12 lg:pt-8">
          <p className="text-xs text-muted-foreground sm:text-sm">
            © {new Date().getFullYear()} GIBA. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground sm:text-sm">
              Para bandas e artistas
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}