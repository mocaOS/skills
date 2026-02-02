<script setup>
import { ref, onMounted, nextTick, computed, watch, onUnmounted } from 'vue'

// State
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const currentSoul = ref(null)
const messagesContainer = ref(null)
const inputRef = ref(null)

// Command palette state
const showCommandPalette = ref(false)
const commandSearch = ref('')
const selectedCommandIndex = ref(0)
const commandInputRef = ref(null)

// Streaming state
const streamingMessage = ref('')
const isStreaming = ref(false)

// Commands with keyboard shortcuts
const commands = [
  { id: 'load-random', label: 'Load Random Soul', shortcut: 'Ctrl+L', action: 'load', icon: '?' },
  { id: 'load-id', label: 'Load Soul by ID', shortcut: 'Ctrl+I', action: 'load-id', icon: '#' },
  { id: 'search', label: 'Search Souls', shortcut: 'Ctrl+S', action: 'search', icon: '/' },
  { id: 'list', label: 'List Souls', shortcut: 'Ctrl+K', action: 'list', icon: '=' },
  { id: 'clear', label: 'Clear Chat', shortcut: 'Ctrl+X', action: 'clear', icon: 'x' },
  { id: 'help', label: 'Show Help', shortcut: '?', action: 'help', icon: 'i' },
]

// Prompts (quick message templates)
const prompts = [
  { id: 'greet', label: 'Greet the soul', prompt: 'Hello! Tell me about yourself.' },
  { id: 'story', label: 'Tell me a story', prompt: 'Tell me an interesting story from your life.' },
  { id: 'wisdom', label: 'Share wisdom', prompt: 'What wisdom would you share with someone just starting out?' },
  { id: 'day', label: 'Describe your day', prompt: 'What does a typical day look like for you?' },
  { id: 'passion', label: 'Your passions', prompt: 'What are you most passionate about?' },
]

// API endpoints
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
const DECC0_API = 'https://api.decc0s.com'

// Filtered commands based on search
const filteredCommands = computed(() => {
  const search = commandSearch.value.toLowerCase()
  const filtered = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search) || 
    cmd.id.includes(search)
  )
  return filtered
})

// Watch command search to reset selection
watch(commandSearch, () => {
  selectedCommandIndex.value = 0
})

// Scroll to bottom smoothly
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// Add message with optional streaming effect
const addMessage = (content, type = 'system', meta = {}) => {
  const msg = {
    id: Date.now() + Math.random(),
    content,
    type, // 'user', 'assistant', 'system', 'data'
    meta,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  messages.value.push(msg)
  scrollToBottom()
  return msg
}

// Simulate streaming text effect
const streamText = async (text, msgId) => {
  isStreaming.value = true
  const msg = messages.value.find(m => m.id === msgId)
  if (!msg) return

  const chars = text.split('')
  msg.content = ''
  
  for (let i = 0; i < chars.length; i++) {
    msg.content += chars[i]
    if (i % 3 === 0) {
      await new Promise(r => setTimeout(r, 10))
      scrollToBottom()
    }
  }
  
  isStreaming.value = false
}

// Format data beautifully for display
const formatDataMessage = (data) => {
  return data
}

// Load soul
const loadSoul = async (identifier) => {
  let soulId
  let searchMode = false

  if (!identifier || identifier === 'rand') {
    soulId = Math.floor(Math.random() * 9999) + 1
    addMessage(`Loading random soul #${soulId}...`, 'system')
  } else if (!isNaN(identifier)) {
    soulId = parseInt(identifier)
    addMessage(`Loading soul #${soulId}...`, 'system')
  } else {
    searchMode = true
    addMessage(`Searching for "${identifier}"...`, 'system')
  }

  try {
    let response, data

    if (searchMode) {
      response = await fetch(`${DECC0_API}/items/codex?filter[name][_contains]=${encodeURIComponent(identifier)}&fields=id,name,description,moltbot,thumbnail&limit=1`)
      data = await response.json()
      if (!data.data || data.data.length === 0) {
        addMessage(`No soul found matching "${identifier}"`, 'system')
        return
      }
      data = { data: data.data[0] }
      soulId = data.data.id
    } else {
      response = await fetch(`${DECC0_API}/items/codex/${soulId}?fields=id,name,description,moltbot,thumbnail`)
      data = await response.json()
    }

    if (!data.data) {
      addMessage(`Soul #${soulId} not found`, 'system')
      return
    }

    const soul = data.data
    const name = soul.name?.[0] || `Soul #${soulId}`
    const avatarUrl = soul.thumbnail ? `${DECC0_API}/assets/${soul.thumbnail}?key=s512` : null
    const soulContent = soul.moltbot?.['v0.1']?.soul || null
    const identityContent = soul.moltbot?.['v0.1']?.identity || null

    let emoji = ''
    let residence = 'Unknown'
    if (identityContent) {
      const emojiMatch = identityContent.match(/Emoji:\s*(.+)/)
      const residenceMatch = identityContent.match(/Residence:\s*(.+)/)
      if (emojiMatch) emoji = emojiMatch[1].trim()
      if (residenceMatch) residence = residenceMatch[1].trim()
    }

    let temperament = ''
    if (soulContent) {
      const tempMatch = soulContent.match(/## Core Temperament\s*\n([^\n#]+)/)
      if (tempMatch) temperament = tempMatch[1].trim()
    }

    currentSoul.value = {
      id: soulId,
      name,
      emoji,
      residence,
      temperament,
      avatar: avatarUrl,
      soulContent,
      identityContent,
      description: soul.description
    }

    // Create beautiful data display
    const dataMsg = addMessage('', 'data')
    const soulCard = `
+------------------------------------------+
|  SOUL LOADED                             |
+------------------------------------------+
|                                          |
|  ${emoji} ${name.padEnd(36)}|
|                                          |
|  ID:          #${String(soulId).padEnd(26)}|
|  Residence:   ${residence.substring(0, 26).padEnd(26)}|
|                                          |
|  Temperament:                            |
|  ${temperament.substring(0, 40).padEnd(40)}|
|                                          |
+------------------------------------------+
|  Ready to chat! Type a message below.    |
+------------------------------------------+`

    await streamText(soulCard, dataMsg.id)

  } catch (error) {
    console.error('Error loading soul:', error)
    addMessage(`Error: ${error.message}`, 'system')
  }
}

// List souls
const listSouls = async (limit = 10) => {
  addMessage(`Fetching ${limit} souls...`, 'system')
  
  try {
    const response = await fetch(`${DECC0_API}/items/codex?fields=id,name,description&limit=${limit}`)
    const data = await response.json()
    
    if (!data.data || data.data.length === 0) {
      addMessage('No souls found', 'system')
      return
    }

    const dataMsg = addMessage('', 'data')
    let table = `
+------+------------------------------------------+
| ID   | NAME                                     |
+------+------------------------------------------+`
    
    data.data.forEach(soul => {
      const name = (soul.name?.[0] || `Soul #${soul.id}`).substring(0, 40)
      table += `\n| ${String(soul.id).padEnd(4)} | ${name.padEnd(40)} |`
    })
    
    table += `
+------+------------------------------------------+
  ${data.data.length} souls listed. Use Ctrl+I to load by ID.`

    await streamText(table, dataMsg.id)
  } catch (error) {
    console.error('Error listing souls:', error)
    addMessage(`Error: ${error.message}`, 'system')
  }
}

// Search souls
const searchSouls = async (term) => {
  addMessage(`Searching "${term}"...`, 'system')
  
  try {
    const response = await fetch(`${DECC0_API}/items/codex?search=${encodeURIComponent(term)}&fields=id,name,description&limit=10`)
    const data = await response.json()
    
    if (!data.data || data.data.length === 0) {
      addMessage(`No results for "${term}"`, 'system')
      return
    }

    const dataMsg = addMessage('', 'data')
    let results = `
+------------------------------------------+
|  SEARCH RESULTS: "${term.substring(0, 20)}"
+------+------------------------------------------+
| ID   | NAME                                     |
+------+------------------------------------------+`
    
    data.data.forEach(soul => {
      const name = (soul.name?.[0] || `Soul #${soul.id}`).substring(0, 40)
      results += `\n| ${String(soul.id).padEnd(4)} | ${name.padEnd(40)} |`
    })
    
    results += `
+------+------------------------------------------+`

    await streamText(results, dataMsg.id)
  } catch (error) {
    console.error('Error searching:', error)
    addMessage(`Error: ${error.message}`, 'system')
  }
}

// Chat with soul
const chatWithSoul = async (userMessage) => {
  if (!currentSoul.value) {
    addMessage('No soul loaded. Press Ctrl+L to load one.', 'system')
    return
  }

  isLoading.value = true

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        soul: currentSoul.value.soulContent,
        identity: currentSoul.value.identityContent,
        history: messages.value
          .filter(m => m.type === 'user' || m.type === 'assistant')
          .slice(-10)
          .map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
      })
    })

    const data = await response.json()
    
    if (data.error) {
      addMessage(`Error: ${data.error}`, 'system')
    } else {
      const msgObj = addMessage('', 'assistant', { 
        avatar: currentSoul.value.avatar,
        name: currentSoul.value.name,
        emoji: currentSoul.value.emoji
      })
      await streamText(data.response, msgObj.id)
    }
  } catch (error) {
    console.error('Chat error:', error)
    addMessage(`Connection error: ${error.message}`, 'system')
  } finally {
    isLoading.value = false
  }
}

// Show help
const showHelp = () => {
  const dataMsg = addMessage('', 'data')
  const helpText = `
+------------------------------------------+
|  DECC0 - KEYBOARD SHORTCUTS              |
+------------------------------------------+
|                                          |
|  COMMANDS                                |
|  Ctrl+Space    Open command palette      |
|  Ctrl+L        Load random soul          |
|  Ctrl+I        Load soul by ID           |
|  Ctrl+S        Search souls              |
|  Ctrl+K        List souls                |
|  Ctrl+X        Clear chat                |
|  Escape        Close palette / Cancel    |
|                                          |
|  NAVIGATION                              |
|  Up/Down       Navigate in palette       |
|  Enter         Execute / Send message    |
|  Tab           Cycle through prompts     |
|                                          |
|  PROMPTS                                 |
|  Type a message and press Enter to chat  |
|  Use Tab to insert quick prompts         |
|                                          |
+------------------------------------------+`
  streamText(helpText, dataMsg.id)
}

// Execute command
const executeCommand = async (cmd) => {
  showCommandPalette.value = false
  commandSearch.value = ''
  
  switch (cmd.action) {
    case 'load':
      await loadSoul()
      break
    case 'load-id':
      const id = prompt('Enter Soul ID (1-9999) or name:')
      if (id) await loadSoul(id)
      break
    case 'search':
      const term = prompt('Search term:')
      if (term) await searchSouls(term)
      break
    case 'list':
      await listSouls()
      break
    case 'clear':
      messages.value = []
      showWelcome()
      break
    case 'help':
      showHelp()
      break
  }
  
  inputRef.value?.focus()
}

// Handle send
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  addMessage(message, 'user')
  inputMessage.value = ''
  
  await chatWithSoul(message)
}

// Prompt cycling
let promptIndex = -1
const cyclePrompt = () => {
  promptIndex = (promptIndex + 1) % prompts.length
  inputMessage.value = prompts[promptIndex].prompt
}

// Global keyboard handler
const handleGlobalKeydown = (e) => {
  // Command palette
  if (e.ctrlKey && e.code === 'Space') {
    e.preventDefault()
    showCommandPalette.value = !showCommandPalette.value
    if (showCommandPalette.value) {
      nextTick(() => commandInputRef.value?.focus())
    }
    return
  }

  // Escape
  if (e.key === 'Escape') {
    if (showCommandPalette.value) {
      showCommandPalette.value = false
      inputRef.value?.focus()
    }
    return
  }

  // Command shortcuts when palette is closed
  if (!showCommandPalette.value && e.ctrlKey) {
    const shortcuts = {
      'KeyL': 'load',
      'KeyI': 'load-id',
      'KeyS': 'search',
      'KeyK': 'list',
      'KeyX': 'clear',
    }
    
    if (shortcuts[e.code]) {
      e.preventDefault()
      const cmd = commands.find(c => c.action === shortcuts[e.code])
      if (cmd) executeCommand(cmd)
    }
  }

  // ? for help
  if (e.key === '?' && !showCommandPalette.value && document.activeElement !== inputRef.value) {
    e.preventDefault()
    showHelp()
  }
}

// Command palette navigation
const handlePaletteKeydown = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedCommandIndex.value = Math.min(selectedCommandIndex.value + 1, filteredCommands.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedCommandIndex.value = Math.max(selectedCommandIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredCommands.value[selectedCommandIndex.value]) {
      executeCommand(filteredCommands.value[selectedCommandIndex.value])
    }
  }
}

// Input keydown
const handleInputKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  } else if (e.key === 'Tab') {
    e.preventDefault()
    cyclePrompt()
  }
}

// Welcome message
const showWelcome = () => {
  const dataMsg = addMessage('', 'data')
  streamText(`
+------------------------------------------+
|                                          |
|           DECC0 SOUL INTERFACE           |
|                                          |
|       10,000 Unique AI Personalities     |
|                                          |
+------------------------------------------+
|                                          |
|  Press Ctrl+Space for command palette    |
|  Press Ctrl+L to load a random soul      |
|  Press ? for help                        |
|                                          |
|  Type a message after loading a soul     |
|  to start chatting.                      |
|                                          |
+------------------------------------------+`, dataMsg.id)
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  showWelcome()
  inputRef.value?.focus()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="app-container">
    <!-- Status Bar -->
    <header class="status-bar">
      <div class="status-left">
        <span class="logo">[DECC0]</span>
        <span class="separator">|</span>
        <span v-if="currentSoul" class="soul-info">
          {{ currentSoul.emoji }} {{ currentSoul.name }} <span class="dim">#{{ currentSoul.id }}</span>
        </span>
        <span v-else class="dim">No soul loaded</span>
      </div>
      <div class="status-right">
        <span class="hint">Ctrl+Space: Commands</span>
        <span class="separator">|</span>
        <span class="hint">?: Help</span>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content" ref="messagesContainer">
      <div class="messages">
        <div 
          v-for="msg in messages" 
          :key="msg.id"
          class="message"
          :class="[`message-${msg.type}`, { 'streaming': isStreaming && msg === messages[messages.length - 1] }]"
        >
          <!-- User Message -->
          <template v-if="msg.type === 'user'">
            <div class="message-prefix user-prefix">&gt;</div>
            <div class="message-content">{{ msg.content }}</div>
          </template>

          <!-- Assistant Message -->
          <template v-else-if="msg.type === 'assistant'">
            <div class="message-prefix assistant-prefix">
              {{ msg.meta?.emoji || '>' }}
            </div>
            <div class="message-content assistant-content">
              <span class="assistant-name" v-if="msg.meta?.name">{{ msg.meta.name }}:</span>
              {{ msg.content }}
            </div>
          </template>

          <!-- System Message -->
          <template v-else-if="msg.type === 'system'">
            <div class="message-prefix system-prefix">*</div>
            <div class="message-content system-content">{{ msg.content }}</div>
          </template>

          <!-- Data Message (ASCII art, tables, etc) -->
          <template v-else-if="msg.type === 'data'">
            <pre class="data-content">{{ msg.content }}<span v-if="isStreaming && msg === messages[messages.length - 1]" class="cursor">_</span></pre>
          </template>

          <div class="message-time">{{ msg.timestamp }}</div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading && !isStreaming" class="message message-system">
          <div class="message-prefix system-prefix">*</div>
          <div class="message-content system-content loading-dots">
            Thinking<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Input Area -->
    <footer class="input-area">
      <div class="input-row">
        <span class="input-prefix">&gt;</span>
        <input
          ref="inputRef"
          v-model="inputMessage"
          @keydown="handleInputKeydown"
          type="text"
          class="message-input"
          placeholder="Type a message... (Tab for prompts, Enter to send)"
          :disabled="isLoading"
          autocomplete="off"
          spellcheck="false"
        />
      </div>
      <div class="input-hints">
        <span v-for="prompt in prompts.slice(0, 3)" :key="prompt.id" class="prompt-hint">
          Tab: {{ prompt.label }}
        </span>
      </div>
    </footer>

    <!-- Command Palette -->
    <Teleport to="body">
      <div v-if="showCommandPalette" class="palette-overlay" @click.self="showCommandPalette = false">
        <div class="command-palette">
          <div class="palette-header">
            <span class="palette-title">COMMANDS</span>
            <span class="palette-hint">ESC to close</span>
          </div>
          <input
            ref="commandInputRef"
            v-model="commandSearch"
            @keydown="handlePaletteKeydown"
            type="text"
            class="palette-search"
            placeholder="Search commands..."
            autocomplete="off"
          />
          <div class="palette-commands">
            <div
              v-for="(cmd, index) in filteredCommands"
              :key="cmd.id"
              class="palette-command"
              :class="{ 'selected': index === selectedCommandIndex }"
              @click="executeCommand(cmd)"
              @mouseenter="selectedCommandIndex = index"
            >
              <span class="cmd-icon">[{{ cmd.icon }}]</span>
              <span class="cmd-label">{{ cmd.label }}</span>
              <span class="cmd-shortcut">{{ cmd.shortcut }}</span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Container */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-darker);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

/* Status Bar */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--bg-dark);
  border-bottom: 1px solid var(--border);
  font-size: 0.85rem;
}

.status-left, .status-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  color: var(--accent);
  font-weight: bold;
}

.separator {
  color: var(--border);
}

.soul-info {
  color: var(--text-primary);
}

.dim {
  color: var(--text-dim);
}

.hint {
  color: var(--text-dim);
  font-size: 0.75rem;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 900px;
  margin: 0 auto;
}

/* Messages */
.message {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  animation: fadeIn 0.2s ease-out;
}

.message-prefix {
  flex-shrink: 0;
  width: 1.5rem;
  text-align: center;
  font-weight: bold;
}

.user-prefix {
  color: var(--accent);
}

.assistant-prefix {
  color: var(--secondary);
}

.system-prefix {
  color: var(--text-dim);
}

.message-content {
  flex: 1;
  word-wrap: break-word;
}

.assistant-content {
  color: var(--text-primary);
}

.assistant-name {
  color: var(--secondary);
  font-weight: bold;
  margin-right: 0.5rem;
}

.system-content {
  color: var(--text-dim);
  font-style: italic;
}

.message-time {
  font-size: 0.7rem;
  color: var(--text-dim);
  margin-left: auto;
  flex-shrink: 0;
}

/* Data content (ASCII art) */
.data-content {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.3;
  color: var(--accent);
  background: var(--bg-surface);
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  overflow-x: auto;
  margin: 0;
  white-space: pre;
}

.cursor {
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Loading dots */
.loading-dots .dot {
  animation: loadingDot 1.4s infinite;
}

.loading-dots .dot:nth-child(1) { animation-delay: 0s; }
.loading-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes loadingDot {
  0%, 20% { opacity: 0.2; }
  50% { opacity: 1; }
  80%, 100% { opacity: 0.2; }
}

/* Input Area */
.input-area {
  padding: 0.75rem 1rem;
  background: var(--bg-dark);
  border-top: 1px solid var(--border);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.input-prefix {
  color: var(--accent);
  font-weight: bold;
  font-size: 1.1rem;
}

.message-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 1rem;
  outline: none;
  caret-color: var(--accent);
}

.message-input::placeholder {
  color: var(--text-dim);
}

.message-input:disabled {
  opacity: 0.5;
}

.input-hints {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
  padding-left: 1.5rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.prompt-hint {
  font-size: 0.7rem;
  color: var(--text-dim);
}

/* Command Palette */
.palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 1000;
  animation: fadeIn 0.15s ease-out;
}

.command-palette {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.palette-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
}

.palette-title {
  color: var(--accent);
  font-weight: bold;
  font-size: 0.85rem;
}

.palette-hint {
  color: var(--text-dim);
  font-size: 0.75rem;
}

.palette-search {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-surface);
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 1rem;
  outline: none;
}

.palette-search::placeholder {
  color: var(--text-dim);
}

.palette-commands {
  max-height: 300px;
  overflow-y: auto;
}

.palette-command {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.1s;
}

.palette-command:hover,
.palette-command.selected {
  background: var(--bg-surface);
}

.cmd-icon {
  color: var(--text-dim);
  font-size: 0.85rem;
  width: 2rem;
}

.cmd-label {
  flex: 1;
  color: var(--text-primary);
}

.cmd-shortcut {
  color: var(--text-dim);
  font-size: 0.75rem;
  background: var(--bg-darker);
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scrollbar */
.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: var(--bg-darker);
}

.main-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-dim);
}
</style>
