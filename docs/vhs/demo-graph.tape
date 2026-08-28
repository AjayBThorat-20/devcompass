# Regenerate: vhs docs/vhs/demo-graph.tape
# Requires: devcompass linked globally, and a demo project at /tmp/devcompass-docs-demo
# with real vulnerable dependencies (axios@0.21.1, lodash@4.17.15, minimist@1.2.5)

Output docs/assets/demo-graph.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 620
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/devcompass-docs-demo && clear"
Enter
Sleep 300ms
Show

Type "devcompass graph --layout force --filter vulnerable"
Enter
Sleep 3s
