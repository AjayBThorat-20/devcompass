# Regenerate: vhs docs/vhs/demo-timeline.tape
# Requires: devcompass linked globally, with at least two snapshots of the
# same project (e.g. before/after `devcompass fix`) in ~/.devcompass/history.db

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
Type "cd /tmp/devcompass-docs-demo-fix && clear"
Enter
Sleep 300ms
Show

Type "devcompass timeline --days 30 --project docs-demo-project"
Enter
Sleep 3s
