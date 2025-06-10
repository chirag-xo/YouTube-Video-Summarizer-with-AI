export interface GeneratedImage {
  url: string
  prompt: string
  type: 'concept' | 'illustration' | 'diagram' | 'background'
  relevanceScore: number
}

export interface ImageGenerationRequest {
  prompt: string
  style: 'photorealistic' | 'illustration' | 'minimal' | 'abstract' | 'diagram'
  aspectRatio: '16:9' | '1:1' | '4:3'
  quality: 'standard' | 'hd'
}

class ImageGenerationService {
  private openaiApiKey: string
  private fallbackImages: Record<string, string[]>

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
    
    // Curated high-quality stock images organized by topic
    this.fallbackImages = {
      technology: [
        'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
      ],
      business: [
        'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
      ],
      education: [
        'https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/301926/pexels-photo-301926.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
      ],
      health: [
        'https://images.pexels.com/photos/40751/running-runner-long-distance-fitness-40751.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
      ],
      science: [
        'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1366922/pexels-photo-1366922.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
      ],
      lifestyle: [
        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1640781/pexels-photo-1640781.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
      ],
      abstract: [
        'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
        'https://images.pexels.com/photos/1323555/pexels-photo-1323555.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop'
      ]
    }
  }

  async generateContextualImages(
    videoTitle: string,
    keyPoints: string[],
    mainTopics: string[],
    difficulty: string,
    sentiment: string
  ): Promise<GeneratedImage[]> {
    const images: GeneratedImage[] = []

    try {
      // Generate images for each key point if OpenAI API is available
      if (this.openaiApiKey) {
        for (let i = 0; i < Math.min(keyPoints.length, 5); i++) {
          const keyPoint = keyPoints[i]
          const image = await this.generateImageWithDALLE(keyPoint, mainTopics, difficulty, sentiment)
          if (image) {
            images.push(image)
          }
        }
      }

      // If no AI images or need fallbacks, use curated stock images
      if (images.length === 0) {
        const contextualImages = this.selectContextualStockImages(videoTitle, keyPoints, mainTopics, difficulty, sentiment)
        images.push(...contextualImages)
      }

      return images
    } catch (error) {
      console.error('Image generation failed:', error)
      return this.selectContextualStockImages(videoTitle, keyPoints, mainTopics, difficulty, sentiment)
    }
  }

  private async generateImageWithDALLE(
    keyPoint: string,
    mainTopics: string[],
    difficulty: string,
    sentiment: string
  ): Promise<GeneratedImage | null> {
    try {
      const prompt = this.createImagePrompt(keyPoint, mainTopics, difficulty, sentiment)
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
          style: difficulty === 'beginner' ? 'natural' : 'vivid'
        })
      })

      if (!response.ok) {
        throw new Error(`DALL-E API failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.data && data.data[0] && data.data[0].url) {
        return {
          url: data.data[0].url,
          prompt: prompt,
          type: 'illustration',
          relevanceScore: 0.9
        }
      }

      return null
    } catch (error) {
      console.error('DALL-E generation failed:', error)
      return null
    }
  }

  private createImagePrompt(
    keyPoint: string,
    mainTopics: string[],
    difficulty: string,
    sentiment: string
  ): string {
    const style = difficulty === 'beginner' ? 'simple, clean illustration' : 
                  difficulty === 'advanced' ? 'detailed, professional diagram' : 
                  'modern, engaging visual'
    
    const mood = sentiment === 'positive' ? 'bright, optimistic colors' :
                 sentiment === 'negative' ? 'muted, serious tones' :
                 'balanced, professional palette'

    return `Create a ${style} representing "${keyPoint}" in the context of ${mainTopics.join(', ')}. Use ${mood}. The image should be educational, clear, and suitable for a video summary. Avoid text overlays. 16:9 aspect ratio.`
  }

  private selectContextualStockImages(
    videoTitle: string,
    keyPoints: string[],
    mainTopics: string[],
    difficulty: string,
    sentiment: string
  ): GeneratedImage[] {
    const images: GeneratedImage[] = []
    
    // Analyze content to determine best image categories
    const categories = this.categorizeContent(videoTitle, keyPoints, mainTopics)
    
    // Select images from relevant categories
    categories.forEach((category, index) => {
      const categoryImages = this.fallbackImages[category] || this.fallbackImages.abstract
      const imageIndex = index % categoryImages.length
      
      images.push({
        url: categoryImages[imageIndex],
        prompt: `Stock image for ${category} content`,
        type: 'concept',
        relevanceScore: 0.7 - (index * 0.1)
      })
    })

    // Ensure we have at least 5 images
    while (images.length < 5) {
      const randomCategory = Object.keys(this.fallbackImages)[images.length % Object.keys(this.fallbackImages).length]
      const categoryImages = this.fallbackImages[randomCategory]
      const imageIndex = images.length % categoryImages.length
      
      images.push({
        url: categoryImages[imageIndex],
        prompt: `Additional ${randomCategory} image`,
        type: 'background',
        relevanceScore: 0.5
      })
    }

    return images.slice(0, 6) // Return max 6 images
  }

  private categorizeContent(videoTitle: string, keyPoints: string[], mainTopics: string[]): string[] {
    const content = (videoTitle + ' ' + keyPoints.join(' ') + ' ' + mainTopics.join(' ')).toLowerCase()
    const categories: string[] = []

    // Technology keywords
    if (this.containsKeywords(content, ['tech', 'ai', 'programming', 'software', 'digital', 'computer', 'code', 'algorithm'])) {
      categories.push('technology')
    }

    // Business keywords
    if (this.containsKeywords(content, ['business', 'marketing', 'finance', 'entrepreneur', 'startup', 'strategy', 'management', 'sales'])) {
      categories.push('business')
    }

    // Education keywords
    if (this.containsKeywords(content, ['learn', 'education', 'tutorial', 'guide', 'teach', 'study', 'course', 'lesson'])) {
      categories.push('education')
    }

    // Health keywords
    if (this.containsKeywords(content, ['health', 'fitness', 'wellness', 'nutrition', 'exercise', 'medical', 'mental', 'physical'])) {
      categories.push('health')
    }

    // Science keywords
    if (this.containsKeywords(content, ['science', 'research', 'experiment', 'data', 'analysis', 'theory', 'discovery', 'innovation'])) {
      categories.push('science')
    }

    // Lifestyle keywords
    if (this.containsKeywords(content, ['lifestyle', 'travel', 'food', 'fashion', 'home', 'personal', 'hobby', 'entertainment'])) {
      categories.push('lifestyle')
    }

    // Default to abstract if no specific categories found
    if (categories.length === 0) {
      categories.push('abstract', 'technology', 'business')
    }

    return categories
  }

  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword))
  }

  async preloadImages(images: GeneratedImage[]): Promise<HTMLImageElement[]> {
    const loadPromises = images.map(image => this.loadImage(image.url))
    
    try {
      const loadedImages = await Promise.all(loadPromises)
      return loadedImages.filter(img => img !== null) as HTMLImageElement[]
    } catch (error) {
      console.error('Failed to preload some images:', error)
      return []
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => resolve(img)
      img.onerror = () => {
        console.warn(`Failed to load image: ${url}`)
        resolve(null)
      }
      
      // Set timeout for loading
      setTimeout(() => {
        if (!img.complete) {
          resolve(null)
        }
      }, 5000)
      
      img.src = url
    })
  }
}

export const imageGenerationService = new ImageGenerationService()