import Link from "next/link";
import {
  Gift,
  Heart,
  Sparkles,
  Send,
  Package,
  Star,
  Coffee,
  Wine,
  Cake,
  PartyPopper,
  HandHeart,
  Gem,
  Crown,
  Flower2,
  Music,
  Palette,
  Rocket,
  Zap,
  LogIn,
} from "lucide-react";
import { getAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const floatingIcons = [
  { Icon: Gift, delay: "0s", duration: "20s", top: "10%", left: "5%" },
  { Icon: Heart, delay: "2s", duration: "25s", top: "20%", left: "85%" },
  { Icon: Sparkles, delay: "4s", duration: "22s", top: "70%", left: "10%" },
  { Icon: Send, delay: "1s", duration: "18s", top: "15%", left: "45%" },
  { Icon: Package, delay: "3s", duration: "24s", top: "80%", left: "80%" },
  { Icon: Star, delay: "5s", duration: "21s", top: "40%", left: "8%" },
  { Icon: Coffee, delay: "2.5s", duration: "19s", top: "60%", left: "90%" },
  { Icon: Wine, delay: "1.5s", duration: "23s", top: "85%", left: "40%" },
  { Icon: Cake, delay: "4.5s", duration: "20s", top: "25%", left: "70%" },
  { Icon: PartyPopper, delay: "0.5s", duration: "26s", top: "50%", left: "15%" },
  { Icon: HandHeart, delay: "3.5s", duration: "17s", top: "35%", left: "92%" },
  { Icon: Gem, delay: "6s", duration: "22s", top: "75%", left: "55%" },
  { Icon: Crown, delay: "2.2s", duration: "19s", top: "5%", left: "30%" },
  { Icon: Flower2, delay: "4.2s", duration: "21s", top: "45%", left: "75%" },
  { Icon: Music, delay: "1.8s", duration: "24s", top: "90%", left: "20%" },
  { Icon: Palette, delay: "5.5s", duration: "18s", top: "30%", left: "50%" },
  { Icon: Rocket, delay: "3.2s", duration: "25s", top: "65%", left: "35%" },
  { Icon: Zap, delay: "0.8s", duration: "20s", top: "55%", left: "60%" },
];

export default async function HomePage() {
  // Check if user is logged in (optional - for showing different UI)
  const session = await getAuthSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-50">
      {/* Floating Icons Background */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingIcons.map((item, index) => (
          <div
            key={index}
            className="absolute animate-float opacity-10"
            style={{
              top: item.top,
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
          >
            <item.Icon className="h-12 w-12 text-green-800" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-3xl">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="p-4 rounded-full bg-gradient-to-br from-green-800 to-emerald-700 shadow-lg">
              <Gift className="h-16 w-16 text-white" />
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Create{" "}
            <span className="bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent">
              Meaningful Moments
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Add high-touch gifting and personalized experiences to your campaigns that close deals.
          </p>

          {/* Conditional Content based on auth state */}
          {isLoggedIn ? (
            <>
              {/* User Greeting - shown when logged in */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100 mb-8">
                <p className="text-lg text-gray-700">
                  Hello,{" "}
                  <span className="font-semibold text-green-800">
                    {session.user?.name || session.user?.email}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Ready to accelerate your sales pipeline?
                </p>
              </div>

              {/* CTA Buttons for logged in users */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-800 to-emerald-700 hover:from-green-900 hover:to-emerald-800 text-lg px-8 py-6"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/sends">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-green-300 text-green-800 hover:bg-green-50 text-lg px-8 py-6"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    View Sends
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* CTA for non-logged in users */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-100 mb-8">
                <p className="text-lg text-gray-700">
                  Send gifts, experiences, and personalized touches
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Integrate with your CRM to add moments that matter
                </p>
              </div>

              {/* CTA Buttons for non-logged in users */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-800 to-emerald-700 hover:from-green-900 hover:to-emerald-800 text-lg px-8 py-6"
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-green-300 text-green-800 hover:bg-green-50 text-lg px-8 py-6"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Feature Pills */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {["Gift Sending", "Personalized Touches", "CRM Integration", "Budget Tracking", "Experience Booking"].map(
              (feature) => (
                <span
                  key={feature}
                  className="px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-600 border border-green-100"
                >
                  {feature}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
