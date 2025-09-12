# subagent-operation

## Related Documents

Agent feedback forms: .claude\workflows\workflow-feedback\

Initial README: .claude\agents\README.mdc

Prompt templates: .claude\agents\prompts

Template index + chain examples: .claude\agents\prompts\index.mdc

Workflow commands: .claude\commands\agent (compact, full, and medium)
So far the compact was used to deliver a fast and efficient sequential task completion and the full has been used for several high complexity tasks successfully with proper instructions in the user prompt; without instructions in the user prompt for the full command the agent ignores the agent delegation system.

## Parallel Optimisation

Prompt required to action parallel Task tool calls: Run multiple Task invocations in a SINGLE message

### Initial Assessment

Also as my example below demonstrated, even if there are multiple parallel chains, an initial assessment can be performed by one agent to get a comprehensive view of the system prior to any detailed analysis or validation. In this case the Analysis Agent was used and provided a handoff that was used by all of the validation agents in the next stage - this means there is a ground truth that the other agents can work from and refer to

### Bottlenecks

Some agents take a long time to finish their tasks in parallel sections of the chain - this means that the rate is limited by the agents that take ages to complete their task. This can be assisted in part by ensuring they all have a strict timeout on any bash commands and use efficient tool calls like always using the find tool rather than bash tool to find files or strings, but also work is needed to find out how to ensure that the agent knows to not spend too long on their task and either try to wrap things up or exit the Task with a note to the orchestrator, or something else that enables the chain to progress faster. One of the validation agents, for instance, was running a command repeatedly that was consistently timing out after 3m or 2m, without doing some other thinking or reading the code in between - this is only going to add time that isn't needed when they could be running the commands with short timeouts after the first one that times out if they need to run the script more.

### Intial Architectural Work

Depending on the task, there might be some initial re-architecturing required before implementing parallel fixes - in the case of the validator system (example below), there might have been some room for reworking the scope argument - maybe it could have been handled by the core script rather than the validator scripts. This would result in a better overall architecture of the validation system *and* make the subsequent stages far quicker. This is an area that the chain engineer needs to consider when decomposing a prompt requirements. In my prompt, I didn't specify that the system had to maintain its current architecture, but the method I proposed suggested that all the changes should apply to the core and validators separately rather than allowing some changes *between* them

### Smart Batch Allocation

Note on parallel optimisation: if enough chains are happening in parallel, validation agents can be called in the same batch as execution agents to validate the previous batch's implementations. An example would be:

with smart batch allocation: 10 chains + max 9 concurrent agents:

9 analysis > 1 analysis + 8 execution > 2 execution + 7 validation > 3 validation + 6 documentation > 4 documentation
Total Tool messages: 5

without smart batch allocation: 10 chains + max 9 concurrent agents:

9 analsyis > 1 analsysis > 9 execution > 1 execution > 9 validation > 1 validation > 9 documentation > 1 documentation
Total Tool messages: 8

As the number of steps and/or iterations increases, the time saved increases. In this case almost doubling efficiency

## Chain Analysis Examples

### Pattern Frontmattet Formatting

/pr:workflow-full The following task needs to be made as a task in the templum task tracker as per standard requirements, then executed utilising parallel subagents with the Task tool, delegating one pattern file to each agent. You might want to do a few sample files first to ensure that it does it right before deploying the rest. Start with reading '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/.claude/agents/README.mdc' for general subagent guidelines and for templates and chain guidance, then use sequential thinking to work out the requirements and how you to design a chain to meet them. '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/.claude/agents/prompts/index.mdc' "'/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/Templum/dev/patterns'\ This contains all the patterns for the Templum project. '/mnt/c/Users/gabri/Documents/Infotopology /VDL_Vault/Templum/dev/patterns/advanced-compatibility-validation.md' has had the frontmatter correctly formatted. All of the remaining pattern files need to be reformatted if they are using the old style, extracting the required fields and removing the unneeded ones, and for any in the new style that don't have all the fields or aren't filled in, those fields need to added/filled in (except date_created and last_updated: if there isn't any information in the file then don't make it up to fill it out). some of the frontmatter will be able to be filled out just from reading that file, but some might need reading other files to cross-reference information. The agent doing this should use the search tool on the patterns folder to find keywords in other documents and read those patterns to see if they are related. Two patterns aren't necessarily related if they are in the same category, this is not simply "if it contains the same word it is related"."

### Validation Script Parallel Fixes

/agent:workflow-full is running… start by working out an orchestration plan - what is your chain going to look like (see '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/.claude/agents/prompts/index.mdc' for reference) and read '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/.claude/agents/README.mdc' for more guidance. Once you have that all worked out with sequential thinking, proceed with the plan (which should mostly consist of you delegating and them performing, you only need to read files on how to orchestrate the plan, when the agent tells you there is a problem with the chain, or when the task is finished.)
"Create and update a task in the task tracker when appropriate. '/mnt/c/Users/gabri/Documents/Infotopology/VDL_Vault/scripts/validation/README-ValidationSystem.md' The validation system need comprehensive testing to ensure that it functions correctly.

My suggested chain would involve:

1. An initial Analysis Agent to gather all the required information for the validation agent - this Analysis Agent should just be reading the files and maybe finding out the exact commands necessary to use the script, *not* anything thorough like analysis. They would then leave a handoff document where the validation agents can pick up.\
2. Batch deploying several (might as well be the most you can do in one go) agents perform
analysis/validation, each testing a different category, using the handoff from the analysis so as to  not need to do that themselves. they try it out with different scopes and check whether it performs correctly; questions they need to address: Are the validators doing what they say they do (there is no written information on this and it is up  to whoever writes the validators what goes in them, but it should be obvious if it is doing something different)? Do the results from them contain the all the correct information and no incorrect information? Does the scope work as it should? The script should *not* be validating anything outside the project unless specified in the scope (or the validator) and should never be outside the scope. If, for instance, the scripts says that the project isn't compatible with the validator - is that the case? should it be saying that? why is it saying that? the agent should ask itself these questions every time there is an error output from the script that isn't for something obvious like not providing an argument or a missing field in the project-valconfig.josn - use Sequential Thinking for these diagnostic stages. they inspect the code to diagnose the source of any issues. They write a separate handoff document for each of the two areas that might have issues: the core script functionality, and the validator itself for the category they tested (no need to write either if that area doesn't have issues). You will want to write a reusable template for this - see the index.
3. Batch deploy enough execution agents to implement the fixes that are detailed in the handoff documents - one agent should handle *all* of the core script functionality and then the validator scripts that need fixing should each be updated by one agent. They write handoffs.
4. Batch deploy validation agents to validate the fixes that the execution agent implemented. If the fixes is successful, they can end the chain there, writing a validation report handoff for the documentation agent.. If not, then they should leave a handoff document and tell you that there needs to be more analysis or fixes performed. They could perform quick analysis to determine what the source of the remaining issues is, so that it can go straight to the implementation by the execution agent in the next stage.
5. Repeat 3+4 if necessary.
6. Have a Documentation agent go through all of the validation agents handoff files and create a
fixed document as per the command guidelines in line with the Templum project task management."
You will want to perform sequential analysis to consider this thoroughly and have a good plan to
execute - there should be enough flexibility to adapt to unexpected issues, blockers, bottlenecks, and conflicts between agents. The suggested chain *should* prevent conflicts between subagent areas of interest but it might not have considered all the variables, and they won't be known until the task is underway.
**In order to batch deploy subagents you need to run multiple Task invocations in a SINGLE message**

## Chain Engineer Agent

- perform analysis of all the chain design documents and guides, basically what the main agent does with the worflow command and the agent/README.md and the agents/prompts/index.md.
- work out the requirements from the user's initial prompt, reading any files (markdown, code files etc) and use the bash tool if script running is needed for an initial assessment
- perform the middle planning stages (these need to be worked out - what is actually happening when the chain is formulated)
- present the final chain to the main agent

They should heavily use sequential thinking at appropriate stages - i.e. after reading the chain/workflow guides and after initial assessment of the prompt requirements

This agent should be using Opus rather than sonnet
