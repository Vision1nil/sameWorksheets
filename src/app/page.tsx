"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { setUserRole as setUserRoleInDB } from "@/lib/database";
import { FileText, Sparkles, Target, Zap, BarChart3, Clock, BookOpen, Brain, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  
  // Set user role to student when signed in
  useEffect(() => {
    if (isSignedIn && user?.id) {
      // Always set role to student
      setUserRoleInDB(user.id, 'student')
        .then(() => console.log('User role set to student'))
        .catch((err: Error) => console.error('Error setting user role:', err));
    }
  }, [isSignedIn, user?.id]);

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/generate');
    } else {
      router.push('/sign-in');
    }
  };

  const features = [
    {
      title: "Create Custom Worksheets",
      description: "Generate personalized English worksheets tailored to your learning needs",
      icon: <FileText className="h-10 w-10" />,
      color: "from-blue-500 to-cyan-400"
    },
    {
      title: "Track Your Progress",
      description: "Monitor your learning journey with detailed analytics and performance tracking",
      icon: <BarChart3 className="h-10 w-10" />,
      color: "from-purple-500 to-pink-400"
    },
    {
      title: "Practice Anytime",
      description: "Access your saved worksheets and practice at your own pace",
      icon: <Clock className="h-10 w-10" />,
      color: "from-amber-500 to-orange-400"
    },
    {
      title: "Instant Feedback",
      description: "Get immediate results and identify areas for improvement",
      icon: <Zap className="h-10 w-10" />,
      color: "from-green-500 to-emerald-400"
    }
  ];
  
  const howItWorks = [
    {
      step: 1,
      title: "Select Your Topics",
      description: "Choose from a variety of English topics including grammar, vocabulary, and reading comprehension."
    },
    {
      step: 2,
      title: "Generate Worksheet",
      description: "Our AI creates a custom worksheet based on your selected topics and difficulty level."
    },
    {
      step: 3,
      title: "Practice & Learn",
      description: "Complete the worksheet online or download as PDF to practice offline."
    },
    {
      step: 4,
      title: "Track Progress",
      description: "Review your performance and see your improvement over time."
    }
  ];
  
  const testimonials = [
    {
      quote: "This tool has helped me improve my English skills significantly in just a few weeks!",
      author: "Alex, 10th Grade"
    },
    {
      quote: "The personalized worksheets are exactly what I needed to practice for my exams.",
      author: "Jamie, 8th Grade"
    },
    {
      quote: "I love how I can track my progress and see where I need to improve.",
      author: "Taylor, 11th Grade"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center py-16">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI-Powered Worksheet Generator
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Create personalized English worksheets tailored to your learning needs with our
              intelligent AI system. Perfect for students of all grade levels.
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {isSignedIn ? 'Create Worksheet' : 'Get Started'}
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-purple-900/10 rounded-3xl -z-10"></div>
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Features</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border border-gray-800 bg-black/30 hover:bg-black/50 transition-all hover:shadow-md hover:shadow-blue-900/20">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-6">
                    <div className={`p-4 rounded-full bg-gradient-to-r ${feature.color} text-white`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-center">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-blue-900/10 rounded-3xl -z-10"></div>
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">How It Works</span>
          </h2>
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gradient-to-b from-blue-500 to-purple-500 transform -translate-x-1/2 hidden md:block" />
            <div className="space-y-12 relative">
              {howItWorks.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="md:w-1/2 flex justify-end order-1 md:order-none">
                    {index % 2 === 0 && (
                      <Card className="w-full md:max-w-md border border-gray-800 bg-black/30 hover:bg-black/50 transition-all">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                          <p className="text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  <div className="z-10 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <div className="md:w-1/2 flex justify-start order-1">
                    {index % 2 === 1 && (
                      <Card className="w-full md:max-w-md border border-gray-800 bg-black/30 hover:bg-black/50 transition-all">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                          <p className="text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-purple-900/10 rounded-3xl -z-10"></div>
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Student Testimonials</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border border-gray-800 bg-black/30 hover:bg-black/50 transition-all">
                <CardContent className="p-6">
                  <div className="mb-4 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                    </svg>
                  </div>
                  <p className="text-lg mb-4">{testimonial.quote}</p>
                  <p className="text-sm text-muted-foreground text-right">— {testimonial.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 text-center">
          <Card className="border border-gray-800 bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-8">
            <CardContent className="pt-6">
              <h2 className="text-3xl font-bold mb-6">Ready to create your first worksheet?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Join thousands of students who are improving their English skills with our AI-powered worksheets.
              </p>
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all group"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {isSignedIn ? 'Create Worksheet Now' : 'Get Started'}
                <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
