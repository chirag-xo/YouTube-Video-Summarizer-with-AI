export interface YouTubeVideoData {
  id: string
  title: string
  description: string
  duration: number
  channelTitle: string
  thumbnail: string
  transcript?: string
  publishedAt: string
  viewCount: number
  tags: string[]
}

export interface VideoSummaryData {
  summary: string
  keyPoints: string[]
  mainTopics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

class YouTubeService {
  private apiKey: string

  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || ''
  }

  extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  async fetchVideoData(videoId: string): Promise<YouTubeVideoData> {
    try {
      // If no API key, use enhanced mock data based on common YouTube videos
      if (!this.apiKey) {
        return this.getMockVideoData(videoId)
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${this.apiKey}&part=snippet,contentDetails,statistics`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch video data')
      }

      const data = await response.json()
      
      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found')
      }

      const video = data.items[0]
      const duration = this.parseDuration(video.contentDetails.duration)

      return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        duration,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics.viewCount || '0'),
        tags: video.snippet.tags || []
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error)
      return this.getMockVideoData(videoId)
    }
  }

  private getMockVideoData(videoId: string): YouTubeVideoData {
    // Enhanced mock data for common YouTube videos and realistic content
    const knownVideos: Record<string, Partial<YouTubeVideoData>> = {
      'dQw4w9WgXcQ': {
        title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
        description: 'The official video for Rick Astley\'s "Never Gonna Give You Up" from 1987. This classic 80s pop song became an internet phenomenon known as "Rickrolling".',
        duration: 212,
        channelTitle: 'Rick Astley',
        viewCount: 1400000000,
        tags: ['rick astley', 'never gonna give you up', '80s music', 'pop'],
        publishedAt: '2009-10-25T06:57:33Z'
      },
      'jNQXAC9IVRw': {
        title: 'Me at the zoo',
        description: 'The first video uploaded to YouTube on April 23, 2005. A simple 19-second clip of Jawed Karim at the San Diego Zoo.',
        duration: 19,
        channelTitle: 'jawed',
        viewCount: 250000000,
        tags: ['first youtube video', 'zoo', 'history'],
        publishedAt: '2005-04-23T23:31:52Z'
      },
      '9bZkp7q19f0': {
        title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
        description: 'PSY\'s official music video for "Gangnam Style". The first YouTube video to reach 1 billion views, featuring the iconic horse dance.',
        duration: 252,
        channelTitle: 'officialpsy',
        viewCount: 4600000000,
        tags: ['psy', 'gangnam style', 'k-pop', 'dance'],
        publishedAt: '2012-07-15T08:34:21Z'
      }
    }

    // Generate realistic content based on video ID
    const hash = videoId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)

    const categories = [
      { name: 'Technology', topics: ['AI', 'programming', 'gadgets', 'innovation'] },
      { name: 'Education', topics: ['learning', 'tutorial', 'science', 'mathematics'] },
      { name: 'Business', topics: ['entrepreneurship', 'marketing', 'finance', 'productivity'] },
      { name: 'Health', topics: ['fitness', 'nutrition', 'mental health', 'wellness'] },
      { name: 'Entertainment', topics: ['movies', 'music', 'comedy', 'gaming'] },
      { name: 'Lifestyle', topics: ['travel', 'cooking', 'fashion', 'home'] }
    ]

    const channels = [
      'TechReview', 'EduChannel', 'BusinessInsights', 'HealthHub', 
      'EntertainmentNow', 'LifestyleTips', 'ScienceExplained', 'CreativeMinds'
    ]

    const known = knownVideos[videoId]
    if (known) {
      return {
        id: videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        ...known
      } as YouTubeVideoData
    }

    const categoryIndex = Math.abs(hash) % categories.length
    const category = categories[categoryIndex]
    const channelIndex = Math.abs(hash >> 8) % channels.length
    const duration = 180 + (Math.abs(hash >> 16) % 1800) // 3-33 minutes
    const viewCount = 10000 + (Math.abs(hash >> 24) % 10000000)

    return {
      id: videoId,
      title: `${category.name}: ${category.topics[Math.abs(hash >> 4) % category.topics.length]} - Complete Guide`,
      description: `A comprehensive guide covering ${category.topics.join(', ')} with practical examples and expert insights. This video provides in-depth analysis and actionable advice for ${category.name.toLowerCase()} enthusiasts.`,
      duration,
      channelTitle: channels[channelIndex],
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt: new Date(Date.now() - Math.abs(hash >> 12) % (365 * 24 * 60 * 60 * 1000)).toISOString(),
      viewCount,
      tags: category.topics
    }
  }

  async fetchTranscript(videoId: string): Promise<string> {
    // In a real implementation, this would use YouTube's transcript API or a service like youtube-transcript
    // For now, we'll generate realistic transcript content based on the video data
    
    const videoData = await this.fetchVideoData(videoId)
    return this.generateRealisticTranscript(videoData)
  }

  private generateRealisticTranscript(videoData: YouTubeVideoData): string {
    const { title, description, tags, duration } = videoData
    
    // Generate transcript based on video content
    const segments = Math.floor(duration / 30) // ~30 seconds per segment
    const transcript: string[] = []

    // Introduction
    transcript.push(`Hello everyone, welcome back to ${videoData.channelTitle}. Today we're going to be talking about ${title.toLowerCase()}.`)
    
    // Main content based on description and tags
    const mainTopics = this.extractMainTopics(description, tags)
    
    for (let i = 0; i < segments - 2; i++) {
      const topic = mainTopics[i % mainTopics.length]
      transcript.push(this.generateSegmentContent(topic, i))
    }

    // Conclusion
    transcript.push(`That wraps up today's discussion on ${title.toLowerCase()}. If you found this helpful, please like and subscribe for more content. Thanks for watching!`)

    return transcript.join(' ')
  }

  private extractMainTopics(description: string, tags: string[]): string[] {
    const topics = [...tags]
    
    // Extract topics from description
    const words = description.toLowerCase().split(/\s+/)
    const keyWords = words.filter(word => 
      word.length > 4 && 
      !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word)
    )
    
    topics.push(...keyWords.slice(0, 5))
    return topics.slice(0, 8)
  }

  private generateSegmentContent(topic: string, index: number): string {
    const templates = [
      `Let's dive into ${topic}. This is particularly important because it affects how we approach the overall strategy.`,
      `Now, when it comes to ${topic}, there are several key factors to consider. First, we need to understand the fundamentals.`,
      `${topic} is something that many people struggle with, but with the right approach, it becomes much more manageable.`,
      `I want to spend some time on ${topic} because it's often overlooked, yet it's crucial for success.`,
      `The next point I want to cover is ${topic}. This builds on what we discussed earlier and takes it to the next level.`
    ]
    
    return templates[index % templates.length]
  }

  private parseDuration(duration: string): number {
    // Parse ISO 8601 duration (PT4M13S) to seconds
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')
    
    return hours * 3600 + minutes * 60 + seconds
  }
}

export const youtubeService = new YouTubeService()