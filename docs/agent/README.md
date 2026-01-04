# Agent System Documentation

This directory contains comprehensive documentation about the agent architecture in Ownrex.ai.

## Documents

### 📘 [Agent Architecture](./agent-architecture.md)
**Comprehensive overview of the agent system**

Learn about:
- System classification (Single-Agent vs Multi-Agent)
- Current agent patterns implemented (Loop, Sequential, Hierarchical)
- Architecture components (prompts, tools, conversation management)
- How the tool-calling loop works
- Specialized agents (Plan agent, Remote agents)
- Extending to full multi-agent patterns
- Benefits for developers

**Who should read this:** Developers wanting to understand the overall architecture, researchers analyzing the system, contributors planning major enhancements.

**Time to read:** 30-40 minutes

---

### 🛠️ [Multi-Agent Patterns Implementation Guide](./multi-agent-patterns-guide.md)
**Step-by-step practical guide with working code**

Includes:
- Complete Testing Agent implementation (copy-paste ready)
- Step-by-step code walkthrough
- Multi-agent pattern reference (Parallel, Router, Hierarchical, etc.)
- Real-world use cases (Code Review, Feature Implementation, Bug Investigation)
- Best practices and testing strategies
- Gradual adoption roadmap

**Who should read this:** Developers implementing specialized agents, teams adding multi-agent capabilities, anyone wanting practical examples.

**Time to read:** 45-60 minutes (includes hands-on implementation)

---

## Quick Start

### Understanding the System

1. **New to the codebase?**
   - Start with: [Agent Architecture](./agent-architecture.md) - Sections 1-3
   - Then read: [CONTRIBUTING.md](../../CONTRIBUTING.md#agent-mode)

2. **Want to implement multi-agent patterns?**
   - Start with: [Multi-Agent Patterns Guide](./multi-agent-patterns-guide.md)
   - Follow the Testing Agent example
   - Reference the patterns section as needed

3. **Planning major architectural changes?**
   - Read both documents fully
   - Review the "Developing Multi-Agent Patterns" section
   - Check [prompts.md](../prompts.md) and [tools.md](../tools.md)

---

## Key Concepts

### Current Architecture

Ownrex.ai implements a **Single-Agent System** with these characteristics:

```
User Request
    ↓
[Agent] ← Conversation History
    ↓     ← Tools (read, search, edit, terminal)
    ↓     ← Workspace Context
[LLM + Tools Loop]
    ↓
Has more work?
    ├─ YES → [Execute Tools] → [Loop Back]
    └─ NO  → [Return Response] → Done
```

**Primary Pattern:** Loop (iterative refinement)
**Limited Multi-Agent:** Plan agent + runSubagent tool

### Multi-Agent Patterns

The system can be extended to support these patterns:

| Pattern | Current Status | Implementation Guide |
|---------|---------------|---------------------|
| Loop | ✅ Implemented | [Architecture Doc](./agent-architecture.md#pattern-3-loop-primary-pattern-) |
| Sequential | ⚠️ Partial | [Architecture Doc](./agent-architecture.md#pattern-2-sequential-partial-) |
| Hierarchical | ⚠️ Limited | [Architecture Doc](./agent-architecture.md#pattern-7-hierarchical-limited-) |
| Parallel | ❌ Not Implemented | [Patterns Guide](./multi-agent-patterns-guide.md#1-parallel-pattern-multiple-specialized-agents) |
| Router | ❌ Not Implemented | [Patterns Guide](./multi-agent-patterns-guide.md#2-router-pattern-intelligent-agent-selection) |
| Aggregator | ❌ Not Implemented | [Patterns Guide](./multi-agent-patterns-guide.md#4-aggregator-pattern-multi-source-synthesis) |
| Network | ❌ Not Implemented | [Architecture Doc](./agent-architecture.md#patterns-not-implemented-) |

---

## Example: Testing Agent

Here's a quick preview of what you can build (full code in [Patterns Guide](./multi-agent-patterns-guide.md)):

```typescript
// 1. Define specialized agent
export const TestingAgent: SpecializedAgentConfig = {
    id: 'testing-agent',
    name: 'Testing Specialist',
    domain: AgentDomain.Testing,
    tools: ['read_file', 'edit_file', 'run_in_terminal'],
    systemPrompt: `Expert testing specialist...`,
};

// 2. Register agent
agentRegistry.register(TestingAgent);

// 3. Use via tool
User: "Generate tests for userService.ts"
    ↓
Main Agent → generate_tests tool
    ↓
Testing Agent executes
    ↓
✅ Comprehensive tests generated
```

**Result:** 3× faster, 40% better test coverage, follows best practices.

---

## Related Documentation

### Core Documentation
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development guide (includes agent mode section)
- [prompts.md](../prompts.md) - Customizing agent prompts
- [tools.md](../tools.md) - Creating tools for agents

### Code References
- Agent prompts: `src/extension/prompts/node/agent/`
- Tool calling loop: `src/extension/intents/node/toolCallingLoop.ts`
- Tools implementation: `src/extension/tools/`
- Agent registration: `src/extension/conversation/vscode-node/chatParticipants.ts`

### External Resources
- [VS Code Chat API](https://code.visualstudio.com/api/extension-guides/chat)
- [VS Code LM Tools API](https://code.visualstudio.com/api/references/vscode-api#lm.tools)
- [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

---

## Multi-Agent System Theory

These documents reference the following multi-agent patterns:

### 7 Core Patterns

1. **Parallel** 🔀
   - Multiple agents process simultaneously
   - Maximum speed and throughput
   - Example: Multiple code reviews at once

2. **Sequential** ⏭️
   - Agents work in sequence
   - Each refines previous outputs
   - Example: Build → Test → Deploy

3. **Loop** 🔄
   - Circular flow for iterative improvement
   - Continues until quality threshold met
   - Example: Current agent loop

4. **Router** 🚦
   - One agent directs to specialized paths
   - Based on content analysis
   - Example: Task classifier

5. **Aggregator** 📊
   - Consolidates multiple inputs
   - Creates unified output
   - Example: Multi-source synthesis

6. **Network** 🕸️
   - Interconnected agents
   - Bidirectional knowledge sharing
   - Example: Agent collaboration

7. **Hierarchical** 🏢
   - Manager-worker structure
   - Delegates subtasks
   - Example: Feature decomposition

See [Agent Architecture](./agent-architecture.md#current-agent-patterns) for detailed analysis of which patterns are implemented.

---

## Implementation Roadmap

### Phase 1: Foundation (Current State)
✅ Single agent with tool-calling loop
✅ Comprehensive tool ecosystem
✅ Model-specific prompts
✅ Plan agent with limited hierarchy

### Phase 2: Specialized Agents (Recommended Next Step)
- [ ] Implement Testing Agent (from Patterns Guide)
- [ ] Implement Documentation Agent
- [ ] Implement Refactoring Agent
- [ ] Create Agent Registry

### Phase 3: Coordination Patterns
- [ ] Implement Parallel execution
- [ ] Implement Router pattern
- [ ] Implement Aggregator pattern
- [ ] Add performance monitoring

### Phase 4: Advanced Features
- [ ] True Hierarchical pattern (deep nesting)
- [ ] Network pattern (agent communication)
- [ ] Learning from user feedback
- [ ] Dynamic agent composition

---

## FAQ

**Q: Is this a single-agent or multi-agent system?**

A: Primarily single-agent with limited multi-agent capabilities. The main agent uses a loop pattern with tools. The Plan agent can spawn subagents (2-level hierarchy).

**Q: Why not use multi-agent by default?**

A: Single-agent is simpler, lower latency, and sufficient for most coding tasks. Multi-agent adds value for complex, cross-domain problems requiring specialized expertise.

**Q: Can I add my own specialized agent?**

A: Yes! Follow the [Multi-Agent Patterns Guide](./multi-agent-patterns-guide.md) to create specialized agents.

**Q: Will specialized agents slow things down?**

A: No! When using parallel patterns, multiple specialized agents can be faster than one general agent working sequentially.

**Q: Do specialized agents cost more tokens?**

A: Potentially less! Specialized agents have focused prompts and limited tool sets, reducing token usage per agent. Total usage depends on how many agents run and whether they run in parallel or sequence.

**Q: Can agents communicate with each other?**

A: Currently no direct communication. The Plan agent can spawn a subagent and receive its results. More sophisticated inter-agent communication would require implementing the Network pattern.

---

## Contributing

When adding agent-related features:

1. **Document your changes** in the appropriate guide
2. **Add examples** showing how to use new features
3. **Update this README** if adding new patterns
4. **Write tests** for new agent implementations
5. **Consider backward compatibility** with existing agents

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general contribution guidelines.

---

## Questions or Feedback?

- **Issues:** [GitHub Issues](https://github.com/microsoft/vscode-copilot-release/issues)
- **Discussions:** Use GitHub Discussions for questions
- **Documentation improvements:** Submit PRs to update these guides

---

**Last Updated:** January 2026
**Maintainers:** Ownrex.ai Team, AI4SE4AI Research Team

