import { Users, Calendar, UserCheck, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  {
    icon: Users,
    value: "+2.500",
    label: "Artistas e Bandas",
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
  },
  {
    icon: Calendar,
    value: "+8.000",
    label: "Eventos gerenciados",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  {
    icon: UserCheck,
    value: "+15.000",
    label: "Usuários ativos",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
  },
  {
    icon: Star,
    value: "100%",
    label: "Satisfação",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
]

export function Stats() {
  return (
    <section className="relative py-10 lg:py-16">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
        {/* Combined Stats + CTA Section */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
          {/* Stats Row */}
          <div className="flex-1 overflow-hidden rounded-xl border border-border/40 bg-card/30 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:gap-6">
              <p className="text-xs text-muted-foreground sm:text-sm">
                Já ajudamos artistas e equipes a profissionalizar sua gestão
              </p>
              
              <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-6 lg:gap-10">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2 sm:gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${stat.bgColor}`}>
                      <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-foreground sm:text-xl">{stat.value}</div>
                      <div className="truncate text-[10px] text-muted-foreground sm:text-xs">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="group relative overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br from-violet-600/30 via-purple-500/20 to-fuchsia-600/30 px-4 py-4 sm:px-8 sm:py-6 lg:w-auto lg:min-w-[400px] transition-all duration-300">
            {/* Multiple neon glows for premium effect */}
            <div className="absolute -inset-px -z-20 rounded-2xl bg-gradient-to-br from-violet-500/40 via-purple-500/20 to-fuchsia-500/40 blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Inner gradient glow */}
            <div className="absolute -inset-0.5 -z-10 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300" />
            
            {/* Animated border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/50 via-transparent to-fuchsia-500/50 opacity-0 group-hover:opacity-40 blur-sm transition-opacity duration-300 -z-10" />
            
            {/* Static premium border */}
            <div className="absolute inset-0 rounded-2xl border border-gradient-to-r from-violet-400/40 via-purple-400/20 to-fuchsia-400/40 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:gap-4 sm:text-left">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-purple-200 to-fuchsia-200 sm:text-lg">
                  Pronto para levar sua carreira para o próximo nível?
                </h3>
                <p className="mt-1 text-xs text-violet-200/70 sm:text-sm">
                  Teste gratuito por 7 dias. Cancelamento fácil a qualquer momento.
                </p>
              </div>
              <Button className="relative w-full shrink-0 whitespace-nowrap overflow-hidden text-sm sm:w-auto">
                <span className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600" />
                <span className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute inset-0 -z-10 blur-xl bg-gradient-to-r from-violet-600/50 via-purple-600/50 to-fuchsia-600/50 shadow-2xl shadow-violet-500/50 group-hover:shadow-violet-500/80 transition-all duration-300" />
                <span className="relative text-white font-semibold">Testar grátis agora</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
