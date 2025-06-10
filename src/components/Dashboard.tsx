import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Play, Download, Clock, Eye, Trash2, MoreVertical, Calendar, TrendingUp } from 'lucide-react'

interface VideoSummary {
  id: string
  title: string
  description: string
  youtube_url: string
  summary: string
  key_points: string[]
  video_duration: number
  summary_video_url: string | null
  status: 'processing' | 'completed' | 'failed'
  created_at: string
}

export function Dashboard() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState<VideoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSummary, setSelectedSummary] = useState<VideoSummary | null>(null)

  useEffect(() => {
    fetchSummaries()
  }, [user])

  const fetchSummaries = async () => {
    if (!user) return

    try {
      // Mock data for demonstration
      const mockSummaries: VideoSummary[] = [
        {
          id: '1',
          title: 'The Future of AI in Education',
          description: 'A comprehensive look at how artificial intelligence is transforming the educational landscape',
          youtube_url: 'https://youtube.com/watch?v=example1',
          summary: 'This video explores the revolutionary impact of AI on education, covering personalized learning, automated grading, and intelligent tutoring systems. Key insights include the potential for AI to create adaptive learning experiences that adjust to individual student needs.',
          key_points: [
            'AI enables personalized learning experiences',
            'Automated grading saves teachers time',
            'Intelligent tutoring systems provide 24/7 support',
            'Data analytics help identify learning gaps'
          ],
          video_duration: 1800,
          summary_video_url: 'https://example.com/summary1.mp4',
          status: 'completed',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          title: 'Climate Change Solutions',
          description: 'Exploring innovative approaches to combat climate change',
          youtube_url: 'https://youtube.com/watch?v=example2',
          summary: 'An in-depth analysis of cutting-edge climate solutions including renewable energy, carbon capture, and sustainable agriculture practices.',
          key_points: [
            'Renewable energy costs are rapidly declining',
            'Carbon capture technology shows promise',
            'Sustainable agriculture can reduce emissions',
            'Individual actions matter at scale'
          ],
          video_duration: 2400,
          summary_video_url: null,
          status: 'processing',
          created_at: '2024-01-14T15:45:00Z'
        },
        {
          id: '3',
          title: 'The Psychology of Productivity',
          description: 'Understanding the mental frameworks that drive peak performance',
          youtube_url: 'https://youtube.com/watch?v=example3',
          summary: 'This video breaks down the psychological principles behind productivity, including flow states, motivation science, and habit formation.',
          key_points: [
            'Flow states maximize performance',
            'Intrinsic motivation beats external rewards',
            'Small habits compound over time',
            'Environment design influences behavior'
          ],
          video_duration: 3600,
          summary_video_url: 'https://example.com/summary3.mp4',
          status: 'completed',
          created_at: '2024-01-13T09:15:00Z'
        }
      ]

      setSummaries(mockSummaries)
    } catch (error) {
      console.error('Error fetching summaries:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">Completed</span>
      case 'processing':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">Processing</span>
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">Failed</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading your summaries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Video Summaries</h1>
        <p className="text-gray-300">Manage and view your AI-generated video summaries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Summaries</p>
              <p className="text-2xl font-bold text-white">{summaries.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-white">{summaries.filter(s => s.status === 'completed').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Runtime</p>
              <p className="text-2xl font-bold text-white">
                {formatDuration(summaries.reduce((acc, s) => acc + s.video_duration, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Summaries Grid */}
      {summaries.length === 0 ? (
        <div className="text-center py-12">
          <Play className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No summaries yet</h3>
          <p className="text-gray-400 mb-6">Start by processing your first YouTube video</p>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all">
            Process Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {summaries.map((summary) => (
            <div key={summary.id} className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{summary.title}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{summary.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(summary.video_duration)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(summary.created_at)}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(summary.status)}
                  <button className="p-1 text-gray-400 hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Key Points */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Key Points:</h4>
                <ul className="space-y-1">
                  {summary.key_points.slice(0, 3).map((point, index) => (
                    <li key={index} className="text-sm text-gray-400 flex items-start">
                      <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                      <span className="line-clamp-1">{point}</span>
                    </li>
                  ))}
                  {summary.key_points.length > 3 && (
                    <li className="text-sm text-gray-500">+{summary.key_points.length - 3} more</li>
                  )}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedSummary(summary)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                
                {summary.status === 'completed' && summary.summary_video_url && (
                  <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                )}
                
                <button className="flex items-center justify-center px-3 py-2 text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedSummary.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{formatDuration(selectedSummary.video_duration)}</span>
                  <span>{formatDate(selectedSummary.created_at)}</span>
                  {getStatusBadge(selectedSummary.status)}
                </div>
              </div>
              <button
                onClick={() => setSelectedSummary(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
                <p className="text-gray-300 leading-relaxed">{selectedSummary.summary}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Key Points</h3>
                <ul className="space-y-2">
                  {selectedSummary.key_points.map((point, index) => (
                    <li key={index} className="flex items-start text-gray-300">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedSummary.status === 'completed' && selectedSummary.summary_video_url && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Summary Video</h3>
                  <div className="bg-black/30 rounded-xl p-8 text-center">
                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-4">60-second AI-generated summary</p>
                    <div className="flex justify-center space-x-4">
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Play Video
                      </button>
                      <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Download MP4
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}