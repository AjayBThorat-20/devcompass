# Regenerate: vhs docs/vhs/demo-clean.tape
# Requires: depvora linked globally, and a demo project at
# /tmp/depvora-docs-demo that already has a populated .depvora/
# directory (run `depvora analyze` and `depvora graph` first)

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
Type "cd /tmp/depvora-docs-demo && clear"
Enter
Sleep 300ms
Show

Type "depvora clean"
Enter
Sleep 2s

Type "depvora clean --graphs --force"
Enter
Sleep 2s
