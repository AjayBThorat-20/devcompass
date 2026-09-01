# Regenerate: vhs docs/vhs/demo-fix.tape
# Requires: devcompass linked globally, and a fresh demo project at
# /tmp/devcompass-demo-fix with real vulnerable dependencies (axios@0.21.1,
# lodash@4.17.15, minimist@1.2.5) — re-copy from /tmp/devcompass-demo before
# each run since `fix` actually mutates package.json/node_modules

Output docs/assets/demo-fix.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 900
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/devcompass-demo-fix && clear"
Enter
Sleep 300ms
Show

Type "devcompass fix"
Enter
Sleep 6s
Type "y"
Sleep 500ms
Enter
Sleep 28s
