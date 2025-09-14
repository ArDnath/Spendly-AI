
import { Card, CardContent } from "@/components/ui/card"
import { Quote, Star } from "lucide-react"

export function TrustSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Trusted by 10,000+ AI teams</h2>
          <p className="text-lg text-muted-foreground">
            Join innovative teams already protecting and optimizing their AI spend
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
              </div>
              <Quote className="w-8 h-8 text-accent mb-4" />
              <p className="text-card-foreground font-medium mb-4">
                "SpendlyAI caught an endless loop that would've cost me hundreds. Essential for bootstrapped projects."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-accent">MK</span>
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">Mike Kim</p>
                  <p className="text-sm text-muted-foreground">Indie Hacker</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
              </div>
              <Quote className="w-8 h-8 text-accent mb-4" />
              <p className="text-card-foreground font-medium mb-4">
                "Finally, I can show investors a clear AI spend report. Crucial for managing runway and building trust."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-accent">SC</span>
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">Sarah Chen</p>
                  <p className="text-sm text-muted-foreground">Startup Founder</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
              </div>
              <Quote className="w-8 h-8 text-accent mb-4" />
              <p className="text-card-foreground font-medium mb-4">
                "SpendlyAI makes client billing transparent and saves hours of manual tracking across multiple
                projects."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-accent">DJ</span>
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">David Johnson</p>
                  <p className="text-sm text-muted-foreground">Agency Lead</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credibility Boosters */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/20 rounded"></div>
              <span className="text-sm font-medium">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/20 rounded"></div>
              <span className="text-sm font-medium">GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/20 rounded"></div>
              <span className="text-sm font-medium">Enterprise Security</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
