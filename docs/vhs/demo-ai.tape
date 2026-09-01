# Regenerate: vhs docs/vhs/demo-ai.tape
# Requires: depvora linked globally, and a configured LLM provider
# (`depvora llm add ...`) — this recording used a local Ollama model,
# so it's a real free response, not a mock.

Output docs/assets/demo-ai.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 620
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/depvora-docs-demo && clear"
Enter
Sleep 300ms
Show

Type `depvora ai ask "Why is axios flagged as a security risk?"`
Enter
Sleep 15s
