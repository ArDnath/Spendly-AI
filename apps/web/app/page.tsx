import {HeroSection} from "../components/LandingPage/heroSection";
import { ProblemSolutionSection} from "../components/LandingPage/problem-solution-section"
import { HowItWorksSection } from "../components/LandingPage/workflow.tsx";
import {TrustSection} from "../components/LandingPage/trust-section.tsx"
import { FinalCtaSection } from "../components/LandingPage/final-cta-section.tsx"
export default function Home() {
  return (
    <div className="min-h-screen pt-16">
      <HeroSection />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <TrustSection />
      <FinalCtaSection />
    </div>
  );
}
