import React, { useState, useRef, useEffect } from 'react'
import {
  FiFilePlus,
  FiFolderPlus,
  FiSave,
  FiDownload,
  FiTerminal,
  FiPlay,
  FiSearch,
  FiMaximize,
  FiMinimize,
  FiEye,
  FiHelpCircle,
  FiCode,
  FiX,
  FiCheck,
} from 'react-icons/fi'

export default function VSCodeMenuBar({
  roomName,
  activeFileName,
  onNewFile,
  onNewFolder,
  onSave,
  onDownloadFile,
  onDownloadZip,
  onFormatDocument,
  onFind,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onToggleFullscreen,
  isFullscreen,
  onRunCode,
  isViewer,
}) {
  const [openMenu, setOpenMenu] = useState(null) // 'file' | 'edit' | 'selection' | 'view' | 'run' | 'terminal' | 'help'
  const menuBarRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target)) {
        setOpenMenu(null)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleMenuClick(menuId) {
    setOpenMenu(prev => (prev === menuId ? null : menuId))
  }

  function handleMenuHover(menuId) {
    if (openMenu !== null) {
      setOpenMenu(menuId)
    }
  }

  function triggerAction(action) {
    setOpenMenu(null)
    if (action) action()
  }

  return (
    <div
      ref={menuBarRef}
      className="h-7 bg-[#161b22] border-b border-[#30363d] flex items-center px-2 select-none text-[12px] font-medium text-gray-300 z-40 relative"
    >
      {/* Brand icon / Room label */}
      <div className="flex items-center gap-1.5 pr-3 mr-1 border-r border-[#30363d] text-blue-400 font-semibold">
        <FiCode className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px] text-gray-400 tracking-wide">CodeSync</span>
      </div>

      {/* Menu items list */}
      <div className="flex items-center space-x-0.5">
        {/* FILE MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('file')}
            onMouseEnter={() => handleMenuHover('file')}
            className={`px-2 py-0.5 rounded transition-colors ${
              openMenu === 'file' ? 'bg-[#30363d] text-white' : 'hover:bg-[#21262d] hover:text-white'
            }`}
          >
            File
          </button>
          {openMenu === 'file' && (
            <div className="absolute left-0 top-full mt-1 w-64 rounded-lg bg-[#161b22] border border-[#30363d] py-1 shadow-2xl z-50 text-xs">
              <button
                disabled={isViewer}
                onClick={() => triggerAction(onNewFile)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors disabled:opacity-40"
              >
                <div className="flex items-center gap-2">
                  <FiFilePlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>New File...</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Ctrl+Alt+N</span>
              </button>
              <button
                disabled={isViewer}
                onClick={() => triggerAction(onNewFolder)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors disabled:opacity-40"
              >
                <div className="flex items-center gap-2">
                  <FiFolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Folder...</span>
                </div>
              </button>
              <div className="my-1 border-t border-[#30363d]" />
              <button
                disabled={isViewer}
                onClick={() => triggerAction(onSave)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors disabled:opacity-40"
              >
                <div className="flex items-center gap-2">
                  <FiSave className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Ctrl+S</span>
              </button>
              <div className="my-1 border-t border-[#30363d]" />
              <button
                onClick={() => triggerAction(onDownloadFile)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FiDownload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download Active File</span>
                </div>
              </button>
              <button
                onClick={() => triggerAction(onDownloadZip)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FiDownload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Download Project as ZIP</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('edit')}
            onMouseEnter={() => handleMenuHover('edit')}
            className={`px-2 py-0.5 rounded transition-colors ${
              openMenu === 'edit' ? 'bg-[#30363d] text-white' : 'hover:bg-[#21262d] hover:text-white'
            }`}
          >
            Edit
          </button>
          {openMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-1 w-60 rounded-lg bg-[#161b22] border border-[#30363d] py-1 shadow-2xl z-50 text-xs">
              <button
                onClick={() => triggerAction(onFind)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FiSearch className="w-3.5 h-3.5" />
                  <span>Find in Buffer</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Ctrl+F</span>
              </button>
              <button
                disabled={isViewer}
                onClick={() => triggerAction(onFormatDocument)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors disabled:opacity-40"
              >
                <div className="flex items-center gap-2">
                  <FiCode className="w-3.5 h-3.5" />
                  <span>Format Document</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Shift+Alt+F</span>
              </button>
            </div>
          )}
        </div>

        {/* SELECTION MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('selection')}
            onMouseEnter={() => handleMenuHover('selection')}
            className={`px-2 py-0.5 rounded transition-colors ${
              openMenu === 'selection' ? 'bg-[#30363d] text-white' : 'hover:bg-[#21262d] hover:text-white'
            }`}
          >
            Selection
          </button>
          {openMenu === 'selection' && (
            <div className="absolute left-0 top-full mt-1 w-52 rounded-lg bg-[#161b22] border border-[#30363d] py-1 shadow-2xl z-50 text-xs">
              <button
                onClick={() => {
                  setOpenMenu(null)
                  window.dispatchEvent(new CustomEvent('editor:select-all'))
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors"
              >
                <span>Select All</span>
                <span className="text-[10px] text-gray-400 font-mono">Ctrl+A</span>
              </button>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('view')}
            onMouseEnter={() => handleMenuHover('view')}
            className={`px-2 py-0.5 rounded transition-colors ${
              openMenu === 'view' ? 'bg-[#30363d] text-white' : 'hover:bg-[#21262d] hover:text-white'
            }`}
          >
            View
          </button>
          {openMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-56 rounded-lg bg-[#161b22] border border-[#30363d] py-1 shadow-2xl z-50 text-xs">
              <button
                onClick={() => triggerAction(onToggleLeftSidebar)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors"
              >
                <span>Toggle Explorer Panel</span>
                <span className="text-[10px] text-gray-400 font-mono">Ctrl+B</span>
              </button>
              <button
                onClick={() => triggerAction(onToggleRightSidebar)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors"
              >
                <span>Toggle Info Panel</span>
              </button>
              <div className="my-1 border-t border-[#30363d]" />
              <button
                onClick={() => triggerAction(onToggleFullscreen)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors"
              >
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                <span className="text-[10px] text-gray-400 font-mono">F11</span>
              </button>
            </div>
          )}
        </div>

        {/* RUN MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('run')}
            onMouseEnter={() => handleMenuHover('run')}
            className={`px-2 py-0.5 rounded transition-colors ${
              openMenu === 'run' ? 'bg-[#30363d] text-white' : 'hover:bg-[#21262d] hover:text-white'
            }`}
          >
            Run
          </button>
          {openMenu === 'run' && (
            <div className="absolute left-0 top-full mt-1 w-52 rounded-lg bg-[#161b22] border border-[#30363d] py-1 shadow-2xl z-50 text-xs">
              <button
                onClick={() => triggerAction(onRunCode)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <FiPlay className="w-3.5 h-3.5" />
                  <span>Execute Buffer</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">Ctrl+Enter</span>
              </button>
            </div>
          )}
        </div>

        {/* HELP MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('help')}
            onMouseEnter={() => handleMenuHover('help')}
            className={`px-2 py-0.5 rounded transition-colors ${
              openMenu === 'help' ? 'bg-[#30363d] text-white' : 'hover:bg-[#21262d] hover:text-white'
            }`}
          >
            Help
          </button>
          {openMenu === 'help' && (
            <div className="absolute left-0 top-full mt-1 w-64 rounded-lg bg-[#161b22] border border-[#30363d] py-1 shadow-2xl z-50 text-xs">
              <div className="px-3 py-1.5 text-gray-400">
                <p className="font-semibold text-white">CodeSync Collaborative IDE</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Real-time STOMP & Operational Transformation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center workspace title / active file breadcrumb */}
      <div className="mx-auto hidden md:flex items-center gap-2 text-[11px] text-gray-400 font-mono truncate max-w-sm">
        <span className="text-gray-300 font-semibold">{roomName}</span>
        {activeFileName && (
          <>
            <span className="text-[#30363d]">/</span>
            <span className="text-blue-400 font-medium">{activeFileName}</span>
          </>
        )}
      </div>

      {/* Right-aligned indicator */}
      <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-500 font-mono">
        <span className="hidden lg:inline text-emerald-400">● Live Sync</span>
      </div>
    </div>
  )
}
