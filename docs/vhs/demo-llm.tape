# Regenerate: vhs docs/vhs/demo-llm.tape
# Requires: depvora linked globally, with at least one provider already
# configured (`depvora llm add ...`). Uses only read-only subcommands
# (list, test) so it never touches your real stored provider list.

Output docs/assets/demo-llm.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 560
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "clear"
Enter
Sleep 300ms
Show

Type "depvora llm list"
Enter
Sleep 2s

Type "depvora llm test local"
Enter
Sleep 3s
