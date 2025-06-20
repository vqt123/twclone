# Claude Code Documentation

## Overview

Claude Code is an "agentic coding tool that lives in your terminal, understands your codebase, and helps you code faster through natural language commands."

### Key Capabilities
- Editing files and fixing bugs across a codebase
- Answering questions about code architecture and logic
- Executing and fixing tests, linting, and other commands
- Searching git history and resolving merge conflicts
- Browsing documentation and web resources

### Installation
```bash
npm install -g @anthropic-ai/claude-code
```

To run, simply type `claude` in the terminal.

### Security Features
- Direct API connection without intermediate servers
- Operates directly in the terminal
- Maintains awareness of project structure
- Performs real coding operations

## CLI Usage

### CLI Commands
- `claude`: Start interactive REPL
- `claude "query"`: Start REPL with initial prompt
- `claude -p "query"`: Query via SDK and exit
- `claude -c`: Continue most recent conversation
- `claude update`: Update to latest version
- `claude mcp`: Configure Model Context Protocol servers

### Key CLI Flags
- `--add-dir`: Add working directories
- `--print/-p`: Print response without interactive mode
- `--output-format`: Specify output format (text, json, stream-json)
- `--verbose`: Enable detailed logging
- `--model`: Set model for session
- `--continue`: Load most recent conversation
- `--resume`: Resume specific session

### Piping and Automation
- Supports piping content with `cat file | claude -p "query"`
- Offers flexibility in session management
- Provides options for scripting and automation

## Memory Management

Claude Code offers three memory locations:

### 1. Project Memory (`./CLAUDE.md`)
Team-shared instructions for project architecture, coding standards, and workflows.

### 2. User Memory (`~/.claude/CLAUDE.md`)
Personal preferences across all projects, like code styling and tooling shortcuts.

### 3. Project Memory (Local) - Deprecated
Previously used for personal project-specific preferences.

### Key Features
- Memory files are automatically loaded when Claude Code launches
- Supports file imports using `@path/to/import` syntax
- Can import files recursively (max 5 hops)
- Memories are discovered by recursively searching from current working directory

### Quick Memory Management
- Use `#` to quickly add a memory (prompts selection of memory file)
- Use `/memory` slash command to edit memory files in system editor
- Use `/init` to bootstrap a CLAUDE.md for a codebase

### Best Practices
- "Be specific" in memory instructions
- Use structured markdown
- Periodically review and update memories

## Settings

Claude Code offers comprehensive configuration options through `settings.json` files with three levels of settings:

### Settings Hierarchy
1. User settings (global, in `~/.claude/settings.json`)
2. Project settings (in `.claude/settings.json` and `.claude/settings.local.json`)
3. Enterprise managed policy settings

### Key Configuration Areas
- Permissions
- Environment variables
- API key management
- Tool access control

### Important Environment Variables
- `ANTHROPIC_API_KEY`
- `CLAUDE_CODE_USE_BEDROCK`
- `DISABLE_TELEMETRY`

### Available Tools
- Bash
- Edit
- Read
- Write
- WebSearch
- Agent

### Settings Management
- `claude config` commands
- Directly editing `settings.json`

## Security

### Key Security Principles
- Claude Code uses a "permission-based architecture" with strict read-only permissions by default
- Requires explicit user approval for actions like editing files or executing commands
- Implements multiple layers of protection against potential security risks

### Core Security Protections
- Folder access restricted to the directory where Claude Code was started
- Supports allowlisting safe commands
- Provides "Accept Edits" mode for controlled changes
- Implements safeguards against prompt injection attacks

### Prompt Injection Protections
- Requires explicit approval for network requests
- Uses isolated context windows
- Performs trust verification
- Includes command injection detection
- Uses "fail-closed matching" for unrecognized commands

### Best Practices
- Review all suggested changes before approval
- Use project-specific permission settings
- Consider using development containers for isolation
- Regularly audit permission settings

### Reporting Security Issues
- Use HackerOne program
- Do not disclose vulnerabilities publicly
- Provide detailed reproduction steps

## Costs

### Key Cost Insights
- Average cost is "$6 per developer per day"
- Daily costs remain below $12 for 90% of users
- Team usage costs ~$50-60/developer per month with Sonnet 4

### Cost Tracking Methods
- Use `/cost` command to see current session usage
- Anthropic Console users can:
  - Check historical usage
  - Set workspace spend limits

### Cost Reduction Strategies
- Use auto-compact feature
- Write specific queries
- Break down complex tasks
- Clear conversation history between tasks

### Factors Affecting Costs
- Codebase size
- Query complexity
- Number of files searched/modified
- Conversation history length
- Compaction frequency
- Background processes

### Background Token Usage
- Haiku generation: ~1 cent/day
- Conversation summarization
- Command processing

**Recommendation:** "Start with a small pilot group to establish usage patterns before wider rollout."

## Enterprise Deployment (Bedrock/Vertex Proxies)

### Key Deployment Configurations

#### 1. Direct Provider Access
- Simplest setup
- Works with existing AWS or GCP infrastructure
- Provides native monitoring and compliance

#### 2. Corporate Proxy
- Routes traffic through specific network paths
- Enables traffic monitoring and compliance
- Handles existing corporate proxy requirements

#### 3. LLM Gateway
- Tracks usage across teams
- Allows dynamic model switching
- Supports custom rate limiting
- Provides centralized authentication management

### Deployment Scenarios
- Can use Bedrock or Vertex AI with corporate proxy
- Supports configuration through environment variables
- Enables authentication via tokens and gateway services

### Best Practices
- Create documentation (e.g., "CLAUDE.md")
- Develop "one-click" installation
- Encourage gradual adoption
- Configure security permissions
- Use Model Context Protocol (MCP) for additional information

### Debugging Tips
- Use "claude /status" slash command
- Set "ANTHROPIC_LOG=debug" for request logging

## Tutorials and Common Workflows

### 1. Understanding New Codebases
- Navigate to project root
- Start Claude Code
- Ask for high-level overview and detailed component analysis
- Example: "Find the files that handle user authentication"

### 2. Fixing Bugs Efficiently
- Share error details with Claude
- Request fix recommendations
- Apply suggested fixes
- Example: "I'm seeing an error when I run npm test"

### 3. Code Refactoring
- Identify legacy code
- Get refactoring recommendations
- Apply changes safely
- Verify refactored code

### 4. Working with Tests
- Identify untested code
- Generate test scaffolding
- Add meaningful test cases
- Run and verify tests

### 5. Additional Features
- Create pull requests
- Handle documentation
- Work with images
- Use extended thinking
- Resume previous conversations
- Run parallel Claude Code sessions with Git worktrees

## Troubleshooting

### 1. Linux Permission Issues
**Common problem:** Permission errors when installing npm packages

**Recommended solution:** Create a user-writable npm prefix in home directory
- Save existing global packages
- Create a new directory for global packages
- Configure npm to use the new directory
- Update system PATH

### 2. Authentication and Permissions
- For repeated permission prompts: Use "/permissions" command
- For authentication problems:
  - Run "/logout"
  - Close Claude Code
  - Restart and re-authenticate
  - If issues persist, remove authentication file and restart

### 3. Performance and Stability
**Potential high resource usage with large codebases**

**Recommendations:**
- Use "/compact" to reduce context size
- Restart Claude Code between major tasks
- Add large build directories to .gitignore

### 4. Troubleshooting Specific Issues
- Command hangs: Use Ctrl+C or restart terminal
- JetBrains terminal ESC key problems: Modify terminal keybindings

### 5. Getting Additional Help
- Use "/bug" command to report problems
- Check GitHub repository
- Run "/doctor" to check installation health

---

*Documentation downloaded and compiled on 2025-06-19*