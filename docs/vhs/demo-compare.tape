# Regenerate: vhs docs/vhs/demo-compare.tape
# Requires: devcompass linked globally, and two snapshots of the same project
# in ~/.devcompass/history.db — one before `devcompass fix`, one after.
# Snapshot IDs below are specific to this recording; substitute your own.

Output docs/assets/demo-compare.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 560
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/devcompass-docs-demo-fix && clear"
Enter
Sleep 300ms
Show

Type "devcompass compare 1086 1087"
Enter
Sleep 3s
