Claude Code Prompts

## design prompt template

/sc:design "" --c7 --think-hard --seq --focus architecture --delegate auto --wave-mode auto --wave-strategy adaptive

## Full-on Analysis

/sc:analyze "" --seq --c7 --think-hard --focus architecture --persona-architect --delegate auto --wave-mode auto --wave-strategy adaptive

## Ultrathink System Design

/sc:design "" --seq --ultrathink --focus architecture --focus testing --scope system --persona-architect --persona-qa --persona-devops --delegate auto --wave-mode auto --wave-strategy adaptive --wave-strategy adaptive

## Documentation

### Roadmaps

#### Complete current phase documentation and knowledge transfer

Great, thank you. Can you now update the Phase doc to mark any tasks completed as completed, add important information discovered/patterns established (if not already documented), fill in the lessons learnd section, and add any other notes that would be of use to future devs. Can you then complete the knowledge transfer step to prepare the next Phase's doc for implementation with the required and useful knowledge from this Phase's implementation

#### Knowledge transfer

great, can you update the the next phase's doc with anything that would be helpful learned here, and update the spec in it based on the actual foundations laid in this phase, so that it can be a seamless transition to working on it without needing to access the this phase's doc

### Change documentation

great, can you now document the changes as per prompts\documentation\change-documentation.md

### Update current working document

Can you update the doc you are working from so that the work you are doing can be picked up in another session?

## Continue in new chat

### 1

could you actually give me a prompt to pass on to the next session that would carry on your work, with enough detail for them to just pick up where you left off

### 2

sorry to stop you here but due to technical limitations work should be continued in a new session. Could you write me a file that I can pass on to you in a new session so that you can pick up where you left off, with all the necessary detail to do so without losing important knowledge or repeated analysis

## Templum

### Implement Templum Fixes

/sc:implement "Use c:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\issue-fix-selector.md to select a task from c:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\dev\templum-active-tasks.md and implement it, ensuring you follow the correct fix-guide. Apply task discovery protocols (TODO tags during implementation + architectural discovery during analysis). Upon completion, update roadmap status if phase completion criteria are met and follow enhanced documentation checklist sections for Architectural Pattern Analysis and Implementation Tracker Integration." --type feature --c7 --think --safe-mode --validate

### Complete Documentation

great, thank you for that. As a final validation can you run the 'node C:/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/validation/verify-fix.js <component-name>' for any affected files if you haven't already. Then can we update the docs if they need updating: are there any additions/updates to be made to the patterns doc c:\Users\gabri\Documents\Infotopology\VDL_Vault\Haruspex\dev\haruspex-patterns.md or is it all good to go for any future dev? Are there any remaining updates to the active-tasks doc that need completing? (there might not be any, I'm just checking)

### Maintenance

#### Archive-Maintenance

/sc:workflow "Follow the guide in C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\maintenance\archive-maintenance.md to cleanup the maintenance documents for Templum ('C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\')" --focus architecture --c7 --think

#### Task-Discovery

/sc:implement "Follow the guide in C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\maintenance\task-discovery.md for the Templum project ('C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\')" --focus architecture --c7 --think

#### Dependency-Analysis

/sc:implement "Follow the guide in C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\maintenance\dependency-analysis.md for the Templum project ('C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\')" --focus architecture --c7 --think

#### Task-Maintenance

/sc:implement "Follow the guide in C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\maintenance\task-maintenance.md for the Templum project ('C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\')" --focus architecture --c7 --think

#### Pattern-Consolidation

/sc:implement "Follow the guide in C:\Users\gabri\Documents\Infotopology\VDL_Vault\prompts\documentation\maintenance\pattern-consolidation.md for the Templum project ('C:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\')" --focus architecture --c7 --think-hard --seq

## Idea Generation

I want to enable Claude Code to get an outline of any document in the same way that a user would in Cursor/VSCode with the Outline view - showing a list of headings/subheadings in order (maybe with filters and sorting but that can come later). It would also need to have the corresponding line numbers. My current idea is an MCP tool but initially just an API call would be enough to test it. Can you think of the optimal solution to this and the ideal structure for it - it needs to work seamlessly with Claude Code as other MCPs do, and know when and how to use it (which is basically what an MCP is for anyway). - are there any other requirements it should have/other features that would provide decent benefit while staying within the general ballpark of what this tool is trying to do and that don't add much complexity? Your output should be a markdown file going over the choices, reasoning, and overall architecture/dataflow/references/alternatives (there might be a tool/something that can be used out there already), pitfalls, and anything else needed to give me a good understanding of what this would entail and how to develop it.

1. Think if there are any pre-existing solutions to this problem or any tools that can be integrated into an MCP server that achieve this easily
2. Perform a web search for those same criteria
3. Use Context7 for references/patterns/anything else that would be useful for designing this
4. Use sequential thinking to formulate a comprehensive knowledge of the requirements, possible solutions, pros/cons of them, reasoning, final choice, implementation requirements of that choice, and anything else needed to develop it
5. Document these thoughts and findings in a wellstructured and useful document - it should be to my technical level: architectural assistant, here's a similar style that you might want to adopt elements of: "when explaining technical concepts, act as an expert systems architect. begin with a simple, high-level analogy. structure your explanation by breaking the concept down into its constituent parts or scales of application. prioritize solutions that are idiomatic, efficient, and maintainable, always highlighting the trade-offs between different approaches. conclude your response with a "blockers & follow-ups" section to anticipate future challenges and suggest next logical steps. maintain a concise, technical, and slightly dry tone."

-- needs to be made generic

### Sync documentation

c:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\dev\templum-tracker-data.md and c:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\dev\templum-fix-planning.md have both been updated when fixes were made. Those fixes are logged here: c:\Users\gabri\Documents\Infotopology\VDL_Vault\Templum\dev\fixes\ . Can you see if there are any lessons learned or architectural/type/pattern/other changes/implementations/things established in the fixes that have been applied so far that affect the remaining unfixed/queued items and update their sections with the necessary iformation to ensure that they aren't working with misaligned or outdated information

### Alternative Configurations

  For Maximum Analysis (Complex Issues):
  /sc:implement --type feature --c7 --think-hard --seq --all-mcp --validate

  For Speed-Optimized (Simple Fixes):
  /sc:implement --type feature --c7 --uc --no-mcp

  For Iterative Development:
  /sc:implement --type feature --c7 --think --safe-mode --loop --interactive
