import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiZap,
  FiCode,
  FiShield,
  FiUsers,
  FiArrowRight,
  FiGlobe,
  FiCpu,
  FiTerminal,
  FiLayers,
  FiCheckCircle,
  FiActivity,
  FiCopy,
  FiCheck,
} from 'react-icons/fi'

const CODE_EXAMPLES = {
  javascript: `// CodeSync Operational Transformation Engine
import { OperationalTransformation } from '@codesync/ot';

// Active STOMP WebSocket Session
const session = await CodeSync.connect({
  room: "DISTRIBUTED-SYSTEMS-01",
  user: "Ganesh"
});

// Concurrent character edit transformation
function transformOperation(localOp, incomingOp) {
  if (incomingOp.position <= localOp.position) {
    return { ...localOp, position: localOp.position + incomingOp.text.length };
  }
  return localOp; // Convergence achieved ✓
}`,
  python: `# PyTorch Distributed Neural Architecture Search
import torch
import torch.distributed as dist
from codesync import RealtimeSession

session = RealtimeSession(room_code="ML-COLLAB-99")
model = EvolutionaryNAS(search_space="DARTS")

# Broadcast gradient synchronization
@session.on_collaborator_edit
def sync_gradients(delta):
    model.apply_operational_delta(delta)
    print(f"Synchronized revision #{delta.version} with 0 conflict")`,
  go: `// Raft Consensus Engine Collaboration
package main

import (
    "fmt"
    "github.com/codesync/engine"
)

func main() {
    node := engine.NewCollaborativeCluster("RAFT-CLUSTER-1")
    node.ListenWebSocket(":8080/ws")
    
    // Broadcast log replication across peers
    node.OnPeerCommit(func(rev int64) {
        fmt.Printf("State Machine Converged at rev #%d\\n", rev)
    })
}`,
}

const FEATURES = [
  {
    icon: <FiZap className="w-6 h-6 text-amber-400" />,
    badge: 'Real-Time Messaging',
    title: 'STOMP over WebSockets',
    desc: 'Sub-15ms latency message broadcasting with heartbeats, presence detection, and automatic reconnection.',
  },
  {
    icon: <FiCpu className="w-6 h-6 text-cyan-400" />,
    badge: 'Conflict Resolution',
    title: 'Operational Transformation',
    desc: 'Mathematical convergence guarantees for concurrent character insertions and deletions across distributed clients.',
  },
  {
    icon: <FiCode className="w-6 h-6 text-blue-400" />,
    badge: 'IDE Experience',
    title: 'Monaco Editor Integration',
    desc: 'Full VS Code editing power directly in browser: IntelliSense, syntax highlighting, multi-cursor remote markers.',
  },
  {
    icon: <FiShield className="w-6 h-6 text-emerald-400" />,
    badge: 'Enterprise Security',
    title: 'BCrypt & JWT Authentication',
    desc: 'Stateless JWT authentication filter chain, BCrypt salted password hashing, and granular room role governance.',
  },
  {
    icon: <FiUsers className="w-6 h-6 text-purple-400" />,
    badge: 'Access Control',
    title: 'Role-Based Collaboration',
    desc: 'Host rooms with 6-character access codes. Assign OWNER, EDITOR, or VIEWER permissions to manage peer access.',
  },
  {
    icon: <FiLayers className="w-6 h-6 text-pink-400" />,
    badge: 'Data Layer',
    title: 'Persistent Storage',
    desc: 'Spring Data JPA entity relational schema with persistent storage and MySQL 9.x / H2 production architecture.',
  },
]

export default function LandingPage() {
  const [activeLang, setActiveLang] = useState('javascript')
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeLang])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-100 selection:bg-blue-600 selection:text-white">
      {/* Background Decorative Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 sm:pt-28 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/25 px-4 py-1.5 text-xs font-semibold text-blue-400 mb-8 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span>Final-Year B.Tech AI & ML Engineering Project</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
          Real-Time Collaborative Coding{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
            Reinvented.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Experience sub-15ms distributed code synchronization powered by Spring Boot 3 STOMP WebSockets, Monaco Editor, and Operational Transformation (OT) conflict resolution.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 text-sm transition-all shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40"
          >
            <span>Start Collaborating Free</span>
            <FiArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-gray-200 font-semibold px-7 py-3.5 text-sm transition-all hover:text-white"
          >
            <span>Sign In to Workspaces</span>
          </Link>
        </div>

        {/* Live Metrics Ticker */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          <div className="rounded-xl border border-[#30363d]/60 bg-[#161b22]/50 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white">&lt;15ms</p>
            <p className="text-xs text-gray-400 mt-1">WebSocket Latency</p>
          </div>
          <div className="rounded-xl border border-[#30363d]/60 bg-[#161b22]/50 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-cyan-400">0%</p>
            <p className="text-xs text-gray-400 mt-1">Divergence Rate</p>
          </div>
          <div className="rounded-xl border border-[#30363d]/60 bg-[#161b22]/50 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-blue-400">Java 21</p>
            <p className="text-xs text-gray-400 mt-1">Spring Boot 3 Core</p>
          </div>
          <div className="rounded-xl border border-[#30363d]/60 bg-[#161b22]/50 p-4 backdrop-blur-sm">
            <p className="text-2xl font-bold text-emerald-400">100%</p>
            <p className="text-xs text-gray-400 mt-1">OT Consistency</p>
          </div>
        </div>
      </section>

      {/* Interactive Code Preview Playground */}
      <section className="px-4 max-w-5xl mx-auto mb-28">
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] shadow-2xl shadow-blue-950/40 overflow-hidden backdrop-blur-xl">
          {/* Editor Header Bar with Language Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0d1117] border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />

              {/* Language Selector Pills */}
              <div className="ml-4 flex items-center gap-1.5 bg-[#161b22] p-1 rounded-lg border border-[#30363d]">
                {['javascript', 'python', 'go'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                      activeLang === lang
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>3 PEERS CONNECTED</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-[#21262d] border border-[#30363d] transition-colors"
              >
                {copied ? <FiCheck className="h-3.5 w-3.5 text-emerald-400" /> : <FiCopy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Window with Simulated Peer Cursors */}
          <div className="relative p-6 font-mono text-sm leading-relaxed overflow-x-auto bg-[#0d1117]/90 text-gray-200">
            <pre>
              <code>{CODE_EXAMPLES[activeLang]}</code>
            </pre>

            {/* Floating Simulated Remote Cursor Marker */}
            <div className="absolute right-12 bottom-8 hidden sm:flex items-center gap-2 rounded-xl bg-[#161b22]/90 border border-blue-500/40 p-3 shadow-xl backdrop-blur-md">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                G
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">Ganesh (Host)</p>
                <p className="text-[10px] text-emerald-400 font-mono">Broadcasting rev #42</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive OT Architecture Visualizer Section */}
      <section className="px-4 max-w-5xl mx-auto mb-28">
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-950/20 to-[#161b22]/80 p-8 sm:p-12 backdrop-blur-xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">System Architecture</span>
            <h2 className="text-3xl font-bold text-white mt-2">How CodeSync OT Resolves Conflicts</h2>
            <p className="text-sm text-gray-400 mt-2">
              Unlike primitive whole-buffer overwriting which loses concurrent developer edits, CodeSync implements character-level operational transformation deltas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-5">
              <div className="flex items-center gap-2 text-red-400 font-semibold mb-3 text-sm">
                <span>✕ Traditional Naive Sync</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  Client A and Client B type at the same instant.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  Last-write-wins overwrites and deletes the other developer's code.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  Document divergence and lost work.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3 text-sm">
                <span>✓ CodeSync Operational Transformation</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  Operations are tagged with local revision sequence number.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  OT engine transforms position coordinates against concurrent edits.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  All clients mathematically converge to the identical character buffer.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="px-4 max-w-6xl mx-auto pb-32">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Platform Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
            Engineered for Modern Development Teams
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[#30363d] bg-[#161b22]/70 p-6 transition-all duration-200 hover:border-blue-500/40 hover:bg-[#161b22] hover:shadow-xl hover:shadow-blue-950/20 backdrop-blur-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#21262d] border border-[#30363d] group-hover:scale-105 transition-transform">
                    {f.icon}
                  </div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 rounded-full bg-[#21262d] px-2.5 py-0.5 border border-[#30363d]">
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
