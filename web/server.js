import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'

config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// LLM Provider Configuration
// Supports: litellm, vllm, compute3, venice, openai, anthropic, ollama
const LLM_PROVIDERS = {
  litellm: {
    baseUrl: process.env.LITELLM_BASE_URL || 'http://localhost:4000',
    apiKey: process.env.LITELLM_API_KEY || '',
    model: process.env.LITELLM_MODEL || 'gpt-3.5-turbo'
  },
  vllm: {
    baseUrl: process.env.VLLM_BASE_URL || 'http://localhost:8000',
    apiKey: process.env.VLLM_API_KEY || '',
    model: process.env.VLLM_MODEL || 'meta-llama/Llama-2-7b-chat-hf'
  },
  compute3: {
    baseUrl: 'https://api.compute3.ai/v1',
    apiKey: process.env.COMPUTE3_API_KEY || '',
    model: process.env.COMPUTE3_MODEL || 'deepseek-v3.1'
  },
  venice: {
    baseUrl: 'https://api.venice.ai/api/v1',
    apiKey: process.env.VENICE_API_KEY || '',
    model: process.env.VENICE_MODEL || 'llama-3.3-70b'
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307'
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    apiKey: '',
    model: process.env.OLLAMA_MODEL || 'llama2'
  }
}

// Get active provider
const getProvider = () => {
  const providerName = process.env.LLM_PROVIDER || 'litellm'
  const provider = LLM_PROVIDERS[providerName]
  
  if (!provider) {
    console.error(`Unknown provider: ${providerName}`)
    return null
  }
  
  return { name: providerName, ...provider }
}

// Build system prompt from soul content
const buildSystemPrompt = (soulContent, identityContent) => {
  if (!soulContent) {
    return 'You are a helpful AI assistant.'
  }
  
  // The soul content already contains the full system prompt
  let systemPrompt = soulContent
  
  // Append identity if available
  if (identityContent) {
    systemPrompt += '\n\n---\n\n' + identityContent
  }
  
  return systemPrompt
}

// Make LLM API call
const callLLM = async (provider, messages) => {
  const { name, baseUrl, apiKey, model } = provider
  
  // Build request based on provider
  let url, headers, body
  
  if (name === 'anthropic') {
    // Anthropic uses a different API format
    url = `${baseUrl}/messages`
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }
    
    // Extract system message
    const systemMsg = messages.find(m => m.role === 'system')
    const otherMsgs = messages.filter(m => m.role !== 'system')
    
    body = {
      model,
      max_tokens: 1024,
      system: systemMsg?.content || '',
      messages: otherMsgs
    }
  } else if (name === 'ollama') {
    // Ollama API
    url = `${baseUrl}/api/chat`
    headers = { 'Content-Type': 'application/json' }
    body = {
      model,
      messages,
      stream: false
    }
  } else {
    // OpenAI-compatible API (LiteLLM, vLLM, Compute3, Venice, OpenAI)
    url = `${baseUrl}/chat/completions`
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
    body = {
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7
    }
  }
  
  console.log(`Calling ${name} API:`, url)
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error (${response.status}): ${errorText}`)
  }
  
  const data = await response.json()
  
  // Extract response based on provider
  if (name === 'anthropic') {
    return data.content?.[0]?.text || ''
  } else if (name === 'ollama') {
    return data.message?.content || ''
  } else {
    return data.choices?.[0]?.message?.content || ''
  }
}

// Health check
app.get('/api/health', (req, res) => {
  const provider = getProvider()
  res.json({
    status: 'ok',
    provider: provider?.name || 'none',
    model: provider?.model || 'none'
  })
})

// Get provider info
app.get('/api/provider', (req, res) => {
  const provider = getProvider()
  res.json({
    name: provider?.name || 'none',
    model: provider?.model || 'none',
    configured: !!(provider?.apiKey || provider?.name === 'ollama')
  })
})

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, soul, identity, history = [] } = req.body
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }
    
    const provider = getProvider()
    if (!provider) {
      return res.status(500).json({ error: 'No LLM provider configured' })
    }
    
    // Check if API key is required and present
    if (provider.name !== 'ollama' && !provider.apiKey) {
      return res.status(500).json({ 
        error: `No API key configured for ${provider.name}. Set ${provider.name.toUpperCase()}_API_KEY environment variable.` 
      })
    }
    
    // Build messages array
    const systemPrompt = buildSystemPrompt(soul, identity)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.filter(m => m.role !== 'system'),
      { role: 'user', content: message }
    ]
    
    // Call LLM
    const response = await callLLM(provider, messages)
    
    res.json({ response })
    
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Start server
app.listen(PORT, () => {
  const provider = getProvider()
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    decc0 API Server                       ║
╠═══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                 ║
║  Provider: ${(provider?.name || 'none').padEnd(45)}║
║  Model: ${(provider?.model || 'none').padEnd(48)}║
╚═══════════════════════════════════════════════════════════╝

Environment Variables:
  LLM_PROVIDER     = ${process.env.LLM_PROVIDER || 'litellm (default)'}
  
Available Providers:
  - litellm   : LITELLM_BASE_URL, LITELLM_API_KEY, LITELLM_MODEL
  - vllm      : VLLM_BASE_URL, VLLM_API_KEY, VLLM_MODEL
  - compute3  : COMPUTE3_API_KEY, COMPUTE3_MODEL
  - venice    : VENICE_API_KEY, VENICE_MODEL
  - openai    : OPENAI_API_KEY, OPENAI_MODEL
  - anthropic : ANTHROPIC_API_KEY, ANTHROPIC_MODEL
  - ollama    : OLLAMA_BASE_URL, OLLAMA_MODEL
`)
})
