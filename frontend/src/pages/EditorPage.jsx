import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEditor } from '../context/EditorContext'
import { roomAPI, editorAPI, fileAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import MonacoEditor from '../components/editor/MonacoEditor'
import CursorMarker from '../components/editor/CursorMarker'
import ParticipantList from '../components/editor/ParticipantList'
import VSCodeMenuBar from '../components/editor/VSCodeMenuBar'
import FileTreeExplorer from '../components/editor/FileTreeExplorer'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'
import {
  FiCopy,
  FiCheck,
  FiLogOut,
  FiWifi,
  FiWifiOff,
  FiChevronDown,
  FiSave,
  FiRefreshCw,
  FiUsers,
  FiSidebar,
  FiInfo,
  FiCode,
  FiMaximize,
  FiMinimize,
  FiFileText,
  FiFolder,
  FiSettings,
  FiActivity,
  FiLock,
  FiUnlock,
  FiTerminal,
  FiZap,
  FiX,
  FiPlay,
} from 'react-icons/fi'

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'c', label: 'C', ext: 'c' },
  { id: 'csharp', label: 'C#', ext: 'cs' },
  { id: 'go', label: 'Go', ext: 'go' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
  { id: 'html', label: 'HTML/CSS', ext: 'html' },
  { id: 'sql', label: 'SQL', ext: 'sql' },
  { id: 'json', label: 'JSON', ext: 'json' },
  { id: 'markdown', label: 'Markdown', ext: 'md' },
]

export default function EditorPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    content,
    language,
    version,
    participants,
    cursors,
    roomInfo,
    updateContent,
    setLanguage,
    setRoomInfo,
    setVersion,
    setParticipants,
  } = useEditor()

  // Multi-file & folder workspace state
  const [files, setFiles] = useState([])
  const [openTabs, setOpenTabs] = useState([])
  const [activeFileId, setActiveFileId] = useState(null)
  const fileBuffers = useRef({})

  const fetchFiles = useCallback(async () => {
    if (!roomId) return
    try {
      const res = await fileAPI.getFiles(roomId)
      const list = res.data || []
      setFiles(list)

      const regularFiles = list.filter((f) => !f.isFolder)
      if (regularFiles.length > 0) {
        setOpenTabs((prev) => {
          if (prev.length === 0) return [regularFiles[0]]
          return prev.map((t) => list.find((f) => f.id === t.id) || t)
        })

        setActiveFileId((currentId) => {
          if (!currentId || !regularFiles.some((f) => f.id === currentId)) {
            const initial = regularFiles[0]
            updateContent(initial.content || '')
            fileBuffers.current[initial.id] = initial.content || ''
            if (initial.language) setLanguage(initial.language.toLowerCase())
            return initial.id
          }
          return currentId
        })
      }
    } catch (err) {
      console.warn('Failed to load workspace files:', err)
    }
  }, [roomId, updateContent, setLanguage])

  const { connected, reconnecting, sendOperation, sendCursor, resync } = useWebSocket(roomId, {
    onFiles: () => {
      fetchFiles()
    },
  })

  // Editor configuration state
  const [fontSize, setFontSize] = useState(14)
  const [theme, setTheme] = useState('vs-dark') // 'vs-dark' | 'vs' | 'hc-black'
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [editorMounted, setEditorMounted] = useState(false)

  // Panel toggles & active tabs
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [leftTab, setLeftTab] = useState('files') // 'files' | 'participants'
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [rightTab, setRightTab] = useState('info') // 'info' | 'activity'

  // Modals & UI feedback
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [activityEvents, setActivityEvents] = useState([
    { id: 1, text: 'Connected to collaborative room channel', time: 'Just now' },
  ])

  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  // 1. Determine current user's role in this room
  const currentUserRole = useMemo(() => {
    if (!user?.id) return 'VIEWER'
    const fromParticipants = participants?.find((p) => p.userId === user.id)?.role
    if (fromParticipants) return fromParticipants
    const fromMembers = roomInfo?.members?.find((m) => m.userId === user.id)?.role
    if (fromMembers) return fromMembers
    return 'EDITOR'
  }, [user?.id, participants, roomInfo?.members])

  const isViewer = currentUserRole === 'VIEWER'

  // Current active file & fallback file name
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || openTabs.find((t) => t.id === activeFileId)
  }, [files, openTabs, activeFileId])

  const currentLangObj = LANGUAGES.find((l) => l.id === language.toLowerCase()) || LANGUAGES[0]
  const currentFileName = activeFile?.name || `main.${currentLangObj.ext}`

  // Switch active file tab
  const switchActiveFile = useCallback(
    (file) => {
      if (file.isFolder) return

      if (activeFileId) {
        fileBuffers.current[activeFileId] = content
      }

      setOpenTabs((prev) => {
        if (prev.some((t) => t.id === file.id)) return prev
        return [...prev, file]
      })

      setActiveFileId(file.id)

      const nextContent =
        fileBuffers.current[file.id] != null ? fileBuffers.current[file.id] : file.content || ''
      updateContent(nextContent)
      fileBuffers.current[file.id] = nextContent

      if (file.language) {
        setLanguage(file.language.toLowerCase())
      } else {
        const ext = file.name.split('.').pop()
        const matched = LANGUAGES.find((l) => l.ext === ext)
        if (matched) setLanguage(matched.id)
      }
      setDirty(false)
    },
    [activeFileId, content, updateContent, setLanguage]
  )

  const handleCloseTab = useCallback(
    (tabId, e) => {
      if (e) e.stopPropagation()
      setOpenTabs((prev) => {
        const nextTabs = prev.filter((t) => t.id !== tabId)
        if (activeFileId === tabId && nextTabs.length > 0) {
          const nextActive = nextTabs[nextTabs.length - 1]
          setTimeout(() => switchActiveFile(nextActive), 0)
        }
        return nextTabs
      })
    },
    [activeFileId, switchActiveFile]
  )

  const handleCreateFile = useCallback(
    async ({ name, path, isFolder }) => {
      try {
        const res = await fileAPI.createFile(roomId, { name, path, isFolder })
        toast.success(`${isFolder ? 'Folder' : 'File'} "${name}" created!`)
        await fetchFiles()
        if (!isFolder) {
          switchActiveFile(res.data)
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to create file')
      }
    },
    [roomId, fetchFiles, switchActiveFile]
  )

  const handleDeleteFile = useCallback(
    async (fileId) => {
      try {
        await fileAPI.deleteFile(roomId, fileId)
        toast.success('File removed')
        setOpenTabs((prev) => prev.filter((t) => t.id !== fileId))
        await fetchFiles()
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to delete file')
      }
    },
    [roomId, fetchFiles]
  )

  const handleDownloadFile = useCallback(() => {
    const filename = activeFile?.name || currentFileName
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}`)
  }, [activeFile, currentFileName, content])

  const handleDownloadZip = useCallback(() => {
    const jsonBundle = JSON.stringify(
      files
        .filter((f) => !f.isFolder)
        .map((f) => ({
          path: f.path,
          content: fileBuffers.current[f.id] != null ? fileBuffers.current[f.id] : f.content,
        })),
      null,
      2
    )
    const blob = new Blob([jsonBundle], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${roomInfo?.name || 'codesync-workspace'}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Project workspace exported!')
  }, [files, roomInfo?.name])

  // 2. Load room metadata & initial document content on mount
  useEffect(() => {
    if (!roomId) return

    fetchFiles()

    roomAPI
      .getRoom(roomId)
      .then((res) => {
        setRoomInfo(res.data)
        if (res.data.language) {
          setLanguage(res.data.language.toLowerCase())
        }
        if (res.data.members && res.data.members.length > 0) {
          setParticipants(res.data.members)
        }
      })
      .catch((err) => {
        toast.error('Failed to load room details')
        console.error(err)
      })

    editorAPI
      .getContent(roomId)
      .then((res) => {
        if (res.data?.content != null && !activeFileId) {
          updateContent(res.data.content)
        }
        if (res.data?.version != null) {
          setVersion(res.data.version)
        }
      })
      .catch((err) => {
        console.warn('Initial document fetch fallback:', err)
      })
  }, [roomId, setRoomInfo, setLanguage, updateContent, setVersion, setParticipants, fetchFiles, activeFileId])

  // 3. Handle editor changes → broadcast STOMP operation
  const handleEditorChange = useCallback(
    (value) => {
      if (isViewer) {
        toast.error('You are in read-only mode (VIEWER role).', { id: 'viewer-edit' })
        return
      }
      if (value === content) return
      setDirty(true)
      updateContent(value)
      if (activeFileId) {
        fileBuffers.current[activeFileId] = value
      }
      sendOperation({
        content: value,
        revision: version,
        fileId: activeFileId,
      })
    },
    [content, version, updateContent, sendOperation, isViewer, activeFileId]
  )

  // 4. Handle cursor movement
  const handleCursorChange = useCallback(
    (position) => {
      setCursorPos({ line: position.lineNumber, column: position.column })
      sendCursor({ line: position.lineNumber, column: position.column })
    },
    [sendCursor]
  )

  // 5. Save document to persistent backend
  const handleSave = useCallback(async () => {
    if (isViewer) return
    setSaving(true)
    try {
      await editorAPI.saveContent(roomId, {
        content,
        language: language.toUpperCase(),
        version,
        userId: user?.id,
      })
      if (activeFileId) {
        await fileAPI.updateFile(roomId, activeFileId, {
          content,
          language: language.toUpperCase(),
        })
        fileBuffers.current[activeFileId] = content
      }
      setDirty(false)
      toast.success(`Saved "${activeFile?.name || currentFileName}"!`)
      setActivityEvents((prev) => [
        {
          id: Date.now(),
          text: `Saved "${activeFile?.name || currentFileName}" (rev #${version})`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 15),
      ])
    } catch (err) {
      toast.error('Failed to save document')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }, [roomId, content, language, version, user?.id, isViewer, activeFileId, activeFile, currentFileName])

  // Keyboard shortcut Ctrl+S / Cmd+S for save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  // 6. Change language and persist to room
  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang)
    try {
      await roomAPI.updateRoom(roomId, { language: newLang.toUpperCase() })
      toast.success(`Language set to ${newLang.toUpperCase()}`)
    } catch {
      // Non-owner might fail server-side, keep local language
    }
  }

  // 7. Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // 8. Copy access code
  const copyAccessCode = useCallback(() => {
    if (!roomInfo?.accessCode) return
    navigator.clipboard.writeText(roomInfo.accessCode)
    setCopiedCode(true)
    toast.success(`Copied access code: ${roomInfo.accessCode}`)
    setTimeout(() => setCopiedCode(false), 2000)
  }, [roomInfo?.accessCode])

  // 9. Leave room
  const handleLeaveConfirm = async () => {
    try {
      await roomAPI.leaveRoom(roomId)
    } catch (_) {}
    navigate('/dashboard')
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-[#0d1117] text-gray-100 overflow-hidden font-sans select-none"
    >
      {/* ─── VS CODE NATIVE MENU BAR ───────────────────────────────── */}
      <VSCodeMenuBar
        roomName={roomInfo?.name || 'Workspace'}
        activeFileName={activeFile?.name || currentFileName}
        onNewFile={() => {
          setLeftTab('files')
          setShowLeftSidebar(true)
          const name = window.prompt('Enter new file name (e.g. utils.js, styles.css):')
          if (name && name.trim()) {
            handleCreateFile({ name: name.trim(), path: name.trim(), isFolder: false })
          }
        }}
        onNewFolder={() => {
          setLeftTab('files')
          setShowLeftSidebar(true)
          const name = window.prompt('Enter new folder name (e.g. components, utils):')
          if (name && name.trim()) {
            handleCreateFile({ name: name.trim(), path: name.trim(), isFolder: true })
          }
        }}
        onSave={handleSave}
        onDownloadFile={handleDownloadFile}
        onDownloadZip={handleDownloadZip}
        onFormatDocument={() => {
          if (editorRef.current) {
            editorRef.current.getAction('editor.action.formatDocument')?.run()
          }
        }}
        onFind={() => {
          if (editorRef.current) {
            editorRef.current.getAction('actions.find')?.run()
          }
        }}
        onToggleLeftSidebar={() => setShowLeftSidebar((p) => !p)}
        onToggleRightSidebar={() => setShowRightSidebar((p) => !p)}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        onRunCode={() => {
          toast.success(`Executed ${activeFile?.name || currentFileName} (Simulated Output in Console)`)
        }}
        isViewer={isViewer}
      />

      {/* ─── TOP IDE TOOLBAR ────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-3 bg-[#161b22] border-b border-[#30363d] flex-shrink-0 z-20">
        {/* Left: Brand, Sidebar Toggles, Room Name & Code */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setShowLeftSidebar((p) => !p)}
            title="Toggle Left Explorer / Participants Panel"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#30363d] transition-colors ${
              showLeftSidebar
                ? 'bg-blue-600/15 border-blue-500/30 text-blue-400'
                : 'bg-[#21262d] text-gray-400 hover:text-white'
            }`}
          >
            <FiSidebar className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-xs">
              <FiCode className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="truncate">{roomInfo?.name || 'Workspace'}</span>
            </span>

            {roomInfo?.isPrivate ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                <FiLock className="h-2.5 w-2.5" />
                Private
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded">
                <FiUnlock className="h-2.5 w-2.5" />
                Public
              </span>
            )}
          </div>

          {roomInfo?.accessCode && (
            <button
              onClick={copyAccessCode}
              title="Click to copy access code"
              className="hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-[#0d1117] border border-[#30363d] rounded-md text-gray-300 hover:border-blue-500 hover:text-white transition-colors font-mono"
            >
              {copiedCode ? (
                <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <FiCopy className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className="font-semibold text-blue-400 tracking-wider">
                {roomInfo.accessCode}
              </span>
            </button>
          )}
        </div>

        {/* Center: Language, Theme, Font Size Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language.toLowerCase()}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-[#0d1117] border border-[#30363d] rounded-md px-2.5 py-1 text-xs font-mono font-medium text-gray-200 pr-7 focus:outline-none focus:border-blue-500 hover:border-gray-500 transition-colors"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
          </div>

          {/* Theme Switcher */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            title="Monaco Theme"
            className="hidden lg:inline-block bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-blue-500 hover:border-gray-500 transition-colors"
          >
            <option value="vs-dark">Dark+</option>
            <option value="vs">Light</option>
            <option value="hc-black">High Contrast</option>
          </select>

          {/* Font Size Adjusters */}
          <div className="hidden sm:flex items-center rounded-md border border-[#30363d] bg-[#0d1117] text-xs">
            <button
              onClick={() => setFontSize((s) => Math.max(10, s - 1))}
              title="Decrease Font Size"
              className="px-2 py-1 text-gray-400 hover:text-white border-r border-[#30363d]"
            >
              A-
            </button>
            <span className="px-2 font-mono text-[11px] text-gray-300">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              title="Increase Font Size"
              className="px-2 py-1 text-gray-400 hover:text-white border-l border-[#30363d]"
            >
              A+
            </button>
          </div>

          {/* Save Button */}
          <Button
            variant={dirty ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={isViewer}
            className="text-xs gap-1.5 h-8"
          >
            <FiSave className="w-3.5 h-3.5" />
            <span>{isViewer ? 'Read Only' : dirty ? 'Save *' : 'Saved'}</span>
          </Button>

          {/* Resync Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resync}
            title="Force synchronization with server"
            className="text-gray-400 hover:text-gray-200 h-8 px-2"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Right: Fullscreen, Info Sidebar Toggle & Leave */}
        <div className="flex items-center gap-2">
          {/* Connection Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0d1117] border border-[#30363d] text-xs">
            {connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium">Connected</span>
              </>
            ) : reconnecting ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
                <span className="text-amber-400 font-medium">Reconnecting...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-red-400 font-medium">Disconnected</span>
              </>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border border-[#30363d] bg-[#21262d] text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <FiMinimize className="h-4 w-4" /> : <FiMaximize className="h-4 w-4" />}
          </button>

          {/* Right Info Panel Toggle */}
          <button
            onClick={() => setShowRightSidebar((p) => !p)}
            title="Toggle Right Workspace Panel"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[#30363d] transition-colors ${
              showRightSidebar
                ? 'bg-blue-600/15 border-blue-500/30 text-blue-400'
                : 'bg-[#21262d] text-gray-400 hover:text-white'
            }`}
          >
            <FiInfo className="h-4 w-4" />
          </button>

          {/* Leave Button */}
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowLeaveConfirm(true)}
            className="gap-1.5 text-xs h-8"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </header>

      {/* ─── READ-ONLY VIEWER BANNER ─────────────────────────────────── */}
      {isViewer && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <FiLock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong>Viewer Mode:</strong> You have read-only access to this collaborative
              workspace. Modifications are disabled.
            </span>
          </div>
          <span className="font-mono text-[11px] opacity-80">READ_ONLY</span>
        </div>
      )}

      {/* ─── MAIN IDE WORKSPACE BODY ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT PANEL: EXPLORER & PARTICIPANTS */}
        {showLeftSidebar && (
          <aside className="w-64 flex-shrink-0 flex flex-col bg-[#161b22] border-r border-[#30363d] overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-[#30363d] bg-[#0d1117]/80 text-xs font-semibold">
              <button
                onClick={() => setLeftTab('files')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors border-b-2 ${
                  leftTab === 'files'
                    ? 'border-blue-500 text-blue-400 bg-[#161b22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FiFolder className="w-3.5 h-3.5" />
                <span>Files</span>
              </button>
              <button
                onClick={() => setLeftTab('participants')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors border-b-2 ${
                  leftTab === 'participants'
                    ? 'border-blue-500 text-blue-400 bg-[#161b22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FiUsers className="w-3.5 h-3.5" />
                <span>Collabs ({participants.length})</span>
              </button>
            </div>

            {/* Tab Body: File Tree */}
            {leftTab === 'files' && (
              <FileTreeExplorer
                files={files}
                activeFileId={activeFileId}
                onSelectFile={switchActiveFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRefresh={fetchFiles}
                isViewer={isViewer}
                roomName={roomInfo?.name || 'Workspace'}
              />
            )}

            {/* Tab Body: Connected Participants */}
            {leftTab === 'participants' && (
              <div className="flex-1 overflow-y-auto">
                <ParticipantList
                  participants={participants}
                  cursors={cursors}
                  currentUserId={user?.id}
                />
              </div>
            )}
          </aside>
        )}

        {/* CENTER: MONACO CODE EDITOR */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#1e1e1e]">
          {/* Editor Multi-File Tab Header */}
          <div className="h-9 flex items-center bg-[#161b22] border-b border-[#30363d] px-2 gap-1 flex-shrink-0 overflow-x-auto no-scrollbar">
            {openTabs.map((tab) => {
              const isActive = tab.id === activeFileId
              return (
                <div
                  key={tab.id}
                  onClick={() => switchActiveFile(tab)}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-t text-xs font-mono cursor-pointer border-t-2 transition-colors ${
                    isActive
                      ? 'bg-[#1e1e1e] border-blue-500 text-gray-200 font-semibold'
                      : 'border-transparent text-gray-400 hover:bg-[#21262d] hover:text-gray-200'
                  }`}
                >
                  <span className="truncate max-w-[140px]">{tab.name}</span>
                  {tab.id === activeFileId && dirty && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  )}
                  {openTabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      title="Close Tab"
                      className="p-0.5 rounded hover:bg-[#30363d] hover:text-white text-gray-500 transition-colors"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
            <div className="ml-auto flex items-center gap-3 pr-2 text-xs text-gray-500 font-mono">
              <span className="hidden sm:inline">{activeFile?.path || currentFileName}</span>
              <span>rev #{version}</span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden">
            <MonacoEditor
              value={content}
              language={language}
              theme={theme}
              fontSize={fontSize}
              readOnly={isViewer}
              onChange={handleEditorChange}
              onCursorChange={handleCursorChange}
              onMount={(editor, monaco) => {
                editorRef.current = editor
                monacoRef.current = monaco
                setEditorMounted(true)
              }}
            />

            {/* Live Remote Cursors Renderer */}
            {editorMounted && editorRef.current && monacoRef.current && (
              <CursorMarker
                editor={editorRef.current}
                monaco={monacoRef.current}
                cursors={cursors}
                currentUserId={user?.id}
              />
            )}
          </div>
        </main>

        {/* RIGHT PANEL: WORKSPACE DETAILS & ACTIVITY LOG */}
        {showRightSidebar && (
          <aside className="w-64 flex-shrink-0 flex flex-col bg-[#161b22] border-l border-[#30363d] overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-[#30363d] bg-[#0d1117]/80 text-xs font-semibold">
              <button
                onClick={() => setRightTab('info')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors border-b-2 ${
                  rightTab === 'info'
                    ? 'border-blue-500 text-blue-400 bg-[#161b22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FiInfo className="w-3.5 h-3.5" />
                <span>Info</span>
              </button>
              <button
                onClick={() => setRightTab('activity')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors border-b-2 ${
                  rightTab === 'activity'
                    ? 'border-blue-500 text-blue-400 bg-[#161b22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <FiActivity className="w-3.5 h-3.5" />
                <span>Activity</span>
              </button>
            </div>

            {/* Tab Body: Workspace Details */}
            {rightTab === 'info' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Workspace
                  </h4>
                  <p className="font-bold text-gray-100 text-sm break-words">
                    {roomInfo?.name || 'Workspace'}
                  </p>
                  {roomInfo?.description && (
                    <p className="mt-1 text-gray-400 leading-relaxed break-words">
                      {roomInfo.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#30363d]/60">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">Language</span>
                    <p className="font-mono font-semibold text-blue-400">
                      {language.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">Revision</span>
                    <p className="font-mono font-semibold text-gray-200">rev #{version}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#30363d]/60">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">Your Role</span>
                    <p className="font-semibold text-amber-400">{currentUserRole}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">Capacity</span>
                    <p className="font-semibold text-gray-200">
                      {participants.length} / {roomInfo?.maxParticipants || 10}
                    </p>
                  </div>
                </div>

                {roomInfo?.accessCode && (
                  <div className="pt-3 border-t border-[#30363d]/60">
                    <span className="text-[10px] text-gray-400 uppercase">Share Access Code</span>
                    <button
                      onClick={copyAccessCode}
                      className="w-full mt-1.5 flex items-center justify-between px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg font-mono text-gray-200 hover:border-blue-500 transition-colors"
                    >
                      <span className="font-bold text-blue-400 tracking-wider">
                        {roomInfo.accessCode}
                      </span>
                      {copiedCode ? (
                        <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <FiCopy className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}

                {/* Remote Cursors Tracker */}
                <div className="pt-3 border-t border-[#30363d]/60">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Active Cursors ({Object.keys(cursors).length})
                  </h4>
                  <div className="space-y-1.5">
                    {Object.values(cursors).map((c) => (
                      <div
                        key={c.userId}
                        className="flex items-center gap-2 bg-[#0d1117] px-2.5 py-1.5 rounded-lg border border-[#30363d]/50"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="truncate max-w-[90px] text-gray-200 font-medium">
                          {c.username}
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-gray-400">
                          L{c.line}:C{c.column}
                        </span>
                      </div>
                    ))}
                    {Object.keys(cursors).length === 0 && (
                      <p className="text-gray-500 italic py-1 text-center">No remote cursors</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Body: Real-time Event Log */}
            {rightTab === 'activity' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Live Stream
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Listening
                  </span>
                </div>

                <div className="space-y-1.5">
                  {activityEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2 rounded bg-[#0d1117] border border-[#30363d]/50 text-gray-300"
                    >
                      <p className="leading-snug">{evt.text}</p>
                      <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
                        {evt.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ─── BOTTOM IDE STATUS BAR ──────────────────────────────────── */}
      <footer className="h-6 flex items-center justify-between px-3 bg-[#161b22] border-t border-[#30363d] text-[11px] text-gray-400 flex-shrink-0 z-20 font-mono">
        {/* Left: WebSocket connection, Sync Status, Revision */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connected
                  ? 'bg-emerald-400'
                  : reconnecting
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span>{connected ? 'Sync Engine Live' : (reconnecting ? 'Reconnecting...' : 'Disconnected')}</span>
          </div>
          <span className="text-[#30363d]">|</span>
          <span>rev #{version}</span>
          <span className="text-[#30363d]">|</span>
          <span className={dirty ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
            {dirty ? '● Unsaved changes' : '✓ In Sync'}
          </span>
        </div>

        {/* Center: Permissions indicator */}
        <div className="hidden sm:flex items-center gap-1.5">
          {isViewer ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <FiLock className="w-3 h-3" />
              <span>Read-Only (Viewer)</span>
            </span>
          ) : (
            <span className="text-gray-300 flex items-center gap-1">
              <FiZap className="w-3 h-3 text-blue-400" />
              <span>Read & Write</span>
            </span>
          )}
        </div>

        {/* Right: Line/Col, Indent, Encoding, Language, Font */}
        <div className="flex items-center gap-3">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.column}
          </span>
          <span className="text-[#30363d] hidden sm:inline">|</span>
          <span className="hidden sm:inline">Spaces: 2</span>
          <span className="text-[#30363d] hidden sm:inline">|</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="text-[#30363d]">|</span>
          <span className="text-blue-400 font-semibold">{language.toUpperCase()}</span>
          <span className="text-[#30363d] hidden md:inline">|</span>
          <span className="hidden md:inline">{fontSize}px</span>
        </div>
      </footer>

      {/* ─── LEAVE CONFIRMATION MODAL ───────────────────────────────── */}
      {showLeaveConfirm && (
        <Modal title="Leave Collaborative Room" onClose={() => setShowLeaveConfirm(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to leave <strong className="text-white">"{roomInfo?.name}"</strong>?
              Your latest code edits have been preserved.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowLeaveConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleLeaveConfirm}>
                Leave Room
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
