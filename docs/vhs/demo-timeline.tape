# Regenerate: vhs docs/vhs/demo-timeline.tape
# Requires: depvora linked globally, with at least two snapshots of the
# same project (e.g. before/after `depvora fix`) in ~/.depvora/history.db

Output docs/assets/demo-timeline.gif

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

Type "depvora timeline --days 30 --project docs-demo-project"
Enter
Sleep 3s
