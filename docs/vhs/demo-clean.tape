# Regenerate: vhs docs/vhs/demo-clean.tape
# Requires: devcompass linked globally, and a demo project at
# /tmp/devcompass-docs-demo that already has a populated .devcompass/
# directory (run `devcompass analyze` and `devcompass graph` first)

Output docs/assets/demo-clean.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 560
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/devcompass-docs-demo && clear"
Enter
Sleep 300ms
Show

Type "devcompass clean"
Enter
Sleep 2s

Type "devcompass clean --graphs --force"
Enter
Sleep 2s
