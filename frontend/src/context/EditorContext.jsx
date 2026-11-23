import { createContext, useContext, useReducer, useCallback } from 'react'

const EditorContext = createContext(null)

const initialState = {
  content: '',
  language: 'javascript',
  version: 0,
  participants: [],
  cursors: {},       // { userId: { line, column, color, username } }
  connected: false,
  roomInfo: null,
}

function editorReducer(state, action) {
  switch (action.type) {
    case 'SET_CONTENT':
      return { ...state, content: action.payload }
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    case 'SET_VERSION':
      return { ...state, version: action.payload }
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload }
    case 'SET_ROOM_INFO':
      return { ...state, roomInfo: action.payload }
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload }
    case 'ADD_PARTICIPANT': {
      const exists = state.participants.find(p => p.userId === action.payload.userId)
      if (exists) return state
      return { ...state, participants: [...state.participants, action.payload] }
    }
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter(p => p.userId !== action.payload),
        cursors: Object.fromEntries(
          Object.entries(state.cursors).filter(([id]) => id !== action.payload)
        ),
      }
    case 'UPDATE_CURSOR':
      return {
        ...state,
        cursors: { ...state.cursors, [action.payload.userId]: action.payload },
      }
    case 'REMOVE_CURSOR': {
      const { [action.payload]: _, ...rest } = state.cursors
      return { ...state, cursors: rest }
    }
    default:
      return state
  }
}

export function EditorProvider({ children }) {
  const [state, dispatch] = useReducer(editorReducer, initialState)

  const updateContent = useCallback((content) => {
    dispatch({ type: 'SET_CONTENT', payload: content })
  }, [])

  const setLanguage = useCallback((language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language })
  }, [])

  const updateCursor = useCallback((cursorData) => {
    dispatch({ type: 'UPDATE_CURSOR', payload: cursorData })
  }, [])

  const addParticipant = useCallback((participant) => {
    dispatch({ type: 'ADD_PARTICIPANT', payload: participant })
  }, [])

  const removeParticipant = useCallback((userId) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', payload: userId })
  }, [])

  const setParticipants = useCallback((participants) => {
    dispatch({ type: 'SET_PARTICIPANTS', payload: participants })
  }, [])

  const setConnected = useCallback((connected) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected })
  }, [])

  const setRoomInfo = useCallback((roomInfo) => {
    dispatch({ type: 'SET_ROOM_INFO', payload: roomInfo })
    if (roomInfo?.language) {
      dispatch({ type: 'SET_LANGUAGE', payload: roomInfo.language.toLowerCase() })
    }
  }, [])

  const setVersion = useCallback((version) => {
    dispatch({ type: 'SET_VERSION', payload: version })
  }, [])

  const value = {
    ...state,
    updateContent,
    setLanguage,
    updateCursor,
    addParticipant,
    removeParticipant,
    setParticipants,
    setConnected,
    setRoomInfo,
    setVersion,
  }

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}
