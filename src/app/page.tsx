import { Hero } from "@/components/sections/Hero";
import { Trust } from "@/components/sections/Trust";
import { Regions } from "@/components/sections/Regions";
import { Results } from "@/components/booking/Results";
import { Experiences } from "@/components/sections/Experiences";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Specials } from "@/components/sections/Specials";
import { Sisterhood } from "@/components/sections/Sisterhood";

export default function Home() {
  return (
    <>
      <Hero />
      <Trust />
      <Regions />
      <Results />
      <Experiences />
      <HowItWorks />
      <Specials />
      <Sisterhood />
    </>
  );
}
