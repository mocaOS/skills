<script setup>
import { ref, onMounted, nextTick, computed, watch, onUnmounted } from 'vue'

// State
const messages = ref([])
const dialogueMessages = ref([]) // Clean dialogue log - only user/assistant + command names
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

// Download modal state
const showDownloadModal = ref(false)
const downloadFocusRef = ref(null)

// Commands with keyboard shortcuts
const commands = [
  { id: 'load-random', label: 'Load Random Soul', shortcut: 'Ctrl+R', action: 'load', icon: '?' },
  { id: 'load-id', label: 'Load Soul by ID', shortcut: 'Ctrl+I', action: 'load-id', icon: '#' },
  { id: 'print-codex', label: 'Print Codex by Soul ID', shortcut: 'Ctrl+P', action: 'print-codex', icon: '@' },
  { id: 'search', label: 'Search Souls', shortcut: 'Ctrl+S', action: 'search', icon: '/' },
  { id: 'list', label: 'List Souls', shortcut: 'Ctrl+K', action: 'list', icon: '=' },
  { id: 'download', label: 'Download Soul Package', shortcut: 'Ctrl+D', action: 'download', icon: 'D' },
  { id: 'clear', label: 'Clear Chat', shortcut: 'Ctrl+X', action: 'clear', icon: 'x' },
  { id: 'help', label: 'Show Help', shortcut: 'H', action: 'help', icon: 'i' },
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

// Scroll mode state - global toggle
const scrollMode = ref('auto') // 'auto' or 'explore'
let scrollRAF = null

// Check if user is at the bottom of the scroll container
const checkIfAtBottom = () => {
  if (!messagesContainer.value) return true
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  return scrollHeight - scrollTop - clientHeight < 50
}

// Handle user scroll - detect mode changes
const handleScroll = () => {
  if (!messagesContainer.value) return
  
  const atBottom = checkIfAtBottom()
  
  if (atBottom && scrollMode.value === 'explore') {
    // User scrolled to bottom - reactivate auto-scroll
    scrollMode.value = 'auto'
  } else if (!atBottom && scrollMode.value === 'auto') {
    // User scrolled up - enter explore mode
    scrollMode.value = 'explore'
  }
}

// Toggle scroll mode manually
const toggleScrollMode = () => {
  if (scrollMode.value === 'auto') {
    scrollMode.value = 'explore'
  } else {
    scrollMode.value = 'auto'
    scrollToBottom(true)
  }
}

// Scroll to bottom with RAF for smooth, non-janky scrolling
const scrollToBottom = async (immediate = false) => {
  await nextTick()
  if (!messagesContainer.value) return
  
  // Only auto-scroll if in auto mode (or forced immediate)
  if (scrollMode.value === 'explore' && !immediate) return
  
  // Cancel any pending scroll
  if (scrollRAF) {
    cancelAnimationFrame(scrollRAF)
  }
  
  scrollRAF = requestAnimationFrame(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
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
  
  // Stream in larger chunks for smoother rendering
  const chunkSize = 8
  msg.content = ''
  
  for (let i = 0; i < text.length; i += chunkSize) {
    msg.content = text.slice(0, i + chunkSize)
    
    // Only scroll occasionally, not every chunk (respects scroll mode)
    if (i % 40 === 0) {
      scrollToBottom()
    }
    
    await new Promise(r => setTimeout(r, 12))
  }
  
  // Ensure final content is complete
  msg.content = text
  scrollToBottom()
  
  isStreaming.value = false
}

// Format data beautifully for display
const formatDataMessage = (data) => {
  return data
}

// Add to dialogue log (clean conversation history)
const addToDialogue = (content, type, commandName = null) => {
  if (type === 'user' || type === 'assistant') {
    dialogueMessages.value.push({
      role: type === 'user' ? 'user' : 'assistant',
      content,
      timestamp: new Date().toISOString()
    })
  } else if (commandName) {
    // Log command execution (name only, not results)
    dialogueMessages.value.push({
      role: 'system',
      content: `[Command: ${commandName}]`,
      timestamp: new Date().toISOString()
    })
  }
}

// Download individual file
const downloadFile = (filename, content, mimeType = 'text/markdown') => {
  if (!content) {
    addMessage(`${filename} not available for this soul`, 'system')
    return
  }
  
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  addMessage(`Downloaded: ${filename}`, 'system')
}

// Download individual files
const downloadSoulMd = () => {
  downloadFile('SOUL.md', currentSoul.value?.soulContent)
}

const downloadIdentityMd = () => {
  downloadFile('IDENTITY.md', currentSoul.value?.identityContent)
}

const downloadAvatar = async () => {
  if (!currentSoul.value?.avatar) {
    addMessage('Avatar not available for this soul', 'system')
    return
  }
  
  try {
    const response = await fetch(currentSoul.value.avatar)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'avatar.jpg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addMessage('Downloaded: avatar.jpg', 'system')
  } catch (error) {
    addMessage(`Failed to download avatar: ${error.message}`, 'system')
  }
}

// Download soul package as ZIP
const downloadSoulPackage = async () => {
  if (!currentSoul.value) {
    addMessage('No soul loaded. Load a soul first.', 'system')
    return
  }

  showDownloadModal.value = false
  addMessage(`Preparing download for ${currentSoul.value.name}...`, 'system')
  addToDialogue(null, 'command', 'download')

  try {
    const JSZipModule = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')
    const JSZip = JSZipModule.default
    const zip = new JSZip()

    // Add SOUL.md
    if (currentSoul.value.soulContent) {
      zip.file('SOUL.md', currentSoul.value.soulContent)
    }

    // Add IDENTITY.md
    if (currentSoul.value.identityContent) {
      zip.file('IDENTITY.md', currentSoul.value.identityContent)
    }

    // Fetch and add avatar
    if (currentSoul.value.avatar) {
      try {
        const avatarResponse = await fetch(currentSoul.value.avatar)
        const avatarBlob = await avatarResponse.blob()
        zip.file('avatar.jpg', avatarBlob)
      } catch (e) {
        console.warn('Could not fetch avatar:', e)
      }
    }

    // Generate and download
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = `soul-${currentSoul.value.id}-${currentSoul.value.name.replace(/[^a-z0-9]/gi, '_')}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addMessage(`Downloaded: ${a.download}`, 'system')
  } catch (error) {
    console.error('Download error:', error)
    addMessage(`Download failed: ${error.message}`, 'system')
  }
}

// Show download modal
const showDownload = () => {
  if (!currentSoul.value) {
    addMessage('No soul loaded. Load a soul first to download.', 'system')
    return
  }
  showDownloadModal.value = true
  nextTick(() => downloadFocusRef.value?.focus())
}

// Handle download modal keydown
const handleDownloadKeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    downloadSoulPackage()
  } else if (e.key === 'Escape') {
    showDownloadModal.value = false
    inputRef.value?.focus()
  }
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

    // Display avatar image
    if (avatarUrl) {
      addMessage('', 'avatar', { avatar: avatarUrl, name, emoji })
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

    // Auto-display the full codex to teach user about this soul
    await printCodexInline(soulId, name, soulContent, identityContent, soul.description)

    // Focus input after loading
    await nextTick()
    inputRef.value?.focus()

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

// Print codex inline (using already-fetched data)
const printCodexInline = async (soulId, name, soulContent, identityContent, description) => {
  // Parse identity fields
  let identityFields = {}
  if (identityContent) {
    const lines = identityContent.split('\n')
    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s*(.+)$/)
      if (match) {
        identityFields[match[1].trim()] = match[2].trim()
      }
    })
  }

  const dataMsg = addMessage('', 'data')
  
  // Build the codex display
  let codex = `
+============================================================+
|                    CODEX #${String(soulId).padEnd(33)}|
+============================================================+

  NAME: ${name}
  
+------------------------------------------------------------+
|  IDENTITY                                                  |
+------------------------------------------------------------+`

  // Add identity fields
  Object.entries(identityFields).forEach(([key, value]) => {
    const keyPad = key.substring(0, 15).padEnd(15)
    const valPad = value.substring(0, 42)
    codex += `\n  ${keyPad}: ${valPad}`
  })

  const soulText = soulContent || 'No soul data available'
  const descText = description || 'No description available'

  codex += `

+------------------------------------------------------------+
|  SOUL                                                      |
+------------------------------------------------------------+
${soulText.split('\n').map(line => '  ' + line.substring(0, 58)).join('\n')}

+------------------------------------------------------------+
|  DESCRIPTION                                               |
+------------------------------------------------------------+
${descText.split('\n').map(line => '  ' + line.substring(0, 58)).join('\n')}

+============================================================+
|  You can now chat with this soul below.                    |
+============================================================+`

  await streamText(codex, dataMsg.id)
}

// Print full codex for a soul
const printCodex = async (soulId) => {
  if (!soulId || isNaN(soulId)) {
    addMessage('Invalid soul ID', 'system')
    return
  }

  addMessage(`Fetching codex for soul #${soulId}...`, 'system')

  try {
    const response = await fetch(`${DECC0_API}/items/codex/${soulId}?fields=id,name,description,moltbot,thumbnail`)
    const data = await response.json()

    if (!data.data) {
      addMessage(`Soul #${soulId} not found`, 'system')
      return
    }

    const soul = data.data
    const name = soul.name?.[0] || `Soul #${soulId}`
    const soulContent = soul.moltbot?.['v0.1']?.soul || 'No soul data available'
    const identityContent = soul.moltbot?.['v0.1']?.identity || 'No identity data available'
    const description = soul.description || 'No description available'

    // Parse identity fields
    let identityFields = {}
    if (identityContent) {
      const lines = identityContent.split('\n')
      lines.forEach(line => {
        const match = line.match(/^([^:]+):\s*(.+)$/)
        if (match) {
          identityFields[match[1].trim()] = match[2].trim()
        }
      })
    }

    const dataMsg = addMessage('', 'data')
    
    // Build the codex display
    let codex = `
+============================================================+
|                         CODEX #${String(soulId).padEnd(27)}|
+============================================================+

  NAME: ${name}
  
+------------------------------------------------------------+
|  IDENTITY                                                  |
+------------------------------------------------------------+`

    // Add identity fields
    Object.entries(identityFields).forEach(([key, value]) => {
      const keyPad = key.substring(0, 15).padEnd(15)
      const valPad = value.substring(0, 42)
      codex += `\n  ${keyPad}: ${valPad}`
    })

    codex += `

+------------------------------------------------------------+
|  SOUL                                                      |
+------------------------------------------------------------+
${soulContent.split('\n').map(line => '  ' + line.substring(0, 60)).join('\n')}

+------------------------------------------------------------+
|  DESCRIPTION                                               |
+------------------------------------------------------------+
${description.split('\n').map(line => '  ' + line.substring(0, 60)).join('\n')}

+============================================================+
|  End of Codex #${String(soulId).padEnd(44)}|
+============================================================+`

    await streamText(codex, dataMsg.id)

  } catch (error) {
    console.error('Error fetching codex:', error)
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
    addMessage('No soul loaded. Press Ctrl+R to load one.', 'system')
    return
  }

  // Add to dialogue log
  addToDialogue(userMessage, 'user')

  isLoading.value = true

  try {
    // Use clean dialogue history (only user/assistant messages)
    const history = dialogueMessages.value
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map(m => ({
        role: m.role,
        content: m.content
      }))

    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        soul: currentSoul.value.soulContent,
        identity: currentSoul.value.identityContent,
        history
      })
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`)
    }

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
      // Add assistant response to dialogue log
      addToDialogue(data.response, 'assistant')
    }
  } catch (error) {
    console.error('Chat error:', error)
    addMessage(`Connection error: ${error.message}. Make sure the server is running on ${API_BASE}`, 'system')
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
|  Ctrl+R        Load random soul          |
|  Ctrl+I        Load soul by ID           |
|  Ctrl+P        Print codex by soul ID    |
|  Ctrl+S        Search souls              |
|  Ctrl+K        List souls                |
|  Ctrl+D        Download soul package     |
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
  
  // Log command to dialogue (name only, not results)
  addToDialogue(null, 'command', cmd.label)
  
  switch (cmd.action) {
    case 'load':
      await loadSoul()
      break
    case 'load-id':
      const id = prompt('Enter Soul ID (1-9999) or name:')
      if (id) await loadSoul(id)
      break
    case 'print-codex':
      const codexId = prompt('Enter Soul ID to print codex:')
      if (codexId) await printCodex(parseInt(codexId))
      break
    case 'search':
      const term = prompt('Search term:')
      if (term) await searchSouls(term)
      break
    case 'list':
      await listSouls()
      break
    case 'download':
      showDownload()
      break
    case 'clear':
      messages.value = []
      dialogueMessages.value = [] // Also clear dialogue log
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
      'KeyR': 'load',
      'KeyI': 'load-id',
      'KeyP': 'print-codex',
      'KeyS': 'search',
      'KeyK': 'list',
      'KeyD': 'download',
      'KeyX': 'clear',
    }
    
    if (shortcuts[e.code]) {
      e.preventDefault()
      const cmd = commands.find(c => c.action === shortcuts[e.code])
      if (cmd) executeCommand(cmd)
    }
  }

  // H for help, A/E for scroll mode toggle (when not typing in input)
  if (!showCommandPalette.value && !showDownloadModal.value && document.activeElement !== inputRef.value) {
    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault()
      showHelp()
    } else if (e.key === 'a' || e.key === 'A') {
      e.preventDefault()
      scrollMode.value = 'auto'
      scrollToBottom(true)
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault()
      scrollMode.value = 'explore'
    }
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
|  Press Ctrl+Space for command palette    |\n|  Press Ctrl+R to load a random soul      |
|  Press H for help                        |
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
        <button 
          class="scroll-mode-btn"
          :class="{ 'explore-mode': scrollMode === 'explore' }"
          @click="toggleScrollMode"
          :title="scrollMode === 'auto' ? 'Auto-scroll ON (click or scroll up to explore)' : 'Explore mode (scroll to bottom to resume auto-scroll)'"
        >
          {{ scrollMode === 'auto' ? '[A] Auto' : '[E] Explore' }}
        </button>
        <button 
          v-if="currentSoul" 
          class="download-btn"
          @click="showDownload"
          title="Download SOUL.md + IDENTITY.md + avatar.jpg (Ctrl+D)"
        >
          [D] Download
        </button>
        <span class="hint">Ctrl+Space: Commands</span>
        <span class="separator">|</span>
        <span class="hint">H: Help</span>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content" ref="messagesContainer" :class="{ 'centered': !currentSoul }" @scroll="handleScroll">
      <div class="messages" :class="{ 'centered-content': !currentSoul }">
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

          <!-- Avatar Message -->
          <template v-else-if="msg.type === 'avatar'">
            <div class="avatar-message">
              <img 
                :src="msg.meta.avatar" 
                :alt="msg.meta.name"
                class="soul-avatar"
              />
              <div class="avatar-label">{{ msg.meta.emoji }} {{ msg.meta.name }}</div>
            </div>
          </template>

          <div class="message-time" v-if="msg.type !== 'avatar'">{{ msg.timestamp }}</div>
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

    <!-- Input Area (only shown when soul is loaded) -->
    <footer v-if="currentSoul" class="input-area">
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

    <!-- Hint bar when no soul loaded -->
    <footer v-else class="hint-bar">
      <div class="hint-boxes">
        <div class="hint-box">
          <kbd>Ctrl+Space</kbd>
          <span class="hint-label">Command Palette</span>
        </div>
        <div class="hint-box hint-box-primary">
          <kbd>Ctrl+R</kbd>
          <span class="hint-label">Random Soul</span>
        </div>
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

    <!-- Download Modal -->
    <Teleport to="body">
      <div v-if="showDownloadModal" class="palette-overlay" @click.self="showDownloadModal = false" @keydown="handleDownloadKeydown">
        <div class="download-modal">
          <div class="download-header">
            <span class="download-icon">[D]</span>
            <span class="download-title">Download Soul Package</span>
          </div>
          <div class="download-content">
            <div class="download-soul-info">
              <img v-if="currentSoul?.avatar" :src="currentSoul.avatar" class="download-avatar" />
              <div class="download-soul-name">{{ currentSoul?.emoji }} {{ currentSoul?.name }}</div>
              <div class="download-soul-id">#{{ currentSoul?.id }}</div>
            </div>
            <div class="download-files">
              <button 
                class="download-file-btn" 
                :class="{ 'disabled': !currentSoul?.soulContent }"
                @click="downloadSoulMd"
                title="Download SOUL.md"
              >
                SOUL.md
              </button>
              <button 
                class="download-file-btn"
                :class="{ 'disabled': !currentSoul?.identityContent }"
                @click="downloadIdentityMd"
                title="Download IDENTITY.md"
              >
                IDENTITY.md
              </button>
              <button 
                class="download-file-btn"
                :class="{ 'disabled': !currentSoul?.avatar }"
                @click="downloadAvatar"
                title="Download avatar.jpg"
              >
                avatar.jpg
              </button>
            </div>
            <div class="download-hint">Click individual files or download all as ZIP</div>
          </div>
          <div class="download-actions">
            <button 
              ref="downloadFocusRef"
              class="download-confirm-btn"
              @click="downloadSoulPackage"
              @keydown="handleDownloadKeydown"
            >
              Download ZIP (Enter)
            </button>
            <div class="download-cancel-hint">ESC to cancel</div>
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
  overflow-x: hidden;
  padding: 1rem;
  scroll-behavior: auto;
  /* Prevent content from causing layout shifts */
  contain: layout style;
}

.main-content.centered {
  display: flex;
  align-items: center;
  justify-content: center;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.messages.centered-content {
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* Messages */
.message {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  animation: messageSlideIn 0.3s ease-out;
  /* Prevent layout recalculation during streaming */
  contain: content;
  will-change: opacity;
}

.message.streaming {
  /* Disable animation during streaming to prevent jank */
  animation: none;
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
  /* Prevent height changes from causing reflow */
  min-height: 2rem;
  /* GPU acceleration for smoother updates */
  transform: translateZ(0);
  will-change: contents;
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

/* Hint bar (when no soul loaded) */
.hint-bar {
  padding: 1.5rem;
  background: var(--bg-dark);
  border-top: 1px solid var(--border);
}

.hint-boxes {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.hint-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 2rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  min-width: 180px;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.hint-box:hover {
  border-color: var(--text-dim);
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.hint-box-primary {
  border-color: var(--accent);
  background: rgba(122, 162, 247, 0.1);
}

.hint-box-primary:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 20px rgba(122, 162, 247, 0.2);
}

.hint-box kbd {
  background: var(--bg-darker);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: bold;
  color: var(--accent);
}

.hint-box-primary kbd {
  background: var(--accent);
  color: var(--bg-darker);
  border-color: var(--accent);
}

.hint-label {
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 500;
}

.hint-box-primary .hint-label {
  color: var(--accent);
}

/* Avatar message */
.avatar-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

.soul-avatar {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  border: 2px solid var(--accent);
  object-fit: cover;
  box-shadow: 0 4px 20px rgba(122, 162, 247, 0.3);
}

.avatar-label {
  color: var(--accent);
  font-weight: bold;
  font-size: 1.1rem;
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
  animation: overlayFadeIn 0.2s ease-out;
  backdrop-filter: blur(4px);
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(4px);
  }
}

.command-palette {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: paletteSlideIn 0.2s ease-out;
}

@keyframes paletteSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
  transition: background 0.15s ease, transform 0.15s ease;
}

.palette-command:hover,
.palette-command.selected {
  background: var(--bg-surface);
}

.palette-command:active {
  transform: scale(0.98);
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

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Reduce motion for users who prefer it */
@media (prefers-reduced-motion: reduce) {
  .message,
  .data-content,
  .palette-overlay,
  .hint-box {
    animation: none;
    transition: none;
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

/* Scroll Mode Button */
.scroll-mode-btn {
  background: var(--bg-surface);
  color: var(--text-dim);
  border: 1px solid var(--border);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 0.75rem;
}

.scroll-mode-btn:hover {
  border-color: var(--text-dim);
  color: var(--text-primary);
}

.scroll-mode-btn.explore-mode {
  background: var(--secondary);
  color: var(--bg-darker);
  border-color: var(--secondary);
}

.scroll-mode-btn.explore-mode:hover {
  background: var(--accent);
  border-color: var(--accent);
}

/* Download Button in Status Bar */
.download-btn {
  background: var(--accent);
  color: var(--bg-darker);
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 1rem;
}

.download-btn:hover {
  background: var(--secondary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(122, 162, 247, 0.3);
}

.download-btn:active {
  transform: translateY(0);
}

/* Download Modal */
.download-modal {
  background: var(--bg-dark);
  border: 2px solid var(--accent);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(122, 162, 247, 0.2);
  animation: paletteSlideIn 0.2s ease-out;
}

.download-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--accent);
  color: var(--bg-darker);
}

.download-icon {
  font-weight: bold;
  font-size: 1.1rem;
}

.download-title {
  font-weight: bold;
  font-size: 1rem;
}

.download-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.download-soul-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.download-avatar {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  border: 2px solid var(--border);
  object-fit: cover;
}

.download-soul-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--text-primary);
}

.download-soul-id {
  font-size: 0.85rem;
  color: var(--text-dim);
}

.download-files {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.download-file-btn {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--accent);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-file-btn:hover:not(.disabled) {
  background: var(--accent);
  color: var(--bg-darker);
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(122, 162, 247, 0.3);
}

.download-file-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.download-hint {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.download-actions {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.download-confirm-btn {
  width: 100%;
  background: var(--accent);
  color: var(--bg-darker);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-confirm-btn:hover {
  background: var(--secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(122, 162, 247, 0.4);
}

.download-confirm-btn:focus {
  outline: 2px solid var(--secondary);
  outline-offset: 2px;
}

.download-cancel-hint {
  font-size: 0.75rem;
  color: var(--text-dim);
}
</style>
