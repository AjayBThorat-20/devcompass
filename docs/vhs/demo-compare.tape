# Regenerate: vhs docs/vhs/demo-compare.tape
# Requires: depvora linked globally, and two snapshots of the same project
# in ~/.depvora/history.db — one before `depvora fix`, one after.
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
Type "cd /tmp/depvora-docs-demo-fix && clear"
Enter
Sleep 300ms
Show

Type "depvora compare 1086 1087"
Enter
Sleep 3s
