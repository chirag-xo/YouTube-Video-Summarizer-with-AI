import { YouTubeVideoData, VideoSummaryData } from './youtubeService'

export class AIService {
  private groqApiKey: string;
  private openaiApiKey: string;
  private groqBaseUrl = 'https://api.groq.com/openai/v1';
  private openaiBaseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  async generateSummary(videoData: YouTubeVideoData, transcript: string): Promise<VideoSummaryData> {
    try {
      if (!transcript || transcript.trim().length === 0) {
        throw new Error('Transcript is empty or invalid');
      }

      // Try Groq first (free tier), then OpenAI, then fallback to mock
      if (this.groqApiKey) {
        try {
          return await this.generateSummaryWithGroq(videoData, transcript);
        } catch (groqError) {
          console.warn('Groq API failed, trying OpenAI:', groqError);
          if (this.openaiApiKey) {
            return await this.generateSummaryWithOpenAI(videoData, transcript);
          }
        }
      } else if (this.openaiApiKey) {
        return await this.generateSummaryWithOpenAI(videoData, transcript);
      }

      // Fallback to enhanced mock data
      return this.generateMockSummary(videoData, transcript);
    } catch (error) {
      console.error('Error in generateSummary:', error);
      return this.generateMockSummary(videoData, transcript);
    }
  }

  private async generateSummaryWithGroq(videoData: YouTubeVideoData, transcript: string): Promise<VideoSummaryData> {
    const prompt = this.createAnalysisPrompt(videoData, transcript);
    
    const response = await fetch(`${this.groqBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Fast and free model
        messages: [
          {
            role: 'system',
            content: 'You are an expert video content analyzer. Create comprehensive, accurate summaries that capture the essence of YouTube videos. Always respond with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Groq API');
    }

    return this.parseAIResponse(data.choices[0].message.content);
  }

  private async generateSummaryWithOpenAI(videoData: YouTubeVideoData, transcript: string): Promise<VideoSummaryData> {
    const prompt = this.createAnalysisPrompt(videoData, transcript);
    
    const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert video content analyzer. Create comprehensive, accurate summaries that capture the essence of YouTube videos. Always respond with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }

    return this.parseAIResponse(data.choices[0].message.content);
  }

  private createAnalysisPrompt(videoData: YouTubeVideoData, transcript: string): string {
    // Truncate transcript if too long to fit within token limits
    const maxTranscriptLength = 3000;
    const truncatedTranscript = transcript.length > maxTranscriptLength 
      ? transcript.substring(0, maxTranscriptLength) + '...'
      : transcript;

    return `Analyze this YouTube video and create a comprehensive summary for a 60-second AI-generated summary video:

**Video Information:**
- Title: ${videoData.title}
- Channel: ${videoData.channelTitle}
- Duration: ${Math.floor(videoData.duration / 60)} minutes ${videoData.duration % 60} seconds
- Description: ${videoData.description.substring(0, 500)}${videoData.description.length > 500 ? '...' : ''}
- Tags: ${videoData.tags.join(', ')}

**Video Transcript:**
${truncatedTranscript}

Please analyze the content and provide a JSON response with this exact structure:

{
  "summary": "A comprehensive 2-3 sentence summary that captures the main message and value of the video",
  "keyPoints": [
    "First key takeaway or important point",
    "Second key takeaway or important point", 
    "Third key takeaway or important point",
    "Fourth key takeaway or important point",
    "Fifth key takeaway or important point"
  ],
  "mainTopics": [
    "Primary topic or theme",
    "Secondary topic or theme",
    "Third topic or theme"
  ],
  "sentiment": "positive, neutral, or negative based on the overall tone",
  "difficulty": "beginner, intermediate, or advanced based on the complexity of content"
}

Focus on:
1. Extracting the most valuable insights from the actual transcript
2. Identifying actionable takeaways viewers can implement
3. Capturing the unique value proposition of this specific video
4. Ensuring the summary would be compelling for a 60-second format`;
  }

  private parseAIResponse(content: string): VideoSummaryData {
    try {
      // Clean the response to ensure it's valid JSON
      let cleanContent = content.trim();
      
      // Remove any markdown code blocks if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
      }

      const parsed = JSON.parse(cleanContent);
      
      return {
        summary: parsed.summary || 'AI-generated summary not available',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 6) : [],
        mainTopics: Array.isArray(parsed.mainTopics) ? parsed.mainTopics.slice(0, 4) : [],
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
        difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) ? parsed.difficulty : 'intermediate'
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  private generateMockSummary(videoData: YouTubeVideoData, transcript: string): VideoSummaryData {
    const { title, description, tags, channelTitle } = videoData;
    
    // Analyze transcript for better mock generation
    const transcriptWords = transcript.toLowerCase().split(/\s+/);
    const wordFreq = this.getWordFrequency(transcriptWords);
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);

    // Determine content type from title and transcript
    const isEducational = this.isEducationalContent(title, description, transcript);
    const isTechnical = this.isTechnicalContent(title, description, transcript);
    const isBusinessRelated = this.isBusinessContent(title, description, transcript);
    const isReview = this.isReviewContent(title, description, transcript);

    // Generate contextual summary
    let summary = '';
    if (isEducational) {
      summary = `This educational video from ${channelTitle} provides comprehensive guidance on ${title.toLowerCase()}. The content covers essential concepts and practical applications, making complex topics accessible through clear explanations and real-world examples.`;
    } else if (isTechnical) {
      summary = `${channelTitle} presents a technical deep-dive into ${title.toLowerCase()}. The video explores implementation details, best practices, and practical solutions, offering valuable insights for developers and technical professionals.`;
    } else if (isBusinessRelated) {
      summary = `This business-focused video from ${channelTitle} analyzes ${title.toLowerCase()}. The content provides strategic insights, market analysis, and actionable recommendations for professionals and entrepreneurs.`;
    } else if (isReview) {
      summary = `${channelTitle} delivers a comprehensive review of ${title.toLowerCase()}. The analysis covers key features, performance metrics, and practical considerations to help viewers make informed decisions.`;
    } else {
      summary = `This engaging video from ${channelTitle} explores ${title.toLowerCase()}. The content offers valuable insights and practical knowledge, covering important aspects that viewers can apply in their own context.`;
    }

    // Generate relevant key points based on content analysis
    const keyPoints = this.generateContextualKeyPoints(title, description, transcript, topWords, {
      isEducational,
      isTechnical,
      isBusinessRelated,
      isReview
    });

    // Extract main topics from transcript analysis
    const mainTopics = this.extractMainTopicsFromContent(title, tags, topWords);

    // Determine sentiment from transcript
    const sentiment = this.analyzeSentimentFromTranscript(transcript);

    // Determine difficulty
    const difficulty = this.determineDifficultyFromContent(title, description, transcript);

    return {
      summary,
      keyPoints,
      mainTopics,
      sentiment,
      difficulty
    };
  }

  private getWordFrequency(words: string[]): Record<string, number> {
    const freq: Record<string, number> = {};
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
      'his', 'her', 'its', 'our', 'their', 'so', 'if', 'when', 'where', 'why', 'how', 'what', 'who',
      'now', 'then', 'here', 'there', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
      'once', 'just', 'very', 'too', 'any', 'some', 'all', 'each', 'more', 'most', 'other', 'such',
      'only', 'own', 'same', 'few', 'much', 'many', 'long', 'well', 'way', 'even', 'new', 'old',
      'right', 'left', 'good', 'bad', 'big', 'small', 'high', 'low', 'first', 'last', 'next', 'back'
    ]);
    
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleaned.length > 3 && !stopWords.has(cleaned) && !/^\d+$/.test(cleaned)) {
        freq[cleaned] = (freq[cleaned] || 0) + 1;
      }
    });
    
    return freq;
  }

  private isEducationalContent(title: string, description: string, transcript: string): boolean {
    const educationalKeywords = ['tutorial', 'learn', 'guide', 'how to', 'step by step', 'course', 'lesson', 'teach', 'explain', 'understand'];
    const content = (title + ' ' + description + ' ' + transcript).toLowerCase();
    return educationalKeywords.some(keyword => content.includes(keyword));
  }

  private isTechnicalContent(title: string, description: string, transcript: string): boolean {
    const technicalKeywords = ['programming', 'coding', 'development', 'software', 'algorithm', 'api', 'framework', 'database', 'code', 'technical'];
    const content = (title + ' ' + description + ' ' + transcript).toLowerCase();
    return technicalKeywords.some(keyword => content.includes(keyword));
  }

  private isBusinessContent(title: string, description: string, transcript: string): boolean {
    const businessKeywords = ['business', 'marketing', 'strategy', 'finance', 'entrepreneur', 'startup', 'investment', 'revenue', 'profit', 'market'];
    const content = (title + ' ' + description + ' ' + transcript).toLowerCase();
    return businessKeywords.some(keyword => content.includes(keyword));
  }

  private isReviewContent(title: string, description: string, transcript: string): boolean {
    const reviewKeywords = ['review', 'comparison', 'vs', 'test', 'analysis', 'pros and cons', 'verdict', 'rating', 'opinion'];
    const content = (title + ' ' + description + ' ' + transcript).toLowerCase();
    return reviewKeywords.some(keyword => content.includes(keyword));
  }

  private generateContextualKeyPoints(title: string, description: string, transcript: string, topWords: string[], contentType: any): string[] {
    const keyPoints: string[] = [];
    
    if (contentType.isEducational) {
      keyPoints.push(
        `Comprehensive step-by-step approach to mastering ${topWords[0] || 'the subject'}`,
        `Practical examples and real-world applications demonstrated`,
        `Common pitfalls and how to avoid them effectively`,
        `Essential tools and resources for continued learning`,
        `Expert tips for accelerating your progress`
      );
    } else if (contentType.isTechnical) {
      keyPoints.push(
        `Technical implementation details and best practices`,
        `Code examples and practical demonstrations`,
        `Performance optimization techniques and considerations`,
        `Integration strategies with existing systems`,
        `Troubleshooting common issues and solutions`
      );
    } else if (contentType.isBusinessRelated) {
      keyPoints.push(
        `Strategic insights for business growth and development`,
        `Market analysis and competitive positioning`,
        `ROI considerations and financial implications`,
        `Implementation roadmap and timeline`,
        `Success metrics and performance indicators`
      );
    } else if (contentType.isReview) {
      keyPoints.push(
        `Comprehensive feature analysis and comparison`,
        `Real-world performance testing results`,
        `Value proposition and cost-benefit analysis`,
        `User experience and usability assessment`,
        `Final recommendations and verdict`
      );
    } else {
      keyPoints.push(
        `Key insights and main takeaways from the discussion`,
        `Practical applications you can implement immediately`,
        `Important considerations and factors to remember`,
        `Expert perspectives and industry insights shared`,
        `Next steps and recommended actions`
      );
    }

    return keyPoints;
  }

  private extractMainTopicsFromContent(title: string, tags: string[], topWords: string[]): string[] {
    const topics = new Set<string>();
    
    // Add relevant tags
    tags.forEach(tag => {
      if (tag.length > 2) topics.add(tag);
    });
    
    // Add significant words from title
    const titleWords = title.split(/\s+/).filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'how', 'what', 'why', 'when', 'where'].includes(word.toLowerCase())
    );
    titleWords.forEach(word => topics.add(word.toLowerCase()));
    
    // Add top words from transcript
    topWords.slice(0, 3).forEach(word => topics.add(word));
    
    return Array.from(topics).slice(0, 4);
  }

  private analyzeSentimentFromTranscript(transcript: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'perfect', 'love', 'best', 'good', 'helpful', 'useful', 'effective', 'successful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'horrible', 'disappointing', 'failed', 'problem', 'issue', 'difficult', 'hard', 'wrong', 'error'];
    
    const text = transcript.toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    
    if (positiveCount > negativeCount + 2) return 'positive';
    if (negativeCount > positiveCount + 2) return 'negative';
    return 'neutral';
  }

  private determineDifficultyFromContent(title: string, description: string, transcript: string): 'beginner' | 'intermediate' | 'advanced' {
    const content = (title + ' ' + description + ' ' + transcript).toLowerCase();
    
    const beginnerIndicators = ['beginner', 'introduction', 'basics', 'start', 'simple', 'easy', 'guide', 'tutorial', 'first time'];
    const advancedIndicators = ['advanced', 'expert', 'professional', 'complex', 'deep dive', 'comprehensive', 'technical', 'sophisticated'];
    
    const beginnerScore = beginnerIndicators.reduce((score, word) => score + (content.split(word).length - 1), 0);
    const advancedScore = advancedIndicators.reduce((score, word) => score + (content.split(word).length - 1), 0);
    
    if (beginnerScore > advancedScore + 1) return 'beginner';
    if (advancedScore > beginnerScore + 1) return 'advanced';
    return 'intermediate';
  }
}

export const aiService = new AIService();