# Regenerate: vhs docs/vhs/demo-history.tape
# Requires: devcompass linked globally, with real snapshots already in
# ~/.devcompass/history.db

Output docs/assets/demo-history.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 640
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/devcompass-docs-demo-fix && clear"
Enter
Sleep 300ms
Show

Type "devcompass history list --project docs-demo-project"
Enter
Sleep 2s

Type "devcompass history stats"
Enter
Sleep 2s
