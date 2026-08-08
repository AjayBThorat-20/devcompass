# Regenerate: vhs docs/vhs/demo-analyze.tape
# Requires: devcompass linked globally, and a demo project at /tmp/devcompass-demo
# with real vulnerable dependencies (axios@0.21.1, lodash@4.17.15, minimist@1.2.5)

Output docs/assets/demo-analyze.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 920
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/devcompass-demo && clear"
Enter
Sleep 300ms
Show

Type "devcompass analyze"
Enter
Sleep 30s
