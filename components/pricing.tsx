import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const whatsapp =
  "https://wa.me/5531993575969?text=Olá!%20Quero%20assinar%20a%20Plataforma%20GIBA."

const plans = [
  {
    name: "Essencial",
    description: "Para artistas e bandas que querem sair das planilhas.",
    price: "109,90",
    period: "/mês",
    features: [
      "Dashboard",
      "Clientes",
      "Agenda",
      "Financeiro",
      "Formatos",
      "Contratos",
      "Configurações",
    ],
    cta: "Começar Agora",
    popular: false,
  },
  {
    name: "Profissional",
    description: "Para quem já tem equipe e precisa de mais controle.",
    price: "209,90",
    period: "/mês",
    features: [
      "Tudo do Essencial",
      "Relatórios",
      "Calculadora de Show",
      "Colaboradores",
      "Agenda Colaborador",
      "Mais controle da operação",
      "Ideal para bandas em crescimento",
    ],
    cta: "Começar Agora",
    popular: true,
  },
  {
    name: "Expertise",
    description: "Para operações artísticas que precisam de recursos avançados.",
    price: "359,90",
    period: "/mês",
    features: [
      "Tudo do Profissional",
      "Módulos avançados",
      "CRM completo",
      "Gestão de Eventos",
      "Suporte prioritário",
      "Recursos premium planejados",
      "Novidades em primeira mão",
    ],
    cta: "Começar Agora",
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="planos" className="relative py-16 lg:py-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/4 h-[250px] w-[250px] rounded-full bg-violet-600/10 blur-[80px] sm:h-[400px] sm:w-[400px] sm:blur-[120px]" />
        <div className="absolute left-0 bottom-1/4 h-[200px] w-[200px] rounded-full bg-cyan-500/10 blur-[60px] sm:h-[300px] sm:w-[300px] sm:blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 text-center lg:mb-16">
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Escolha o plano ideal para{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              sua carreira
            </span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Comece grátis por 7 dias. Cancele quando quiser.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-xl p-6 transition-all duration-300 sm:rounded-2xl sm:p-8 ${
                plan.popular
                  ? "border border-violet-500/60 bg-gradient-to-b from-violet-500/10 to-transparent shadow-xl shadow-violet-500/10"
                  : "border border-border/40 bg-card/30 hover:border-border/60"
              }`}
            >
              {plan.popular && (
                <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-2.5 py-0.5 text-[10px] font-medium text-white sm:right-4 sm:top-4 sm:px-3 sm:py-1 sm:text-xs">
                  Mais indicado
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{plan.description}</p>
              </div>

              <div className="mb-4 sm:mb-6">
                <span className="text-3xl font-bold text-foreground sm:text-4xl">R$ {plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mb-6 space-y-2 sm:mb-8 sm:space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
                    <Check className="h-3.5 w-3.5 shrink-0 text-violet-400 sm:h-4 sm:w-4" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a href="/cadastro">
                <Button
                  className={`w-full text-sm sm:text-base ${
                    plan.popular
                      ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:from-violet-700 hover:to-cyan-600"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.cta}
                </Button>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
