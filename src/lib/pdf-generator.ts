import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface WorksheetData {
  title: string;
  grade: string;
  type: string;
  topics: string[];
  instructions: string;
  questions: Array<{
    id: number;
    type: "multiple-choice" | "fill-blank" | "short-answer" | "essay";
    question: string;
    options?: string[];
    answer?: string;
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  includeAnswerKey?: boolean;
}

export class PDFGenerator {
  private pdf: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;

  constructor() {
    this.pdf = new jsPDF('portrait', 'mm', 'a4');
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
    this.lineHeight = 8;
  }

  async generateWorksheetPDF(worksheetData: WorksheetData): Promise<void> {
    // Header
    this.addHeader(worksheetData);

    // Student info section
    this.addStudentInfo();

    // Instructions
    this.addInstructions(worksheetData.instructions);

    // Questions
    this.addQuestions(worksheetData.questions);

    // Answer key on separate page if requested
    if (worksheetData.includeAnswerKey) {
      this.pdf.addPage();
      this.currentY = this.margin;
      this.addAnswerKey(worksheetData.questions);
    }

    // Download the PDF
    this.pdf.save(`${worksheetData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  }

  private addHeader(worksheetData: WorksheetData): void {
    // Title
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(worksheetData.title, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;

    // Grade and type info
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'normal');
    const gradeText = `Grade: ${worksheetData.grade === 'K' ? 'Kindergarten' : worksheetData.grade}`;
    const typeText = `Type: ${worksheetData.type}`;
    const difficultyText = `Difficulty: ${worksheetData.difficulty.charAt(0).toUpperCase() + worksheetData.difficulty.slice(1)}`;

    this.pdf.text(gradeText, this.margin, this.currentY);
    this.pdf.text(typeText, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.pdf.text(difficultyText, this.pageWidth - this.margin, this.currentY, { align: 'right' });
    this.currentY += 10;

    // Topics
    const topicsText = `Topics: ${worksheetData.topics.join(', ')}`;
    this.pdf.setFontSize(10);
    this.pdf.text(topicsText, this.margin, this.currentY);
    this.currentY += 10;

    // Divider line
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addStudentInfo(): void {
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'normal');

    // Name field
    this.pdf.text('Name: ', this.margin, this.currentY);
    this.pdf.line(this.margin + 20, this.currentY, this.pageWidth / 2 - 10, this.currentY);

    // Date field
    this.pdf.text('Date: ', this.pageWidth / 2, this.currentY);
    this.pdf.line(this.pageWidth / 2 + 15, this.currentY, this.pageWidth - this.margin, this.currentY);

    this.currentY += 15;
  }

  private addInstructions(instructions: string): void {
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Instructions:', this.margin, this.currentY);
    this.currentY += 6;

    this.pdf.setFont('helvetica', 'normal');
    const splitInstructions = this.pdf.splitTextToSize(instructions, this.pageWidth - 2 * this.margin);
    this.pdf.text(splitInstructions, this.margin, this.currentY);
    this.currentY += splitInstructions.length * 5 + 10;
  }

  private addQuestions(questions: WorksheetData['questions']): void {
    questions.forEach((question, index) => {
      this.checkPageBreak(30); // Ensure enough space for question

      // Question number and text
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${index + 1}.`, this.margin, this.currentY);

      this.pdf.setFont('helvetica', 'normal');
      const questionText = this.pdf.splitTextToSize(question.question, this.pageWidth - 2 * this.margin - 10);
      this.pdf.text(questionText, this.margin + 10, this.currentY);
      this.currentY += questionText.length * 5 + 5;

      // Question-specific content
      switch (question.type) {
        case 'multiple-choice':
          this.addMultipleChoiceOptions(question.options || []);
          break;
        case 'fill-blank':
          this.addFillInBlank();
          break;
        case 'short-answer':
          this.addShortAnswerLines(3);
          break;
        case 'essay':
          this.addShortAnswerLines(8);
          break;
      }

      this.currentY += 5; // Space between questions
    });
  }

  private addMultipleChoiceOptions(options: string[]): void {
    options.forEach((option, index) => {
      const letter = String.fromCharCode(65 + index); // A, B, C, D
      this.pdf.text(`☐ ${letter}. ${option}`, this.margin + 15, this.currentY);
      this.currentY += 6;
    });
  }

  private addFillInBlank(): void {
    this.pdf.text('Answer: ', this.margin + 15, this.currentY);
    this.pdf.line(this.margin + 35, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
  }

  private addShortAnswerLines(numLines: number): void {
    for (let i = 0; i < numLines; i++) {
      this.pdf.line(this.margin + 15, this.currentY, this.pageWidth - this.margin, this.currentY);
      this.currentY += 8;
    }
  }

  private addAnswerKey(questions: WorksheetData['questions']): void {
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Answer Key', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;

    this.pdf.setFontSize(11);
    
    // Filter out reading passages
    const actualQuestions = questions.filter(q => !q.question.includes('READING_PASSAGE:'));
    
    actualQuestions.forEach((question, index) => {
      this.checkPageBreak(20); // Ensure enough space for question and answer
      
      // Question number and text
      this.pdf.setFont('helvetica', 'bold');
      const questionNumber = index + 1;
      const questionText = `${questionNumber}. ${question.question}`;
      const splitQuestion = this.pdf.splitTextToSize(questionText, this.pageWidth - 2 * this.margin);
      this.pdf.text(splitQuestion, this.margin, this.currentY);
      this.currentY += splitQuestion.length * 5 + 5;
      
      // Answer
      this.pdf.setFont('helvetica', 'normal');
      let answerText = '';
      
      if (question.type === 'multiple-choice' && question.options) {
        // For multiple choice, show which option is correct
        const correctOption = question.answer;
        const correctIndex = question.options.findIndex(opt => opt === correctOption);
        const letter = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '?';
        answerText = `Correct Answer: ${letter}. ${correctOption || 'Not specified'}`;
      } else if (question.type === 'essay') {
        // For essays, show evaluation criteria
        answerText = 'Evaluation Criteria:\n';
        answerText += '- Content (40%): Addresses all aspects of the prompt\n';
        answerText += '- Organization (30%): Clear structure with logical flow\n';
        answerText += '- Evidence (20%): Uses specific examples to support claims\n';
        answerText += '- Language (10%): Uses appropriate vocabulary and grammar';
        
        if (question.answer) {
          answerText += '\n\nSample Response:\n' + question.answer;
        }
      } else {
        // For other question types
        answerText = `Correct Answer: ${question.answer || 'Not specified'}`;
      }
      
      const splitAnswer = this.pdf.splitTextToSize(answerText, this.pageWidth - 2 * this.margin - 5);
      this.pdf.setTextColor(0, 100, 0); // Dark green for answers
      this.pdf.text(splitAnswer, this.margin + 5, this.currentY);
      this.pdf.setTextColor(0, 0, 0); // Reset to black
      
      this.currentY += splitAnswer.length * 5 + 10; // Add more space between questions
    });
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  // Main method to generate PDF with optional answer key
  async generatePDF(worksheetData: WorksheetData, showAnswerKey: boolean = false): Promise<void> {
    try {
      // Use the existing method but control answer key display based on parameter
      const dataWithAnswerKey = {
        ...worksheetData,
        includeAnswerKey: showAnswerKey
      };
      
      await this.generateWorksheetPDF(dataWithAnswerKey);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}

// Alternative method using HTML to PDF conversion
export async function generatePDFFromHTML(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('portrait', 'mm', 'a4');

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
