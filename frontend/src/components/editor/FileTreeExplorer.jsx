import React, { useState, useMemo } from 'react'
import {
  FiFolder,
  FiFolderPlus,
  FiFilePlus,
  FiFileText,
  FiChevronRight,
  FiChevronDown,
  FiTrash2,
  FiRefreshCw,
  FiCode,
  FiCheck,
  FiX,
} from 'react-icons/fi'
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiHtml5,
  SiJson,
  SiMarkdown,
  SiCplusplus,
} from 'react-icons/si'
import { FaJava } from 'react-icons/fa'

function getFileIcon(filename) {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return <SiJavascript className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return <SiTypescript className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
  if (lower.endsWith('.py')) return <SiPython className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
  if (lower.endsWith('.java')) return <FaJava className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
  if (lower.endsWith('.html')) return <SiHtml5 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
  if (lower.endsWith('.css')) return <FiCode className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
  if (lower.endsWith('.json')) return <SiJson className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
  if (lower.endsWith('.md')) return <SiMarkdown className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
  if (lower.endsWith('.cpp') || lower.endsWith('.c')) return <SiCplusplus className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
  return <FiFileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
}

export default function FileTreeExplorer({
  files = [],
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRefresh,
  isViewer,
  roomName = 'Project Workspace',
}) {
  const [expandedFolders, setExpandedFolders] = useState({ src: true })
  const [creatingType, setCreatingType] = useState(null) // 'file' | 'folder' | null
  const [createTargetFolder, setCreateTargetFolder] = useState('') // path of parent folder or empty for root
  const [inputName, setInputName] = useState('')

  // Build hierarchical folder/file tree
  const tree = useMemo(() => {
    const root = { files: [], folders: {} }

    files.forEach((file) => {
      const parts = file.path.split('/')
      if (parts.length === 1) {
        if (file.isFolder) {
          if (!root.folders[parts[0]]) root.folders[parts[0]] = { ...file, files: [], folders: {} }
        } else {
          root.files.push(file)
        }
      } else {
        let current = root
        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i]
          if (!current.folders[folderName]) {
            current.folders[folderName] = {
              name: folderName,
              path: parts.slice(0, i + 1).join('/'),
              isFolder: true,
              files: [],
              folders: {},
            }
          }
          current = current.folders[folderName]
        }
        const lastPart = parts[parts.length - 1]
        if (file.isFolder) {
          if (!current.folders[lastPart]) {
            current.folders[lastPart] = { ...file, files: [], folders: {} }
          }
        } else {
          current.files.push(file)
        }
      }
    })

    return root
  }, [files])

  function toggleFolder(path) {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  function startCreate(type, folderPath = '') {
    if (isViewer) return
    setCreatingType(type)
    setCreateTargetFolder(folderPath)
    setInputName('')
    if (folderPath) {
      setExpandedFolders((prev) => ({ ...prev, [folderPath]: true }))
    }
  }

  function handleCreateSubmit(e) {
    e.preventDefault()
    if (!inputName.trim()) {
      setCreatingType(null)
      return
    }

    const cleanName = inputName.trim().replace(/[/\\]/g, '')
    const fullPath = createTargetFolder ? `${createTargetFolder}/${cleanName}` : cleanName

    onCreateFile({
      name: cleanName,
      path: fullPath,
      isFolder: creatingType === 'folder',
    })

    setCreatingType(null)
    setInputName('')
  }

  function renderTree(node, depth = 0, currentPath = '') {
    const sortedFolders = Object.values(node.folders).sort((a, b) => a.name.localeCompare(b.name))
    const sortedFiles = [...node.files].sort((a, b) => a.name.localeCompare(b.name))

    return (
      <div className="space-y-0.5">
        {/* Render Folders */}
        {sortedFolders.map((folder) => {
          const isExpanded = !!expandedFolders[folder.path]
          return (
            <div key={folder.path || folder.name}>
              <div
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                className="group flex items-center justify-between py-1 px-2 rounded hover:bg-[#21262d] text-xs text-gray-300 font-medium cursor-pointer transition-colors"
                onClick={() => toggleFolder(folder.path)}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isExpanded ? (
                    <FiChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  ) : (
                    <FiChevronRight className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  <FiFolder className={`w-3.5 h-3.5 ${isExpanded ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span className="truncate">{folder.name}</span>
                </div>

                {!isViewer && (
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startCreate('file', folder.path)
                      }}
                      title="New File Inside Folder"
                      className="p-1 hover:text-blue-400 text-gray-400"
                    >
                      <FiFilePlus className="w-3 h-3" />
                    </button>
                    {folder.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm(`Delete folder "${folder.name}" and all its files?`)) {
                            onDeleteFile(folder.id)
                          }
                        }}
                        title="Delete Folder"
                        className="p-1 hover:text-red-400 text-gray-500"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Folder Children */}
              {isExpanded && (
                <div>
                  {/* Inline Creation inside this folder */}
                  {creatingType && createTargetFolder === folder.path && (
                    <form
                      onSubmit={handleCreateSubmit}
                      style={{ paddingLeft: `${(depth + 1) * 12 + 16}px` }}
                      className="py-1 pr-2 flex items-center gap-1.5"
                    >
                      {creatingType === 'folder' ? (
                        <FiFolder className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      ) : (
                        <FiFileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      )}
                      <input
                        autoFocus
                        type="text"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        placeholder={creatingType === 'folder' ? 'folder-name' : 'filename.js'}
                        onBlur={() => setCreatingType(null)}
                        onKeyDown={(e) => e.key === 'Escape' && setCreatingType(null)}
                        className="w-full bg-[#0d1117] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                      />
                    </form>
                  )}
                  {renderTree(folder, depth + 1, folder.path)}
                </div>
              )}
            </div>
          )
        })}

        {/* Render Files */}
        {sortedFiles.map((file) => {
          const isActive = file.id === activeFileId
          return (
            <div
              key={file.id}
              style={{ paddingLeft: `${depth * 12 + 20}px` }}
              onClick={() => onSelectFile(file)}
              className={`group flex items-center justify-between py-1 px-2 rounded text-xs font-mono cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-white font-semibold border-l-2 border-blue-500'
                  : 'text-gray-300 hover:bg-[#21262d] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {getFileIcon(file.name)}
                <span className="truncate">{file.name}</span>
              </div>

              {!isViewer && sortedFiles.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`Delete file "${file.name}"?`)) {
                      onDeleteFile(file.id)
                    }
                  }}
                  title="Delete File"
                  className="hidden group-hover:block p-1 hover:text-red-400 text-gray-500 transition-colors"
                >
                  <FiTrash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Explorer Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d] bg-[#0d1117]/60">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 truncate">
          Explorer
        </span>
        {!isViewer && (
          <div className="flex items-center gap-1 text-gray-400">
            <button
              onClick={() => startCreate('file')}
              title="New File (Root)"
              className="p-1 hover:text-white hover:bg-[#21262d] rounded transition-colors"
            >
              <FiFilePlus className="w-3.5 h-3.5 text-blue-400" />
            </button>
            <button
              onClick={() => startCreate('folder')}
              title="New Folder (Root)"
              className="p-1 hover:text-white hover:bg-[#21262d] rounded transition-colors"
            >
              <FiFolderPlus className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              onClick={onRefresh}
              title="Refresh Explorer"
              className="p-1 hover:text-white hover:bg-[#21262d] rounded transition-colors"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* File Tree Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Workspace Root Label */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <FiChevronDown className="w-3 h-3" />
          <span className="truncate">{roomName}</span>
        </div>

        {/* Inline Creation at Root */}
        {creatingType && !createTargetFolder && (
          <form onSubmit={handleCreateSubmit} className="py-1 px-3 flex items-center gap-1.5">
            {creatingType === 'folder' ? (
              <FiFolder className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            ) : (
              <FiFileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            )}
            <input
              autoFocus
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder={creatingType === 'folder' ? 'folder-name' : 'filename.js'}
              onBlur={() => setCreatingType(null)}
              onKeyDown={(e) => e.key === 'Escape' && setCreatingType(null)}
              className="w-full bg-[#0d1117] border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
            />
          </form>
        )}

        {/* Tree Elements */}
        {renderTree(tree)}
      </div>
    </div>
  )
}
