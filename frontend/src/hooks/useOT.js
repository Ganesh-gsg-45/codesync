import { useRef, useCallback } from 'react'
import { useEditor } from '../context/EditorContext'

/**
 * Client-side Operational Transformation (OT) hook.
 *
 * Tracks pending (unacknowledged) operations and transforms
 * incoming remote operations against them before applying.
 *
 * Operation shape:
 *   { type: 'insert'|'delete', position: number, text?: string, length?: number, revision: number }
 */
export function useOT() {
  const { updateContent, content, version, setVersion } = useEditor()
  const pendingOpsRef = useRef([])         // ops sent but not yet acked
  const acknowledgedRevisionRef = useRef(0)

  /**
   * Transform op1 against op2 — returns a new op1 adjusted for op2.
   */
  function transformOp(op1, op2) {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return { ...op1, position: op1.position + op2.text.length }
      }
      return op1
    }
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op2.position < op1.position) {
        return { ...op1, position: Math.max(op2.position, op1.position - op2.length) }
      }
      return op1
    }
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return { ...op1, position: op1.position + op2.text.length }
      }
      return op1
    }
    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op2.position < op1.position) {
        return { ...op1, position: Math.max(op2.position, op1.position - op2.length) }
      }
      return op1
    }
    return op1
  }

  /**
   * Apply a single operation to a string and return the new string.
   */
  function applyOp(text, op) {
    if (op.type === 'insert') {
      return text.slice(0, op.position) + op.text + text.slice(op.position)
    }
    if (op.type === 'delete') {
      return text.slice(0, op.position) + text.slice(op.position + op.length)
    }
    // Full-content replacement (used for sync)
    if (op.type === 'replace') {
      return op.content ?? text
    }
    return text
  }

  /**
   * Receive and apply a remote operation, transforming it
   * against all pending (unacknowledged) local ops first.
   */
  const applyRemoteOp = useCallback((remoteOp) => {
    let transformedOp = remoteOp
    for (const pending of pendingOpsRef.current) {
      transformedOp = transformOp(transformedOp, pending)
    }
    updateContent(prev => applyOp(prev, transformedOp))
  }, [updateContent])

  /**
   * Buffer and dispatch a local operation.
   * The caller is responsible for sending it over WebSocket.
   */
  const sendOperation = useCallback((op, sendViaWS) => {
    const taggedOp = { ...op, revision: acknowledgedRevisionRef.current }
    pendingOpsRef.current = [...pendingOpsRef.current, taggedOp]
    // Optimistically apply
    updateContent(prev => applyOp(prev, taggedOp))
    if (sendViaWS) sendViaWS(taggedOp)
    return taggedOp
  }, [updateContent])

  /**
   * Acknowledge that the server has processed ops up to `revision`.
   * Clears pending ops whose revision <= acknowledged revision.
   */
  const acknowledge = useCallback((revision) => {
    acknowledgedRevisionRef.current = revision
    pendingOpsRef.current = pendingOpsRef.current.filter(
      (op) => op.revision > revision
    )
    setVersion(revision)
  }, [setVersion])

  return { applyRemoteOp, sendOperation, acknowledge }
}
