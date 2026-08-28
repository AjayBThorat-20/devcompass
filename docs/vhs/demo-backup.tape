# Regenerate: vhs docs/vhs/demo-backup.tape
# Requires: devcompass linked globally, and a demo project at
# /tmp/devcompass-docs-demo-fix that already has a backup created by
# `devcompass fix` (backups live in <project>/.devcompass-backups)
# Backup name below is specific to this recording; substitute your own.

Output docs/assets/demo-backup.gif

Set Shell "bash"
Set FontSize 15
Set Width 1160
Set Height 700
Set Theme "Dracula"
Set TypingSpeed 45ms
Set Padding 20
Set Margin 0

Hide
Type "cd /tmp/devcompass-docs-demo-fix && clear"
Enter
Sleep 300ms
Show

Type "devcompass backup list"
Enter
Sleep 2s

Type "devcompass backup restore --name backup-2026-08-28T11-42-31-016Z --force"
Enter
Sleep 3s
