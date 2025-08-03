1. Have the agents info on a separate page in the Config show menu

2. pressing any button from the config show menu takes the user out of the pheonix cli, as does anywhere else that says "Press Enter to continue..."

3. on entering phoenix code lite CLI the letter "e" is already present

4. The CLI should either be in "menu mode" or "command mode" - the current mode is a mix of the two. The user should be able to choose between them at any point in the Advanced Settings menu.
    - Menu mode would be where the user is presented with a list of options and can select one of them by pressing up and down arrows; it would include the back and home buttons where appropriate. The user can also press a hotkey to move to the input field (terminal basically) where they can type commands. (doesn't change the mode and this would be used for the global commands or any other terminal commands within phoenix). The main menu here would be the options in the main menu except they would be selectable (the same way the options in config>edit are)
    - Command mode would be where the user is presented with a list of commands and their uses, as it is already for a number of menus such as the Template Management menu. The home menu here would be as it is now

5. I like how the submenus stack up such as with:
```
🔥 Phoenix Code Lite Interactive CLI
══════════════════════════════════════════════════
📍 Phoenix Code Lite > Advanced
══════════════════════════════════════════════════

🔧 Advanced Settings
══════════════════════════════════════════════════
```
However, it should be just:
```
🔥 Phoenix Code Lite Interactive CLI
══════════════════════════════════════════════════
🔧 Advanced Settings
══════════════════════════════════════════════════
```
there is no need for the "Phoenix Code Lite > Advanced" menu as this is self-explanatory from the other two lines.

6. repeating the help command should just show the available commands without the 
```
Type "help" for commands, "quit" to exit
══════════════════════════════════════════════════

Phoenix> help
```
so that it's just
```
🔥 Phoenix Code Lite Interactive CLI
══════════════════════════════════════════════════
📖 Available Commands:
══════════════════════════════════════════════════
```
Some pages don't currently have stacking titles, such as the Phoenix Code Lite Configuration Editor.
Perhaps for this to work best, each page would have its own specific predefined title/location that the CLI can use to stack the titles which is based on the overall structure of the CLI, not necessarily how the user got there (i.e. this would stop things like having repeating titles if the user goes from one menu back into the previous one by either pressing back or completing the task in there - this doesn't happen now but I can imagine it might if not implemented correctly)

7. Pressing esc to go back still doesn't work

8. Both the menu mode and the command mode should display a number next to each of the options in their menus, starting with one and going down the list. The user can then press the number assigned to an option to select it (or type and press enter if in command mode)

9. Currently if the user is in templates and selects reset, they are prompted to specify a starter to select but then isn't given the option to. Selecting this option (and also the edit option) should take the user to an edit menu. (in command mode the user can specify which template to edit or reset but this isn't necessary)

10. The debug option in the Advanced Settings menu do not give the option to change the parameters - should they be in a "settings" menu at all? They are editable, so it should be possible to change them.\

11. using the -h or --help subcommand doesn't seem to work any more

12. The user should be presented with the main menu (of whichever they have selected) when they enter the CLI

13. The user should be asked which interaction mode (command/menu modes) they would like when they go through the interactive wizard setup or the init command, whichever they do first and not again (they can always access it in the advanced settings)

14. The user might not know exactly what they are going to be making when first using Phoenix - the Wizard should have a question at the start of something like "Do you know what stack you will be using?" or something like that, and if yes then it goes on with the existing wizard. The existing wizard should also have an "other" option for each of the questions (which has a useful result rather than just adding nothing to the config). The wizard should also end with an overview of the stack that was created and a summary of the config that was created.

15. If the user selected "no" to the first wizard question about "Do you know what stack you will be using?" then they will ask more general questions about the project and store the answers in the config (somewhere appropriate). The template would then be saved as a new "currentproject" (or whatever the best case formatting of this is) template.

16. When in the template menu and selecting "edit <tempplate name> the configuration manager is opened but not for the particular template. This is confusing as it has an option in it called "Templates". Overall the arrangement of menus and options needs to be reevaluated and reworked to make it more intuitive - There should be a useful schematic of the different items so that it can be easily seen what is where and whether anything is duplicated or missing.

17. The documents added to the templates will either be per-agent or global. The user can then decide on a per-template basis which documents are enabled or disabled (in any of the agent or global locations). This means the documents themselves aren't stored and used per-template but are activated per template. [This note applies to the templates system but requires the per-agent documents and editing agents to be implemented first]

## Claude Code Hook Fixed ✅
The TypeScript compiler hook was failing due to nvm4w PATH issues on Windows. Fixed by:
- Adding comprehensive TypeScript detection strategies 
- Handling Windows `.cmd` file extensions properly
- Checking nvm4w specific paths: `C:\nvm4w\nodejs\tsc.cmd`
- Graceful fallbacks with helpful error messages
- Hook now works correctly and catches real TypeScript issues

## TypeScript Configuration Issues Fixed ✅
Fixed the TypeScript compilation errors revealed by the working hook:
- ✅ Installed `@types/node` for Node.js type definitions
- ✅ Updated `tsconfig.json` with proper ES2015+ settings:
  - Added `"DOM"` to lib array
  - Added `"allowSyntheticDefaultImports": true`
  - Added `"moduleResolution": "node"`
  - Added `"allowJs": true`
- ✅ Fixed syntax error in `help-system.ts` (missing semicolon)
- ✅ Build now compiles successfully with `npm run build`

**Status**: All TypeScript compilation issues resolved. Hook is working perfectly and catching real issues.

