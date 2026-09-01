# Regenerate: vhs docs/vhs/demo-snapshot.tape
# Requires: devcompass linked globally, with real snapshots already in
# ~/.devcompass/history.db (run `devcompass analyze` a couple of times first)

Output docs/assets/demo-snapshot.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 620
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/devcompass-docs-demo-fix && clear"
Enter
Sleep 300ms
Show

Type "devcompass snapshot list --project docs-demo-project"
Enter
Sleep 2s

Type "devcompass snapshot view 1087"
Enter
Sleep 3s
