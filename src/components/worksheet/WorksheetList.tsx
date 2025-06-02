"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search, 
  Calendar, 
  Download, 
  Trash2, 
  Eye, 
  Clock, 
  Filter, 
  SortAsc, 
  SortDesc,
  Loader2
} from "lucide-react";
import { getUserWorksheets, deleteWorksheet } from "@/lib/database";
import { PDFGenerator } from "@/lib/pdf-generator";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Worksheet {
  id: string;
  title: string;
  grade: string;
  type: 'grammar' | 'vocabulary' | 'readingComprehension';
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  lastAttemptedAt?: Date;
  completionRate?: number;
}

export function WorksheetList() {
  const { user } = useUser();
  const router = useRouter();
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [filteredWorksheets, setFilteredWorksheets] = useState<Worksheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<string>("grid");
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadWorksheets();
      
      // Set up real-time subscription
      const worksheetsSubscription = supabase
        .channel('worksheets-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'worksheets',
          filter: `user_id=eq.${user.id}`
        }, payload => {
          console.log('Worksheets update received:', payload);
          loadWorksheets();
        })
        .subscribe();
        
      return () => {
        worksheetsSubscription.unsubscribe();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [worksheets, searchTerm, filterType, filterGrade, filterDifficulty, sortBy]);

  const loadWorksheets = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to load from local mock data as a fallback
      let worksheetsData: Worksheet[] = [];
      
      try {
        // Try loading from Supabase first
        const { data, error } = await supabase
          .from('worksheets')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.warn('Supabase error:', error.message);
          // Don't throw, just continue to fallback
        } else if (data && data.length > 0) {
          // Format the worksheets if we got data successfully
          worksheetsData = data.map((worksheet: any) => ({
            id: worksheet.id,
            title: worksheet.title,
            grade: worksheet.grade,
            type: worksheet.type,
            topics: worksheet.topics || [],
            difficulty: worksheet.difficulty,
            createdAt: new Date(worksheet.created_at),
            lastAttemptedAt: worksheet.last_attempted_at ? new Date(worksheet.last_attempted_at) : undefined,
            completionRate: worksheet.completion_rate
          }));
        }
      } catch (supabaseError) {
        console.warn('Error accessing Supabase:', supabaseError);
        // Continue to fallback
      }
      
      // If we didn't get any worksheets from Supabase, use mock data
      if (worksheetsData.length === 0) {
        console.log('Using mock worksheet data');
        try {
          // Get mock data from local storage
          const mockWorksheets = await getUserWorksheets(user.id);
          
          // If we don't have any mock worksheets yet, create some sample ones
          if (mockWorksheets.length === 0) {
            // Create sample worksheets for first-time users
            const sampleWorksheets = [
              {
                id: `sample_1`,
                title: 'Grammar Basics',
                grade: '5',
                type: 'grammar' as const,
                topics: ['Nouns', 'Verbs', 'Adjectives'],
                difficulty: 'easy' as const,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
                completionRate: 100
              },
              {
                id: `sample_2`,
                title: 'Vocabulary Builder',
                grade: '6',
                type: 'vocabulary' as const,
                topics: ['Synonyms', 'Antonyms'],
                difficulty: 'medium' as const,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                completionRate: 75
              },
              {
                id: `sample_3`,
                title: 'Reading Comprehension',
                grade: '7',
                type: 'readingComprehension' as const,
                topics: ['Main Idea', 'Supporting Details'],
                difficulty: 'hard' as const,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                completionRate: 0
              }
            ];
            worksheetsData = sampleWorksheets;
          } else {
            worksheetsData = mockWorksheets;
          }
        } catch (mockError) {
          console.error('Error loading mock data:', mockError);
          setError('Unable to load worksheets. Please try refreshing the page.');
        }
      }
      
      setWorksheets(worksheetsData);
    } catch (err) {
      console.error('Error in worksheet loading process:', err);
      setError('Failed to load worksheets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...worksheets];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(worksheet => 
        worksheet.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(worksheet => worksheet.type === filterType);
    }
    
    // Apply grade filter
    if (filterGrade !== "all") {
      filtered = filtered.filter(worksheet => worksheet.grade === filterGrade);
    }
    
    // Apply difficulty filter
    if (filterDifficulty !== "all") {
      filtered = filtered.filter(worksheet => worksheet.difficulty === filterDifficulty);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    
    setFilteredWorksheets(filtered);
  };

  const handleViewWorksheet = (id: string) => {
    router.push(`/worksheets/${id}`);
  };

  const handleDownloadWorksheet = async (worksheet: Worksheet) => {
    try {
      // Fetch the full worksheet data
      const { data, error } = await supabase
        .from('worksheets')
        .select('*')
        .eq('id', worksheet.id)
        .single();
        
      if (error) throw error;
      
      const pdfGenerator = new PDFGenerator();
      await pdfGenerator.generatePDF(data, false);
    } catch (error) {
      console.error("Error downloading worksheet:", error);
    }
  };

  const handleDeleteWorksheet = async (id: string) => {
    if (!user?.id) return;
    
    setIsDeleting(prev => ({ ...prev, [id]: true }));
    
    try {
      await deleteWorksheet(id, user.id);
      
      // Update local state
      setWorksheets(prev => prev.filter(worksheet => worksheet.id !== id));
    } catch (error) {
      console.error("Error deleting worksheet:", error);
    } finally {
      setIsDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  const getUniqueGrades = () => {
    const grades = new Set(worksheets.map(w => w.grade));
    return Array.from(grades);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your worksheets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-500/20 bg-red-500/10 rounded-lg text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={loadWorksheets}>
          Try Again
        </Button>
      </div>
    );
  }

  if (worksheets.length === 0) {
    return (
      <div className="text-center p-12 border border-dashed border-gray-700 rounded-lg">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
        <h3 className="text-xl font-medium mb-2">No Worksheets Found</h3>
        <p className="text-muted-foreground mb-6">
          You haven't created any worksheets yet. Generate your first worksheet to get started.
        </p>
        <Button onClick={() => router.push('/generate')}>
          Create Worksheet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search worksheets..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="grammar">Grammar</SelectItem>
              <SelectItem value="vocabulary">Vocabulary</SelectItem>
              <SelectItem value="readingComprehension">Reading</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {getUniqueGrades().map(grade => (
                <SelectItem key={grade} value={grade}>
                  {grade === "K" ? "Kindergarten" : `Grade ${grade}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              {sortBy.includes('asc') ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* View Mode Selector */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredWorksheets.length} of {worksheets.length} worksheets
          </p>
        </div>
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
          <TabsList className="tech-border">
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Worksheets */}
      <TabsContent value="grid" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorksheets.map(worksheet => (
            <Card key={worksheet.id} className="tech-card tech-hover overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{worksheet.title}</CardTitle>
                  <Badge className={`
                    ${worksheet.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' : 
                      worksheet.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 
                      'bg-red-500/20 text-red-300'}
                  `}>
                    {worksheet.difficulty.charAt(0).toUpperCase() + worksheet.difficulty.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(worksheet.createdAt), 'MMM d, yyyy')}
                  
                  {worksheet.lastAttemptedAt && (
                    <div className="flex items-center ml-3">
                      <Clock className="h-3 w-3 mr-1" />
                      Last used: {format(new Date(worksheet.lastAttemptedAt), 'MMM d')}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-black/30">
                    {worksheet.grade === "K" ? "Kindergarten" : `Grade ${worksheet.grade}`}
                  </Badge>
                  <Badge variant="outline" className="bg-black/30">
                    {worksheet.type === 'grammar' ? 'Grammar' : 
                     worksheet.type === 'vocabulary' ? 'Vocabulary' : 
                     'Reading'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {worksheet.topics.slice(0, 3).map((topic, index) => (
                    <Badge key={index} variant="secondary" className="bg-primary/10">
                      {topic}
                    </Badge>
                  ))}
                  {worksheet.topics.length > 3 && (
                    <Badge variant="secondary" className="bg-primary/10">
                      +{worksheet.topics.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="tech-border"
                    onClick={() => handleViewWorksheet(worksheet.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="tech-border"
                      onClick={() => handleDownloadWorksheet(worksheet)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-500 hover:text-red-400 tech-border"
                      onClick={() => handleDeleteWorksheet(worksheet.id)}
                      disabled={isDeleting[worksheet.id]}
                    >
                      {isDeleting[worksheet.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="list" className="mt-0">
        <div className="space-y-2">
          {filteredWorksheets.map(worksheet => (
            <div 
              key={worksheet.id} 
              className="flex items-center justify-between p-4 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-md ${
                  worksheet.type === 'grammar' ? 'bg-blue-500/20' : 
                  worksheet.type === 'vocabulary' ? 'bg-purple-500/20' : 
                  'bg-green-500/20'
                }`}>
                  <FileText className="h-5 w-5" />
                </div>
                
                <div>
                  <h3 className="font-medium line-clamp-1">{worksheet.title}</h3>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Badge variant="outline" className="mr-2 bg-black/30">
                      {worksheet.grade === "K" ? "Kindergarten" : `Grade ${worksheet.grade}`}
                    </Badge>
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(worksheet.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={`
                  ${worksheet.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' : 
                    worksheet.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 
                    'bg-red-500/20 text-red-300'}
                `}>
                  {worksheet.difficulty.charAt(0).toUpperCase() + worksheet.difficulty.slice(1)}
                </Badge>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="tech-border"
                  onClick={() => handleViewWorksheet(worksheet.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="tech-border"
                  onClick={() => handleDownloadWorksheet(worksheet)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-500 hover:text-red-400 tech-border"
                  onClick={() => handleDeleteWorksheet(worksheet.id)}
                  disabled={isDeleting[worksheet.id]}
                >
                  {isDeleting[worksheet.id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>
    </div>
  );
}
