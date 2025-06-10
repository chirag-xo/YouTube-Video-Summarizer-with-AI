import React, { useState } from 'react'
import { Link2, Play, Clock, FileText, Wand2, Download, CheckCircle, ExternalLink, AlertCircle, Info, Zap, Video } from 'lucide-react'
import { youtubeService, YouTubeVideoData } from '../services/youtubeService'
import { aiService, VideoSummaryData } from '../services/aiService'
import { videoGenerationService, GeneratedVideoResult } from '../services/videoGenerationService'

interface ProcessingStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  icon: React.ComponentType<any>
}

export function YouTubeProcessor() {
  const [url, setUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideoResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [videoData, setVideoData] = useState<YouTubeVideoData | null>(null)
  const [aiSummary, setAiSummary] = useState<VideoSummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'extract',
      title: 'Extract Video Content',
      description: 'Fetching video metadata and transcript from YouTube',
      status: 'pending',
      icon: Link2
    },
    {
      id: 'analyze',
      title: 'AI Content Analysis',
      description: 'Analyzing transcript with Groq AI (free tier)',
      status: 'pending',
      icon: FileText
    },
    {
      id: 'generate',
      title: 'Create 60s Summary Video',
      description: 'Generating video with Remotion and AI voiceover',
      status: 'pending',
      icon: Video
    },
    {
      id: 'complete',
      title: 'Ready for Download',
      description: 'Your personalized summary video is ready!',
      status: 'pending',
      icon: Download
    }
  ])

  const updateStepStatus = (stepIndex: number, status: ProcessingStep['status']) => {
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === stepIndex ? status : index < stepIndex ? 'completed' : 'pending'
    })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    const videoId = youtubeService.extractVideoId(url)
    if (!videoId) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setIsProcessing(true)
    setCurrentStep(0)
    setGeneratedVideo(null)
    setVideoData(null)
    setAiSummary(null)
    setError(null)

    try {
      // Step 1: Extract video data
      updateStepStatus(0, 'processing')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const fetchedVideoData = await youtubeService.fetchVideoData(videoId)
      setVideoData(fetchedVideoData)
      updateStepStatus(0, 'completed')

      // Step 2: Fetch transcript and analyze with AI
      updateStepStatus(1, 'processing')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const transcript = await youtubeService.fetchTranscript(videoId)
      const generatedAiSummary = await aiService.generateSummary(fetchedVideoData, transcript)
      setAiSummary(generatedAiSummary)
      updateStepStatus(1, 'completed')

      // Step 3: Generate actual summary video
      updateStepStatus(2, 'processing')
      await new Promise(resolve => setTimeout(resolve, 4000)) // Video generation takes longer
      
      const videoResult = await videoGenerationService.generateSummaryVideo(fetchedVideoData, generatedAiSummary)
      setGeneratedVideo(videoResult)
      updateStepStatus(2, 'completed')

      // Step 4: Complete
      updateStepStatus(3, 'completed')

    } catch (error) {
      console.error('Processing failed:', error)
      setError('Failed to process video. Please try again.')
      setSteps(prev => prev.map(step => ({ 
        ...step, 
        status: step.status === 'processing' ? 'error' : step.status 
      })))
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePreviewVideo = () => {
    if (generatedVideo) {
      setShowPreview(true)
    }
  }

  const handleDownloadVideo = async () => {
    if (!generatedVideo || !videoData) return

    try {
      const response = await fetch(generatedVideo.downloadUrl)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${videoData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_60sec_summary.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(generatedVideo.downloadUrl, '_blank')
    }
  }

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/
    return youtubeRegex.test(url)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20'
      case 'advanced': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 bg-green-500/20'
      case 'negative': return 'text-red-400 bg-red-500/20'
      default: return 'text-blue-400 bg-blue-500/20'
    }
  }

  const hasGroqKey = !!import.meta.env.VITE_GROQ_API_KEY
  const hasOpenAIKey = !!import.meta.env.VITE_OPENAI_API_KEY
  const hasElevenLabsKey = !!import.meta.env.VITE_ELEVENLABS_API_KEY

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Transform Long Videos into
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> AI-Powered</span>
          <br />
          60-Second Summaries
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Our AI analyzes the actual video content, extracts key insights, and creates personalized 60-second summaries 
          with intelligent narration and dynamic visuals using Remotion.
        </p>
      </div>

      {/* AI Service Status */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
        <div className="flex items-start space-x-3">
          <Zap className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-blue-300 text-sm">
              <strong>AI Service Status:</strong> {' '}
              {hasGroqKey ? (
                <span className="text-green-400">✓ Groq AI Connected (6,000 free requests/day)</span>
              ) : hasOpenAIKey ? (
                <span className="text-yellow-400">⚡ OpenAI Connected (paid service)</span>
              ) : (
                <span className="text-orange-400">⚠ Using Enhanced Mock Data (add API key for real AI analysis)</span>
              )}
            </p>
            <p className="text-blue-300 text-sm mt-1">
              <strong>Video Generation:</strong> {' '}
              {hasElevenLabsKey ? (
                <span className="text-green-400">✓ ElevenLabs Voice AI Connected</span>
              ) : (
                <span className="text-orange-400">⚠ Using mock voiceover (add ElevenLabs key for AI voice)</span>
              )}
            </p>
            {(!hasGroqKey && !hasOpenAIKey) && (
              <p className="text-gray-400 text-xs mt-2">
                Get a free Groq API key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">console.groq.com</a> for real AI-powered summaries
              </p>
            )}
          </div>
        </div>
      </div>

      {/* URL Input Form */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 mb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-300 mb-3">
              YouTube Video URL
            </label>
            <div className="relative">
              <input
                type="url"
                id="youtube-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full px-4 py-4 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isProcessing}
              />
              <Link2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {url && !isValidYouTubeUrl(url) && (
              <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>Please enter a valid YouTube URL</span>
              </p>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-400 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValidYouTubeUrl(url) || isProcessing}
            className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating AI Summary Video...</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                <span>Generate 60-Second Summary Video</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Video Info Display */}
      {videoData && !generatedVideo && (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex items-start space-x-4">
            <img 
              src={videoData.thumbnail} 
              alt="Video thumbnail"
              className="w-40 h-30 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{videoData.title}</h3>
              <p className="text-sm text-gray-400 mb-2">by {videoData.channelTitle}</p>
              <p className="text-sm text-gray-300 mb-3 line-clamp-2">{videoData.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Original: {formatDuration(videoData.duration)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Play className="w-3 h-3" />
                  <span>{formatNumber(videoData.viewCount)} views</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Video className="w-3 h-3" />
                  <span>Summary: 1:00</span>
                </span>
              </div>
              {videoData.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {videoData.tags.slice(0, 4).map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Steps */}
      {isProcessing && (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl font-semibold text-white mb-8">Creating Your AI Summary Video</h3>
          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    step.status === 'completed' 
                      ? 'bg-green-600 text-white' 
                      : step.status === 'processing'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : step.status === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : step.status === 'processing' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold transition-colors ${
                      step.status === 'completed' || step.status === 'processing' 
                        ? 'text-white' 
                        : step.status === 'error'
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}>
                      {step.title}
                    </h4>
                    <p className={`text-sm transition-colors ${
                      step.status === 'completed' || step.status === 'processing' 
                        ? 'text-gray-300' 
                        : step.status === 'error'
                        ? 'text-red-300'
                        : 'text-gray-500'
                    }`}>
                      {step.status === 'error' ? 'Processing failed - please try again' : step.description}
                    </p>
                  </div>
                  {step.status === 'processing' && (
                    <div className="flex-shrink-0">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed State */}
      {!isProcessing && generatedVideo && videoData && aiSummary && (
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md rounded-2xl p-8 border border-green-500/30">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">AI Summary Video Complete!</h3>
            <p className="text-gray-300 mb-6">Your personalized 60-second summary video has been generated with AI voiceover and dynamic visuals.</p>
            
            {/* Video Analysis Results */}
            <div className="bg-white/5 rounded-xl p-6 mb-6 text-left">
              <div className="flex items-start space-x-4 mb-4">
                <img 
                  src={generatedVideo.thumbnailUrl} 
                  alt="Video thumbnail"
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-2">{videoData.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Duration: {formatDuration(generatedVideo.duration)}</span>
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(aiSummary.difficulty)}`}>
                      {aiSummary.difficulty}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(aiSummary.sentiment)}`}>
                      {aiSummary.sentiment}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">
                      AI Generated
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {aiSummary.mainTopics.map((topic, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-400 mb-2">AI-Generated Summary:</h5>
                <p className="text-gray-300 text-sm leading-relaxed">{aiSummary.summary}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-400">Key Points in Video:</h5>
                <ul className="space-y-1">
                  {aiSummary.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-start">
                      <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Video Segments Info */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <h5 className="text-sm font-medium text-gray-400 mb-2">Video Structure ({generatedVideo.segments.length} segments):</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {generatedVideo.segments.map((segment, index) => (
                    <div key={index} className="bg-white/5 rounded p-2">
                      <div className="font-medium text-white capitalize">{segment.type}</div>
                      <div className="text-gray-400">{segment.startTime}s - {segment.endTime}s</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handlePreviewVideo}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Preview Summary Video</span>
              </button>
              <button 
                onClick={handleDownloadVideo}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download MP4</span>
              </button>
              <button 
                onClick={() => window.open(videoData.id ? `https://youtube.com/watch?v=${videoData.id}` : url, '_blank')}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Original Video</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {showPreview && generatedVideo && videoData && aiSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">60-Second AI Summary Video</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(generatedVideo.duration)}</span>
                  </span>
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                    AI Generated with Remotion
                  </span>
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
                    {generatedVideo.segments.length} Segments
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="aspect-video bg-black rounded-xl mb-6 overflow-hidden">
              <video 
                controls 
                className="w-full h-full"
                poster={generatedVideo.thumbnailUrl}
                preload="metadata"
              >
                <source src={generatedVideo.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Analysis Summary</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{aiSummary.summary}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-400">Content Analysis:</h4>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(aiSummary.difficulty)}`}>
                      {aiSummary.difficulty} level
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(aiSummary.sentiment)}`}>
                      {aiSummary.sentiment} tone
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Video Segments</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {generatedVideo.segments.map((segment, index) => (
                    <div key={index} className="bg-white/5 rounded p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-white capitalize">{segment.type}</span>
                        <span className="text-xs text-gray-400">{segment.startTime}s - {segment.endTime}s</span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">{segment.content.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Main Topics:</h4>
                  <div className="flex flex-wrap gap-1">
                    {aiSummary.mainTopics.map((topic, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-6 border-t border-white/10 mt-6">
              <button 
                onClick={handleDownloadVideo}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download Summary</span>
              </button>
              <button 
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        {[
          {
            icon: FileText,
            title: 'Real Content Analysis',
            description: 'AI analyzes actual video transcripts and metadata to create accurate, relevant summaries'
          },
          {
            icon: Video,
            title: 'Remotion Video Generation',
            description: 'Creates professional 60-second videos with AI voiceover, animations, and dynamic visuals'
          },
          {
            icon: Clock,
            title: 'Perfect 60-Second Format',
            description: 'Every summary is precisely timed with structured segments for maximum impact and engagement'
          }
        ].map((feature, index) => {
          const Icon = feature.icon
          return (
            <div key={index} className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}