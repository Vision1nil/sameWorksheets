"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { SavedWorksheet } from "@/types/worksheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PDFGenerator } from "@/lib/pdf-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Edit, Play } from "lucide-react";
import { InteractiveWorksheet } from "@/components/InteractiveWorksheet";
import { formatDistanceToNow } from "date-fns";

export default function WorksheetDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const [worksheet, setWorksheet] = useState<SavedWorksheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("preview");

  useEffect(() => {
    if (isSignedIn && user?.id && id) {
      const fetchWorksheet = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('worksheets')
            .select('*')
            .eq('id', id)
            .eq('userId', user.id)
            .single();

          if (error) {
            throw error;
          }

          if (!data) {
            setError('Worksheet not found');
            return;
          }

          setWorksheet(data);
        } catch (err) {
          console.error('Error fetching worksheet:', err);
          setError('Failed to load worksheet. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchWorksheet();
    }
  }, [id, isSignedIn, user?.id]);

  const handleDownloadPDF = async () => {
    if (!worksheet) return;
    
    try {
      const pdfGenerator = new PDFGenerator();
      await pdfGenerator.generatePDF(worksheet, { includeAnswerKey: false });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again later.');
    }
  };

  const handleDownloadAnswerKey = async () => {
    if (!worksheet) return;
    
    try {
      const pdfGenerator = new PDFGenerator();
      await pdfGenerator.generatePDF(worksheet, { includeAnswerKey: true });
    } catch (err) {
      console.error('Error generating answer key PDF:', err);
      alert('Failed to generate answer key PDF. Please try again later.');
    }
  };

  const handleEditWorksheet = () => {
    if (!worksheet) return;
    router.push(`/generate?edit=${worksheet.id}`);
  };

  const renderWorksheetContent = () => {
    if (!worksheet) return null;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{worksheet.title}</h1>
            <p className="text-muted-foreground">
              {worksheet.grade} • {worksheet.type.charAt(0).toUpperCase() + worksheet.type.slice(1)} • 
              {worksheet.topics.join(', ')} • {worksheet.difficulty.charAt(0).toUpperCase() + worksheet.difficulty.slice(1)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Created {formatDistanceToNow(new Date(worksheet.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadAnswerKey}>
              <Download className="mr-2 h-4 w-4" /> Answer Key
            </Button>
            <Button size="sm" variant="outline" onClick={handleEditWorksheet}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            {activeTab !== "practice" && (
              <Button onClick={() => setActiveTab("practice")}>
                <Play className="mr-2 h-4 w-4" /> Practice
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="prose dark:prose-invert max-w-none">
                  <h2>{worksheet.title}</h2>
                  <p className="text-muted-foreground italic">{worksheet.instructions}</p>
                  <div className="space-y-6 mt-6">
                    {worksheet.questions.map((question, index) => (
                      <div key={question.id} className="space-y-2">
                        <p className="font-medium">
                          {index + 1}. {question.question}
                        </p>
                        {question.type === "multiple-choice" && question.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                            {question.options.map((option, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {question.type === "fill-blank" && (
                          <div className="pl-6">
                            <div className="h-6 border-b border-dashed border-muted-foreground w-32"></div>
                          </div>
                        )}
                        {question.type === "short-answer" && (
                          <div className="pl-6">
                            <div className="h-12 border-b border-dashed border-muted-foreground"></div>
                          </div>
                        )}
                        {question.type === "essay" && (
                          <div className="pl-6">
                            <div className="h-32 border border-dashed border-muted-foreground p-2">
                              <span className="text-muted-foreground text-sm">Write your answer here...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="practice" className="mt-4">
            <Card>
              <CardContent className="p-6">
                {worksheet && (
                  <InteractiveWorksheet 
                    worksheet={worksheet}
                    userId={user?.id || ""}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="markdown" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                  {`# ${worksheet.title}

*${worksheet.instructions}*

${worksheet.questions.map((q, i) => {
  let questionText = `${i + 1}. ${q.question}\n`;
  
  if (q.type === "multiple-choice" && q.options) {
    questionText += q.options.map((opt, j) => 
      `   ${String.fromCharCode(65 + j)}. ${opt}`
    ).join('\n');
  }
  
  return questionText;
}).join('\n\n')}
`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-32 mb-8" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-32 mb-8" />
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              We encountered a problem loading this worksheet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => router.push('/worksheets')}>
              Back to My Worksheets
            </Button>
          </CardContent>
        </Card>
      ) : (
        renderWorksheetContent()
      )}
    </div>
  );
}
