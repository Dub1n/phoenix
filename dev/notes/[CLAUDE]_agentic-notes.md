Refactor regularly & comment for AI

Every few hours or days, I do a refactor pass. Without it, you can end up with bloated files — I've had files hit 3,000+ lines just because AI kept appending code.

Refactoring into smaller files:

    Makes the code easier for AI to work with (smaller context).

    Saves tokens.

    Speeds up development.

I also add lots of comments, even if they're more for AI than for me. After a few days, you can forget why you wrote something, but if AI sees good in-file documentation, it can immediately understand and work with it.

have the agent check if more information is needed before continuing and ask for it if so, then repeat the prompt with the same tags as before (so it doesn't lose things like /sc:build, --seq, or --think-hard)

Add to any custom commands a step like "Please re-read the contents of .claude/CRITICAL_COLLABORATOR.md and confirm that you will adhere to its principles for the remainder of this session." This provides a quick way to reset the AI's behavior without clearing the entire chat history
