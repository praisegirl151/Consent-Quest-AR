import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    onLine: true,
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue(new MediaStream()),
    },
  },
  writable: true,
})

vi.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => 'Mock response' }
      })
    })
  }))
}))

vi.mock('lucide-react', () => ({
  Camera: () => 'Camera',
  AlertCircle: () => 'AlertCircle',
  CheckCircle: () => 'CheckCircle',
  Shield: () => 'Shield',
  Zap: () => 'Zap',
  AlertTriangle: () => 'AlertTriangle',
  Send: () => 'Send',
}))