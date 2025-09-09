npm run build
node examples/minimal-backend/server.js
node Templum/dist/src/index.js
cd templum && npm run start:cli

## for agent

Bash(cd C:/Users/gabri/Documents/Infotopology/VDL_Vault/Templum && node dist/src/cli-entry.js --status)

## Build Templum

The build command for Templum is:

npm run build

## Run Templum

You can also use related commands:

- npm run dev - Run in development mode with ts-node
- npm test - Run tests
- npm run lint - Run linting
- npm start - Run the built application
- npm run start:cli - Run the CLI entry poin

## File Tree

python scripts\export_tree.py "C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum" --exclude "fixes/" --exclude ".husky/" --exclude ".validation-reports/" --exclude "archive/"

## Power Rename

### To remove the seconds from YYYY-MM-DD-HHmmss

```regex
(?<=\d{4}-\d{2}-\d{2}-\d{2}\d{2})\d{2}(?=-.*\.md)
-> `` empty
```
