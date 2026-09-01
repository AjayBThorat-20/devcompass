# Regenerate: vhs docs/vhs/demo-config.tape
# Requires: depvora linked globally. Uses only the read-only --show flag
# so it never touches your real stored GitHub token.

Output docs/assets/demo-config.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 420
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "clear"
Enter
Sleep 300ms
Show

Type "depvora config --show"
Enter
Sleep 2s
