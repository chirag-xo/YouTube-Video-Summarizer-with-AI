export interface AnimationKeyframe {
  time: number
  properties: Record<string, any>
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic'
}

export interface TextAnimation {
  type: 'typewriter' | 'fadeIn' | 'slideIn' | 'scaleIn' | 'glitch' | 'wave'
  duration: number
  delay: number
  stagger?: number // For character-by-character animations
}

export interface TransitionEffect {
  type: 'crossfade' | 'slide' | 'zoom' | 'wipe' | 'morph' | 'particle'
  duration: number
  direction?: 'left' | 'right' | 'up' | 'down' | 'center'
  easing: string
}

class AnimationService {
  private easingFunctions: Record<string, (t: number) => number>

  constructor() {
    this.easingFunctions = {
      linear: (t: number) => t,
      easeIn: (t: number) => t * t,
      easeOut: (t: number) => 1 - (1 - t) * (1 - t),
      easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
      bounce: (t: number) => {
        const n1 = 7.5625
        const d1 = 2.75
        if (t < 1 / d1) return n1 * t * t
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
        return n1 * (t -= 2.625 / d1) * t + 0.984375
      },
      elastic: (t: number) => {
        const c4 = (2 * Math.PI) / 3
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
      }
    }
  }

  createTextAnimation(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    animation: TextAnimation,
    progress: number,
    style: {
      font: string
      fillStyle: string
      strokeStyle?: string
      lineWidth?: number
      textAlign?: CanvasTextAlign
      maxWidth?: number
    }
  ): void {
    ctx.save()
    
    // Apply text styles
    ctx.font = style.font
    ctx.fillStyle = style.fillStyle
    ctx.textAlign = style.textAlign || 'left'
    
    if (style.strokeStyle) {
      ctx.strokeStyle = style.strokeStyle
      ctx.lineWidth = style.lineWidth || 2
    }

    const animationProgress = Math.max(0, Math.min(1, (progress - animation.delay) / animation.duration))
    
    switch (animation.type) {
      case 'typewriter':
        this.renderTypewriterText(ctx, text, x, y, animationProgress, style)
        break
      case 'fadeIn':
        this.renderFadeInText(ctx, text, x, y, animationProgress, style)
        break
      case 'slideIn':
        this.renderSlideInText(ctx, text, x, y, animationProgress, style)
        break
      case 'scaleIn':
        this.renderScaleInText(ctx, text, x, y, animationProgress, style)
        break
      case 'glitch':
        this.renderGlitchText(ctx, text, x, y, animationProgress, style)
        break
      case 'wave':
        this.renderWaveText(ctx, text, x, y, animationProgress, style, animation.stagger || 0.1)
        break
    }
    
    ctx.restore()
  }

  private renderTypewriterText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    progress: number,
    style: any
  ): void {
    const visibleChars = Math.floor(text.length * progress)
    const visibleText = text.substring(0, visibleChars)
    
    ctx.fillText(visibleText, x, y, style.maxWidth)
    
    // Add blinking cursor
    if (progress < 1 && Math.floor(Date.now() / 500) % 2) {
      const cursorX = x + ctx.measureText(visibleText).width
      ctx.fillRect(cursorX, y - 20, 2, 25)
    }
  }

  private renderFadeInText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    progress: number,
    style: any
  ): void {
    const easedProgress = this.easingFunctions.easeOut(progress)
    ctx.globalAlpha = easedProgress
    ctx.fillText(text, x, y, style.maxWidth)
    
    if (style.strokeStyle) {
      ctx.strokeText(text, x, y, style.maxWidth)
    }
  }

  private renderSlideInText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    progress: number,
    style: any
  ): void {
    const easedProgress = this.easingFunctions.easeOut(progress)
    const slideDistance = 100
    const currentX = x - slideDistance * (1 - easedProgress)
    
    ctx.globalAlpha = easedProgress
    ctx.fillText(text, currentX, y, style.maxWidth)
    
    if (style.strokeStyle) {
      ctx.strokeText(text, currentX, y, style.maxWidth)
    }
  }

  private renderScaleInText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    progress: number,
    style: any
  ): void {
    const easedProgress = this.easingFunctions.bounce(progress)
    const scale = 0.3 + easedProgress * 0.7
    
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.translate(-x, -y)
    
    ctx.globalAlpha = progress
    ctx.fillText(text, x, y, style.maxWidth)
    
    if (style.strokeStyle) {
      ctx.strokeText(text, x, y, style.maxWidth)
    }
    
    ctx.restore()
  }

  private renderGlitchText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    progress: number,
    style: any
  ): void {
    if (progress < 0.1) return
    
    const glitchIntensity = Math.sin(progress * 20) * 5
    const offsetX = (Math.random() - 0.5) * glitchIntensity
    const offsetY = (Math.random() - 0.5) * glitchIntensity
    
    // Main text
    ctx.fillText(text, x + offsetX, y + offsetY, style.maxWidth)
    
    // Glitch layers
    if (Math.random() < 0.3) {
      ctx.save()
      ctx.fillStyle = '#ff0000'
      ctx.globalAlpha = 0.5
      ctx.fillText(text, x + offsetX + 2, y + offsetY, style.maxWidth)
      ctx.restore()
    }
    
    if (Math.random() < 0.3) {
      ctx.save()
      ctx.fillStyle = '#00ff00'
      ctx.globalAlpha = 0.5
      ctx.fillText(text, x + offsetX - 2, y + offsetY, style.maxWidth)
      ctx.restore()
    }
  }

  private renderWaveText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    progress: number,
    style: any,
    stagger: number
  ): void {
    const chars = text.split('')
    let currentX = x
    
    chars.forEach((char, index) => {
      const charProgress = Math.max(0, Math.min(1, progress - index * stagger))
      const waveOffset = Math.sin(charProgress * Math.PI * 2 + index * 0.5) * 10 * charProgress
      
      ctx.save()
      ctx.globalAlpha = charProgress
      ctx.fillText(char, currentX, y + waveOffset)
      
      if (style.strokeStyle) {
        ctx.strokeText(char, currentX, y + waveOffset)
      }
      
      currentX += ctx.measureText(char).width
      ctx.restore()
    })
  }

  createImageTransition(
    ctx: CanvasRenderingContext2D,
    fromImage: HTMLImageElement | null,
    toImage: HTMLImageElement | null,
    transition: TransitionEffect,
    progress: number,
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    const easedProgress = this.easingFunctions[transition.easing as keyof typeof this.easingFunctions](progress) || progress
    
    switch (transition.type) {
      case 'crossfade':
        this.renderCrossfadeTransition(ctx, fromImage, toImage, easedProgress, bounds)
        break
      case 'slide':
        this.renderSlideTransition(ctx, fromImage, toImage, easedProgress, bounds, transition.direction || 'left')
        break
      case 'zoom':
        this.renderZoomTransition(ctx, fromImage, toImage, easedProgress, bounds)
        break
      case 'wipe':
        this.renderWipeTransition(ctx, fromImage, toImage, easedProgress, bounds, transition.direction || 'left')
        break
      case 'morph':
        this.renderMorphTransition(ctx, fromImage, toImage, easedProgress, bounds)
        break
      case 'particle':
        this.renderParticleTransition(ctx, fromImage, toImage, easedProgress, bounds)
        break
    }
  }

  private renderCrossfadeTransition(
    ctx: CanvasRenderingContext2D,
    fromImage: HTMLImageElement | null,
    toImage: HTMLImageElement | null,
    progress: number,
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    // Draw from image with decreasing opacity
    if (fromImage) {
      ctx.save()
      ctx.globalAlpha = 1 - progress
      ctx.drawImage(fromImage, bounds.x, bounds.y, bounds.width, bounds.height)
      ctx.restore()
    }
    
    // Draw to image with increasing opacity
    if (toImage) {
      ctx.save()
      ctx.globalAlpha = progress
      ctx.drawImage(toImage, bounds.x, bounds.y, bounds.width, bounds.height)
      ctx.restore()
    }
  }

  private renderSlideTransition(
    ctx: CanvasRenderingContext2D,
    fromImage: HTMLImageElement | null,
    toImage: HTMLImageElement | null,
    progress: number,
    bounds: { x: number; y: number; width: number; height: number },
    direction: string
  ): void {
    const { x, y, width, height } = bounds
    
    let fromX = x, fromY = y, toX = x, toY = y
    
    switch (direction) {
      case 'left':
        fromX = x - width * progress
        toX = x + width * (1 - progress)
        break
      case 'right':
        fromX = x + width * progress
        toX = x - width * (1 - progress)
        break
      case 'up':
        fromY = y - height * progress
        toY = y + height * (1 - progress)
        break
      case 'down':
        fromY = y + height * progress
        toY = y - height * (1 - progress)
        break
    }
    
    // Draw from image sliding out
    if (fromImage) {
      ctx.drawImage(fromImage, fromX, fromY, width, height)
    }
    
    // Draw to image sliding in
    if (toImage) {
      ctx.drawImage(toImage, toX, toY, width, height)
    }
  }

  private renderZoomTransition(
    ctx: CanvasRenderingContext2D,
    fromImage: HTMLImageElement | null,
    toImage: HTMLImageElement | null,
    progress: number,
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    const { x, y, width, height } = bounds
    const centerX = x + width / 2
    const centerY = y + height / 2
    
    // Draw from image scaling down
    if (fromImage) {
      ctx.save()
      const fromScale = 1 - progress * 0.5
      ctx.globalAlpha = 1 - progress
      ctx.translate(centerX, centerY)
      ctx.scale(fromScale, fromScale)
      ctx.translate(-centerX, -centerY)
      ctx.drawImage(fromImage, x, y, width, height)
      ctx.restore()
    }
    
    // Draw to image scaling up
    if (toImage) {
      ctx.save()
      const toScale = 0.5 + progress * 0.5
      ctx.globalAlpha = progress
      ctx.translate(centerX, centerY)
      ctx.scale(toScale, toScale)
      ctx.translate(-centerX, -centerY)
      ctx.drawImage(toImage, x, y, width, height)
      ctx.restore()
    }
  }

  private renderWipeTransition(
    ctx: CanvasRenderingContext2D,
    fromImage: HTMLImageElement | null,
    toImage: HTMLImageElement | null,
    progress: number,
    bounds: { x: number; y: number; width: number; height: number },
    direction: string
  ): void {
    const { x, y, width, height } = bounds
    
    // Draw from image
    if (fromImage) {
      ctx.drawImage(fromImage, x, y, width, height)
    }
    
    // Create clipping mask for to image
    if (toImage) {
      ctx.save()
      ctx.beginPath()
      
      switch (direction) {
        case 'left':
          ctx.rect(x, y, width * progress, height)
          break
        case 'right':
          ctx.rect(x + width * (1 - progress), y, width * progress, height)
          break
        case 'up':
          ctx.rect(x, y, width, height * progress)
          break
        case 'down':
          ctx.rect(x, y + height * (1 - progress), width, height * progress)
          break
        case 'center':
          const radius = Math.min(width, height) * progress / 2
          ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2)
          break
      }
      
      ctx.clip()
      ctx.drawImage(toImage, x, y, width, height)
      ctx.restore()
    }
  }

  private renderMorphTransition(
    ctx: CanvasRenderingContext2D,
    fromImage: HTMLImageElement | null,
    toImage: HTMLImageElement | null,
    progress: number,
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    // Simplified morph effect using blend modes
    if (fromImage) {
      ctx.save()
      ctx.globalAlpha = 1 - progress
      ctx.drawImage(fromImage, bounds.x, bounds.y, bounds.width, bounds.height)
      ctx.restore()
    }
    
    if (toImage) {
      ctx.save()
      ctx.globalAlpha = progress
      ctx.globalCompositeOperation = 'screen'
      ctx.drawImage(toImage, bounds.x, bounds.y, bounds.width, bounds.height)
      ctx.restore()
    }
  }

  private renderParticleTransition(
    ctx: CanvasRenderingContext2D,
    fromImage: HTMLImageElement | null,
    toImage: HTMLImageElement | null,
    progress: number,
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    // Draw base images
    if (fromImage) {
      ctx.save()
      ctx.globalAlpha = 1 - progress
      ctx.drawImage(fromImage, bounds.x, bounds.y, bounds.width, bounds.height)
      ctx.restore()
    }
    
    if (toImage) {
      ctx.save()
      ctx.globalAlpha = progress
      ctx.drawImage(toImage, bounds.x, bounds.y, bounds.width, bounds.height)
      ctx.restore()
    }
    
    // Add particle effect
    const particleCount = 50
    for (let i = 0; i < particleCount; i++) {
      const particleProgress = Math.max(0, Math.min(1, progress * 2 - i / particleCount))
      if (particleProgress > 0) {
        const x = bounds.x + Math.random() * bounds.width
        const y = bounds.y + Math.random() * bounds.height
        const size = 2 + Math.random() * 4
        
        ctx.save()
        ctx.globalAlpha = particleProgress * (1 - particleProgress) * 4
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
  }

  interpolateValue(from: number, to: number, progress: number, easing: string = 'linear'): number {
    const easingFn = this.easingFunctions[easing] || this.easingFunctions.linear
    const easedProgress = easingFn(progress)
    return from + (to - from) * easedProgress
  }

  createParallaxEffect(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    bounds: { x: number; y: number; width: number; height: number },
    scrollProgress: number,
    speed: number = 0.5
  ): void {
    const offset = scrollProgress * speed * bounds.height
    ctx.drawImage(image, bounds.x, bounds.y - offset, bounds.width, bounds.height)
  }
}

export const animationService = new AnimationService()