import { Calendar, DollarSign, Users, Music, BarChart3, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description: "Organize shows, ensaios e compromissos em um calendário completo.",
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: DollarSign,
    title: "Gestão Financeira",
    description: "Controle entradas, saídas, cachês, comissões e tenha visão real do seu negócio.",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: Users,
    title: "Clientes e Contratos",
    description: "Cadastre clientes, envie propostas e gerencie contratos e documentos.",
    iconBg: "bg-pink-500/20",
    iconColor: "text-pink-400",
  },
  {
    icon: Music,
    title: "Produção Artística",
    description: "Centralize riders, demandas técnicas e equipes para cada evento.",
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    icon: BarChart3,
    title: "Relatórios e Insights",
    description: "Relatórios completos e gráficos inteligentes para melhores decisões.",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: ShieldCheck,
    title: "Seguro e Confiável",
    description: "Seus dados protegidos com tecnologia de ponta e backups diários.",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
]

export function Features() {
  return (
    <section id="funcionalidades" className="relative py-12 lg:py-20">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 text-center lg:mb-10">
          <h2 className="text-balance text-xl font-bold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
            Tudo que você precisa em uma{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              plataforma completa
            </span>
          </h2>
        </div>

        {/* Features Grid - Responsive: 1 col mobile, 2 col tablet, 3 col medium, 6 col desktop */}
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/30 p-4 transition-all duration-300 hover:border-violet-500/40 hover:bg-card/50"
            >
              {/* Neon glow on hover */}
              <div className="absolute -inset-px -z-10 rounded-xl bg-gradient-to-br from-violet-500/0 via-transparent to-cyan-500/0 opacity-0 transition-opacity duration-300 group-hover:from-violet-500/20 group-hover:to-cyan-500/20 group-hover:opacity-100" />
              
              {/* Icon */}
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${feature.iconBg}`}>
                <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
              </div>

              {/* Content */}
              <h3 className="mb-1.5 text-sm font-semibold text-foreground">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
