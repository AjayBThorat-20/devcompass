# Regenerate: vhs docs/vhs/demo-cve.tape
# Requires: depvora linked globally. Uses only read-only subcommands
# (key status, cache stats) so it never touches your real stored NVD key.

Output docs/assets/demo-cve.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 620
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/depvora-docs-demo && clear"
Enter
Sleep 300ms
Show

Type "depvora cve key"
Enter
Sleep 2s

Type "depvora cve cache --stats"
Enter
Sleep 2s
