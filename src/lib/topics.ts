export interface Topic {
  id: string;
  name: string;
  description: string;
}

export interface GradeTopics {
  grade: string;
  grammar: Topic[];
  vocabulary: Topic[];
  readingComprehension: Topic[];
}

export const k12Topics: GradeTopics[] = [
  {
    grade: "K",
    grammar: [
      { id: "letters", name: "Letter Recognition", description: "Identifying uppercase and lowercase letters" },
      { id: "phonics", name: "Basic Phonics", description: "Letter sounds and simple blending" },
      { id: "sight-words", name: "Sight Words", description: "Common high-frequency words" },
      { id: "sentence-structure", name: "Simple Sentences", description: "Understanding basic sentence structure" }
    ],
    vocabulary: [
      { id: "colors", name: "Colors", description: "Basic color names" },
      { id: "shapes", name: "Shapes", description: "Circle, square, triangle, rectangle" },
      { id: "numbers", name: "Numbers 1-20", description: "Number words and recognition" },
      { id: "family", name: "Family Members", description: "Mom, dad, sister, brother, etc." },
      { id: "body-parts", name: "Body Parts", description: "Head, hands, feet, eyes, etc." }
    ],
    readingComprehension: [
      { id: "picture-stories", name: "Picture Stories", description: "Understanding stories through pictures" },
      { id: "sequence", name: "Story Sequence", description: "What happens first, next, last" },
      { id: "characters", name: "Story Characters", description: "Identifying main characters" }
    ]
  },
  {
    grade: "1",
    grammar: [
      { id: "nouns", name: "Nouns", description: "People, places, and things" },
      { id: "verbs", name: "Action Verbs", description: "Words that show action" },
      { id: "adjectives", name: "Describing Words", description: "Words that describe nouns" },
      { id: "capitalization", name: "Capitalization", description: "Beginning of sentences and names" },
      { id: "punctuation", name: "End Punctuation", description: "Periods, question marks, exclamation points" }
    ],
    vocabulary: [
      { id: "phonics-patterns", name: "Phonics Patterns", description: "CVC words, blends, digraphs" },
      { id: "compound-words", name: "Compound Words", description: "Two words that make one" },
      { id: "opposites", name: "Opposites", description: "Hot/cold, big/small, up/down" },
      { id: "rhyming", name: "Rhyming Words", description: "Words that sound alike" }
    ],
    readingComprehension: [
      { id: "main-idea", name: "Main Idea", description: "What the story is mostly about" },
      { id: "details", name: "Story Details", description: "Important information in the story" },
      { id: "predictions", name: "Making Predictions", description: "What will happen next" },
      { id: "connections", name: "Text Connections", description: "Relating to personal experiences" }
    ]
  },
  {
    grade: "2",
    grammar: [
      { id: "noun-types", name: "Common/Proper Nouns", description: "Regular nouns vs. specific names" },
      { id: "pronouns", name: "Pronouns", description: "He, she, it, they, we" },
      { id: "verb-tenses", name: "Past/Present Verbs", description: "Yesterday, today actions" },
      { id: "articles", name: "Articles", description: "A, an, the" },
      { id: "contractions", name: "Contractions", description: "Can't, don't, won't" }
    ],
    vocabulary: [
      { id: "prefixes", name: "Simple Prefixes", description: "Un-, re-, pre-" },
      { id: "suffixes", name: "Simple Suffixes", description: "-ed, -ing, -er, -est" },
      { id: "synonyms", name: "Synonyms", description: "Words with similar meanings" },
      { id: "multiple-meaning", name: "Multiple Meaning Words", description: "Words with more than one meaning" }
    ],
    readingComprehension: [
      { id: "cause-effect", name: "Cause and Effect", description: "Why things happen and what happens" },
      { id: "compare-contrast", name: "Compare and Contrast", description: "How things are alike and different" },
      { id: "story-elements", name: "Story Elements", description: "Characters, setting, problem, solution" },
      { id: "fact-opinion", name: "Fact vs. Opinion", description: "What can be proven vs. what someone thinks" }
    ]
  },
  {
    grade: "3",
    grammar: [
      { id: "subject-predicate", name: "Subject and Predicate", description: "Who/what and what they do" },
      { id: "plural-nouns", name: "Plural Nouns", description: "Regular and irregular plurals" },
      { id: "possessive-nouns", name: "Possessive Nouns", description: "Showing ownership with apostrophes" },
      { id: "adverbs", name: "Adverbs", description: "Words that describe verbs" },
      { id: "conjunctions", name: "Conjunctions", description: "And, but, or connecting words" }
    ],
    vocabulary: [
      { id: "root-words", name: "Root Words", description: "Base words before adding prefixes/suffixes" },
      { id: "antonyms", name: "Antonyms", description: "Words with opposite meanings" },
      { id: "homophones", name: "Homophones", description: "Words that sound the same but different meanings" },
      { id: "context-clues", name: "Context Clues", description: "Using surrounding words to understand meaning" }
    ],
    readingComprehension: [
      { id: "theme", name: "Theme", description: "The message or lesson of a story" },
      { id: "inference", name: "Making Inferences", description: "Reading between the lines" },
      { id: "summarizing", name: "Summarizing", description: "Retelling the most important parts" },
      { id: "text-features", name: "Text Features", description: "Headings, captions, bold words" }
    ]
  },
  {
    grade: "4",
    grammar: [
      { id: "sentence-types", name: "Types of Sentences", description: "Declarative, interrogative, imperative, exclamatory" },
      { id: "compound-sentences", name: "Compound Sentences", description: "Joining sentences with conjunctions" },
      { id: "quotation-marks", name: "Quotation Marks", description: "Direct speech and dialogue" },
      { id: "relative-pronouns", name: "Relative Pronouns", description: "Who, which, that" },
      { id: "progressive-verbs", name: "Progressive Verb Tenses", description: "Present and past progressive" }
    ],
    vocabulary: [
      { id: "greek-latin-roots", name: "Greek and Latin Roots", description: "Common word roots and their meanings" },
      { id: "figurative-language", name: "Figurative Language", description: "Similes, metaphors, idioms" },
      { id: "academic-vocabulary", name: "Academic Vocabulary", description: "Words used in school subjects" },
      { id: "word-relationships", name: "Word Relationships", description: "Categories, analogies" }
    ],
    readingComprehension: [
      { id: "point-of-view", name: "Point of View", description: "First person, third person" },
      { id: "text-structure", name: "Text Structure", description: "Sequence, problem/solution, compare/contrast" },
      { id: "author-purpose", name: "Author's Purpose", description: "Inform, persuade, entertain" },
      { id: "drawing-conclusions", name: "Drawing Conclusions", description: "Using evidence to make judgments" }
    ]
  },
  {
    grade: "5",
    grammar: [
      { id: "complex-sentences", name: "Complex Sentences", description: "Independent and dependent clauses" },
      { id: "verb-moods", name: "Verb Moods", description: "Indicative, imperative, interrogative" },
      { id: "perfect-tenses", name: "Perfect Verb Tenses", description: "Present, past, and future perfect" },
      { id: "prepositions", name: "Prepositions", description: "Words showing position or direction" },
      { id: "interjections", name: "Interjections", description: "Words expressing emotion" }
    ],
    vocabulary: [
      { id: "etymology", name: "Etymology", description: "Word origins and history" },
      { id: "connotation", name: "Connotation and Denotation", description: "Emotional vs. literal meanings" },
      { id: "technical-terms", name: "Technical Terms", description: "Subject-specific vocabulary" },
      { id: "word-analysis", name: "Word Analysis", description: "Breaking down unfamiliar words" }
    ],
    readingComprehension: [
      { id: "character-analysis", name: "Character Analysis", description: "Understanding character traits and motivations" },
      { id: "plot-analysis", name: "Plot Analysis", description: "Exposition, rising action, climax, resolution" },
      { id: "compare-texts", name: "Comparing Texts", description: "Similarities and differences between texts" },
      { id: "author-craft", name: "Author's Craft", description: "How authors use language and literary devices" }
    ]
  },
  {
    grade: "6",
    grammar: [
      { id: "phrases-clauses", name: "Phrases and Clauses", description: "Independent and dependent clauses" },
      { id: "active-passive", name: "Active and Passive Voice", description: "Subject performing vs. receiving action" },
      { id: "parallel-structure", name: "Parallel Structure", description: "Consistent grammatical patterns" },
      { id: "modifier-placement", name: "Modifier Placement", description: "Avoiding misplaced and dangling modifiers" },
      { id: "comma-rules", name: "Comma Rules", description: "Complex comma usage in sentences" }
    ],
    vocabulary: [
      { id: "morphology", name: "Morphology", description: "Word formation and structure" },
      { id: "semantic-relationships", name: "Semantic Relationships", description: "How words relate in meaning" },
      { id: "register", name: "Language Register", description: "Formal vs. informal language" },
      { id: "domain-specific", name: "Domain-Specific Vocabulary", description: "Subject area terminology" }
    ],
    readingComprehension: [
      { id: "literary-devices", name: "Literary Devices", description: "Symbolism, foreshadowing, irony" },
      { id: "text-analysis", name: "Text Analysis", description: "Deep reading and interpretation" },
      { id: "argument-analysis", name: "Argument Analysis", description: "Claims, evidence, reasoning" },
      { id: "media-literacy", name: "Media Literacy", description: "Analyzing different types of media" }
    ]
  },
  {
    grade: "7",
    grammar: [
      { id: "sentence-variety", name: "Sentence Variety", description: "Combining simple, compound, and complex sentences" },
      { id: "subjunctive-mood", name: "Subjunctive Mood", description: "Expressing wishes, hypotheticals, demands" },
      { id: "gerunds-infinitives", name: "Gerunds and Infinitives", description: "Verbal forms functioning as nouns" },
      { id: "appositives", name: "Appositives", description: "Noun phrases that rename or explain" },
      { id: "semicolon-usage", name: "Semicolon Usage", description: "Connecting related independent clauses" }
    ],
    vocabulary: [
      { id: "etymology-advanced", name: "Advanced Etymology", description: "Complex word origins and development" },
      { id: "nuance", name: "Nuance in Meaning", description: "Subtle differences in word meaning" },
      { id: "rhetoric", name: "Rhetorical Language", description: "Language used for persuasion" },
      { id: "archaic-language", name: "Archaic Language", description: "Old or outdated language forms" }
    ],
    readingComprehension: [
      { id: "theme-analysis", name: "Theme Analysis", description: "Complex themes and their development" },
      { id: "perspective", name: "Multiple Perspectives", description: "Different viewpoints in texts" },
      { id: "critical-reading", name: "Critical Reading", description: "Evaluating arguments and evidence" },
      { id: "intertextuality", name: "Intertextuality", description: "Connections between different texts" }
    ]
  },
  {
    grade: "8",
    grammar: [
      { id: "advanced-punctuation", name: "Advanced Punctuation", description: "Colons, dashes, parentheses" },
      { id: "conditional-sentences", name: "Conditional Sentences", description: "If-then constructions and their variations" },
      { id: "ellipsis", name: "Ellipsis and Omission", description: "When and how to omit words" },
      { id: "style-consistency", name: "Style Consistency", description: "Maintaining consistent voice and tone" },
      { id: "error-analysis", name: "Error Analysis", description: "Identifying and correcting common mistakes" }
    ],
    vocabulary: [
      { id: "academic-discourse", name: "Academic Discourse", description: "Language of academic writing" },
      { id: "precision", name: "Precision in Language", description: "Choosing the most accurate words" },
      { id: "wordplay", name: "Wordplay and Puns", description: "Creative uses of language" },
      { id: "borrowed-words", name: "Borrowed Words", description: "Words adopted from other languages" }
    ],
    readingComprehension: [
      { id: "rhetorical-analysis", name: "Rhetorical Analysis", description: "How authors persuade readers" },
      { id: "synthesis", name: "Synthesis", description: "Combining information from multiple sources" },
      { id: "evaluation", name: "Evaluation", description: "Judging the quality and validity of texts" },
      { id: "implicit-meaning", name: "Implicit Meaning", description: "Understanding what's not directly stated" }
    ]
  },
  {
    grade: "9",
    grammar: [
      { id: "advanced-clauses", name: "Advanced Clause Types", description: "Noun, adjective, and adverb clauses" },
      { id: "coordination-subordination", name: "Coordination and Subordination", description: "Balancing sentence elements" },
      { id: "nominalization", name: "Nominalization", description: "Converting verbs and adjectives to nouns" },
      { id: "stylistic-devices", name: "Stylistic Devices", description: "Grammar for effect and emphasis" },
      { id: "formal-register", name: "Formal Register", description: "Academic and professional writing conventions" }
    ],
    vocabulary: [
      { id: "sophisticated-vocabulary", name: "Sophisticated Vocabulary", description: "College-level word choices" },
      { id: "specialized-terminology", name: "Specialized Terminology", description: "Field-specific language" },
      { id: "language-evolution", name: "Language Evolution", description: "How language changes over time" },
      { id: "contextual-meaning", name: "Contextual Meaning", description: "How context affects word meaning" }
    ],
    readingComprehension: [
      { id: "literary-criticism", name: "Literary Criticism", description: "Analyzing literature through different lenses" },
      { id: "philosophical-texts", name: "Philosophical Texts", description: "Understanding complex abstract ideas" },
      { id: "historical-context", name: "Historical Context", description: "How time period affects meaning" },
      { id: "cultural-analysis", name: "Cultural Analysis", description: "Understanding cultural influences in texts" }
    ]
  },
  {
    grade: "10",
    grammar: [
      { id: "advanced-syntax", name: "Advanced Syntax", description: "Complex sentence structures and patterns" },
      { id: "rhetorical-grammar", name: "Rhetorical Grammar", description: "Using grammar for persuasive effect" },
      { id: "dialect-variations", name: "Dialect Variations", description: "Understanding different English varieties" },
      { id: "register-switching", name: "Register Switching", description: "Adapting language for different audiences" },
      { id: "grammar-style", name: "Grammar and Style", description: "How grammar choices affect meaning" }
    ],
    vocabulary: [
      { id: "etymology-analysis", name: "Etymology Analysis", description: "Deep word history investigation" },
      { id: "semantic-fields", name: "Semantic Fields", description: "Groups of related word meanings" },
      { id: "pragmatics", name: "Pragmatics", description: "How context affects language use" },
      { id: "lexical-analysis", name: "Lexical Analysis", description: "Systematic study of word choice" }
    ],
    readingComprehension: [
      { id: "discourse-analysis", name: "Discourse Analysis", description: "How language creates meaning in texts" },
      { id: "ideological-critique", name: "Ideological Critique", description: "Examining underlying beliefs and values" },
      { id: "comparative-literature", name: "Comparative Literature", description: "Analyzing texts across cultures" },
      { id: "reader-response", name: "Reader-Response Theory", description: "How readers create meaning" }
    ]
  },
  {
    grade: "11",
    grammar: [
      { id: "advanced-mechanics", name: "Advanced Mechanics", description: "Complex punctuation and formatting" },
      { id: "stylistic-analysis", name: "Stylistic Analysis", description: "Analyzing authors' grammatical choices" },
      { id: "language-variation", name: "Language Variation", description: "Regional, social, and historical differences" },
      { id: "prescriptive-descriptive", name: "Prescriptive vs. Descriptive", description: "Grammar rules vs. actual usage" },
      { id: "error-correction", name: "Advanced Error Correction", description: "Complex editing and proofreading" }
    ],
    vocabulary: [
      { id: "graduate-vocabulary", name: "Graduate-Level Vocabulary", description: "Advanced academic and professional terms" },
      { id: "linguistic-terminology", name: "Linguistic Terminology", description: "Terms for analyzing language" },
      { id: "cross-linguistic", name: "Cross-Linguistic Comparison", description: "Comparing English with other languages" },
      { id: "vocabulary-instruction", name: "Vocabulary Instruction", description: "How to learn and teach vocabulary" }
    ],
    readingComprehension: [
      { id: "metacognitive-reading", name: "Metacognitive Reading", description: "Thinking about thinking while reading" },
      { id: "research-synthesis", name: "Research Synthesis", description: "Combining scholarly sources" },
      { id: "argument-construction", name: "Argument Construction", description: "Building complex arguments from texts" },
      { id: "disciplinary-reading", name: "Disciplinary Reading", description: "Reading in specific academic fields" }
    ]
  },
  {
    grade: "12",
    grammar: [
      { id: "linguistic-analysis", name: "Linguistic Analysis", description: "Systematic study of language structures" },
      { id: "historical-grammar", name: "Historical Grammar", description: "How English grammar has evolved" },
      { id: "professional-writing", name: "Professional Writing", description: "Grammar for workplace communication" },
      { id: "editing-mastery", name: "Editing Mastery", description: "Advanced editing and revision skills" },
      { id: "style-guides", name: "Style Guides", description: "MLA, APA, Chicago, and other formatting systems" }
    ],
    vocabulary: [
      { id: "professional-vocabulary", name: "Professional Vocabulary", description: "Workplace and career-specific terms" },
      { id: "research-vocabulary", name: "Research Vocabulary", description: "Terms for academic research" },
      { id: "critical-vocabulary", name: "Critical Vocabulary", description: "Terms for analysis and critique" },
      { id: "vocabulary-pedagogy", name: "Vocabulary Pedagogy", description: "How vocabulary is taught and learned" }
    ],
    readingComprehension: [
      { id: "advanced-research", name: "Advanced Research Skills", description: "Sophisticated information literacy" },
      { id: "scholarly-discourse", name: "Scholarly Discourse", description: "Understanding academic conversations" },
      { id: "independent-analysis", name: "Independent Analysis", description: "Original interpretation and critique" },
      { id: "preparation-college", name: "College Preparation", description: "Reading skills for higher education" }
    ]
  }
];

export const getGradeTopics = (grade: string): GradeTopics | undefined => {
  return k12Topics.find(g => g.grade === grade);
};

export const getAllGrades = (): string[] => {
  return k12Topics.map(g => g.grade);
};
