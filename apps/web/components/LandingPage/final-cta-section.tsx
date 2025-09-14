
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export function FinalCtaSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-balance">Ready to never worry about AI bills again?</h2>

        {/* Top 3 Benefits Recap */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold mb-2">Never worry about surprise AI bills again</h3>
              <p className="text-primary-foreground/80 text-sm">
                Proactive alerts catch overspending before it happens
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold mb-2">Protect your budget and runway</h3>
              <p className="text-primary-foreground/80 text-sm">
                Crystal-clear visibility across all AI providers and projects
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold mb-2">Get peace of mind</h3>
              <p className="text-primary-foreground/80 text-sm">
                Real-time, predictive alerts keep you in complete control
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mb-8">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-4 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Start Free AI Spend Audit
          </Button>
        </div>

        {/* Trust Builders */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-primary-foreground/80">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-accent" />
            <span>Setup in minutes</span>
          </div>
        </div>
      </div>
    </section>
  )
}
