import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Play,
  Shield,
  Headphones,
  RefreshCw,
  Globe,
} from "lucide-react"
import Image from "next/image"

export function Hero() {
  const whatsapp =
    "https://wa.me/5531993575969?text=Olá!%20Quero%20conhecer%20a%20plataforma%20GIBA."

  const trustBadges = [
    { icon: Globe, text: "100% Online" },
    { icon: Shield, text: "Seguro e confiável" },
    { icon: Headphones, text: "Suporte especializado" },
    { icon: RefreshCw, text: "Atualizações constantes" },
  ]

  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/30 blur-[120px] md:h-[600px] md:w-[600px] md:blur-[150px]" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-cyan-500/20 blur-[100px] md:h-[500px] md:w-[500px] md:blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[250px] w-[250px] rounded-full bg-pink-500/15 blur-[80px] md:h-[400px] md:w-[400px] md:blur-[100px]" />
        <div className="absolute right-1/4 top-1/2 h-[200px] w-[200px] rounded-full bg-violet-400/20 blur-[60px] md:h-[300px] md:w-[300px] md:blur-[80px]" />
      </div>

      <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-violet-500/30 to-transparent md:left-8 lg:block" />
      <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent md:left-12 lg:block" />
      <div className="absolute left-12 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-violet-500/10 to-transparent md:left-16 lg:block" />

      <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[45%_55%] lg:gap-12">
          <div className="space-y-5 text-center lg:space-y-6 lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              A plataforma completa para sua carreira
            </p>

            <h1 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              <span className="text-foreground">Gestão inteligente</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                para Bandas e Artistas
              </span>
            </h1>

            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base lg:mx-0 lg:text-lg">
              Organize agenda, financeiro, contratos, clientes e produção
              artística em um só lugar e tenha mais tempo para o que realmente
              importa:{" "}
              <span className="font-medium text-cyan-400">a música.</span>
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="h-11 bg-gradient-to-r from-violet-600 to-violet-500 px-6 text-sm text-white shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-violet-600 hover:shadow-violet-500/50 sm:h-12 sm:px-8 sm:text-base"
                >
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>

              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 border-border/60 bg-transparent px-6 text-sm text-foreground hover:bg-secondary/50 sm:h-12 sm:px-8 sm:text-base"
                >
                  <Play className="mr-2 h-4 w-4 fill-current" />
                  Ver demonstração
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 lg:justify-start lg:gap-x-6 lg:gap-y-3">
              {trustBadges.map((badge) => (
                <div
                  key={badge.text}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm"
                >
                  <badge.icon className="h-3.5 w-3.5 text-violet-400 sm:h-4 sm:w-4" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:mx-0 lg:-mr-8 lg:max-w-none xl:-mr-16">
            <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 sm:translate-x-8 sm:translate-y-8">
              <div className="h-full w-full rounded-3xl bg-gradient-to-br from-violet-600/40 via-fuchsia-500/30 to-cyan-500/40 blur-2xl sm:blur-3xl" />
            </div>

            <div className="relative z-10 overflow-hidden rounded-xl shadow-2xl shadow-violet-500/20 sm:rounded-2xl">
              <Image
                src="/images/dashboard-mockup.jpeg"
                alt="GIBA Dashboard - Laptop e Mobile"
                width={900}
                height={600}
                className="w-full object-cover"
                priority
              />
            </div>

            <div className="absolute -inset-px -z-10 rounded-xl bg-gradient-to-br from-violet-500/50 via-transparent to-cyan-500/50 opacity-60 blur-sm sm:rounded-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}