"use client";

import { useMemo, useState } from "react";
import RequireAuth from "@/src/components/auth/requireAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Search } from "lucide-react";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQS: FaqItem[] = [
  {
    id: "what-is-outcome-builders",
    question: "What is Outcome Builders?",
    answer:
      "Outcome Builders is a workspace where you can organize knowledge, collaborate with your team, and use tools to support strategy and execution.",
  },
  {
    id: "brainspaces-vs-collections",
    question: "What’s the difference between Brainspaces, Collections, and Content?",
    answer:
      "Brainspaces are high-level areas of work. Collections help group related information. Content are individual pieces (notes/articles) within Collections/Brainspaces.",
  },
  {
    id: "how-to-start-chat",
    question: "How do I start a new chat?",
    answer:
      "Go to Chat from the sidebar, then use the chat area to start a new conversation. Your recent chats will appear in the chat list.",
  },
  {
    id: "switch-organization",
    question: "How do I switch organizations?",
    answer:
      "Use the organization selector at the top of the Chat experience (when available). Switching organizations refreshes data for the selected organization.",
  },
  {
    id: "team-access",
    question: "Why can’t I see the Team page?",
    answer:
      "The Team menu may be hidden if you don’t have the required permissions. Ask an organization owner/admin to grant access if needed.",
  },
  {
    id: "where-are-settings",
    question: "Where do I find Settings?",
    answer:
      "Open the Profile menu at the bottom of the sidebar and select Settings.",
  },
];

export default function FaqPage() {
  const [query, setQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter((f) => {
      return (
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <RequireAuth>
      <div className="w-full h-full flex flex-col items-center p-6 gap-6">
        {/* Header */}
        <div className="w-full border-b-2 border-dashed pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <HelpCircle className="w-5 h-5 text-violet-500" />
            </div>
            <h1 className="text-3xl font-bold">FAQ</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Quick answers to common questions about the platform.
          </p>
        </div>

        <div className="w-full max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search</CardTitle>
              <CardDescription>
                Type a keyword to filter questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search FAQs..."
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                {filteredFaqs.length} question{filteredFaqs.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No results. Try a different keyword.
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}


