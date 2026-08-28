# Regenerate: vhs docs/vhs/demo-cve.tape
# Requires: devcompass linked globally. Uses only read-only subcommands
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
Type "cd /tmp/devcompass-docs-demo && clear"
Enter
Sleep 300ms
Show

Type "devcompass cve key"
Enter
Sleep 2s

Type "devcompass cve cache --stats"
Enter
Sleep 2s
