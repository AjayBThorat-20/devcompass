# Regenerate: vhs docs/vhs/demo-snapshot.tape
# Requires: depvora linked globally, with real snapshots already in
# ~/.depvora/history.db (run `depvora analyze` a couple of times first)

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
Type "cd /tmp/depvora-docs-demo-fix && clear"
Enter
Sleep 300ms
Show

Type "depvora snapshot list --project docs-demo-project"
Enter
Sleep 2s

Type "depvora snapshot view 1087"
Enter
Sleep 3s
