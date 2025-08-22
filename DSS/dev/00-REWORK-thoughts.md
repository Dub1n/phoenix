# Litany

General notes to be turned into a comprehensive idea/concept for what to design

Initial prompt written out before reconsidering the scope: "I want to reduce the context in Claude Code. I think there is excessive info included in the context that is imported from other files both in 'c:\Users\gabri\Documents\Infotopology\VDL_Vault\.claude' and in the AppData .claude folder. Can you see how to reduce the content provided to Claude Code wihtout drastically reducing the efficiency? This might require removing imports (@path.to.file) in CLAUDE.md, making the files more succinct, anything else that you know or can find out from online to make the context provided here more token-efficient."

The DSS rules injector server can be re-worked to be an MCP server that effectively does this:
    - the files are stored/formatted as required by the server, including things like "when to call this file", "recommended next steps/files" and the workflows for what to check etc if it is a workflow document
    - The agent calls the server when necessary (probably most tasks that aren't very simple or already detailed enough for completion)
    - The server provides the required information to the agent, such as workflows/standards etc, or spec/project-specific information.
    - This means that any file can be added to this "easily accessible" file-list.
    - Files can be really small as it is just an MCP call to access them should they be required - no context bloat

This new version of the rules injector server isn't in-itself DSS, it's a tool that incorporates DSS, as such it should be called something else, in this case it will be called Litany.

This MCP should incorporate into Haruspex well - we need to think about whether it should be:
    - embedded in it, so that it is just part of Haruspex and not standalone
    - capable of being called/calling Haruspex with no extra abstraction layers, i.e. it is just using the files in Haruspex (probably the actual repo files as Haruspex doesn't create any except the mermaid and other indexing files)
    - being called with a standardised system, such as an extra JSON file or similar to pass the required files to the MCP in the appropriate way
    - some other integration, likely depending on the scope of this and Haruspex i.e. do they want to be usable in a range of contexts/which contexts, and what would set up the best future-proof integrations framework (what is there already here?? maybe something is already here or can be reused/repurposed)
This also requires thinking about what it actually is that the MCP server needs from its files and what is currently provided by/accessible from Haruspex

The user should have control over what items are added to the MCP server and adding them should be very simple for them. Ideally it would be algorithmic (no LLM) for as much as possible, such as being able to say "I want this file added, and this is its description/when it should be called"

Should the meta-data type information in the files, such as "when to call this file", "recommended next steps" etc, actually be part of the file, or should it be more like there is an MCP file that takes a unique file identifier and pairs it with these parameters for when the MCP server is called? This is based on
    - which files are going to be used in the MCP server -**it won't be all files, just "rule-based" ones, so not codebase files. Haruspex-generated files and other reference files can be included**
    - whether the server requires some setup and/or config files, ideally it would have as little setup and as few config files as possible.
    - what the computational efficiencies of each approach are
    - whether the server is more like a drop-in, doesn't affect your files, type of addin, or if it's more like an integrated into your workflow and files (literally reformatting them) type of system - This needs to be carefully considered too

The method of updating/adding files to be used should be as automatic as possible, first by algorithm then by LLM, i.e. when calling the MCP which then runs the script, it might check for changes to the references/links and update them before providing a response

Once the MCP tool itself has been reconsidered and perhaps reworked, we will need to think about what DSS rules should be included, what claude files, if part of the CLAUDE.md should be extracted to another file etc.

We need to make sure that the tool will actually be called when appropriate, it's easy for the agent to not use a tool even when they should.

There are currently 2 tools provided by the server - get_dss_rules and list_available_rules. We need to think about whether this is how it should stay but be optimised or if consolidating them or even adding other tools would be a good idea. Tools themselves are a useful feature as they are token-efficient (I think, but CHECK THIS, we want to reduce tool usage at the cost of bigger rules etc if tools are expensive on tokens) so should be used where possible. The Agent at the moment never calls list_available_rules - this might be because it is set up badly, like not having any description or a bad one etc, or because it actually isn't necessary

We need to think about whether this has actually got the best structure/format for LLMs- both in terms of tool usage/compatability/integration/intuitiveness, and in terms of the output. Is it actually the correct format for the information, is it provided correctly? It seems on the surface to be ideal - the agent specifies what information it needs, the info is provided with no other irrelevant information. But is it actually doing that correctly? Perhaps the MCP tools are, but the crucial part is that it relies entirely on the contents of the files themselves - this might actually be reworked to be that this responsibility is shared between the two. If the 'meta-data' is lacking or not specific enough or not updated etc then it will lead to a poor output.
    - Maybe the linking of the files and content can be done through a Haruspex style file metadata/linking and index file generation, so that the rules are automatically linked and a workflow file-to-next-relevant-file is procedurally generated without room for error. The worry with this is that it would end up, either in development or in use, being circular in dev/implementation/execution. If this route is chosen, instead of actually re-using the Haruspex components the server could re-use the concepts.

Actually on the note of the Haruspex procedural file organisation, this makes the idea of having this MCP server/tool have its own page in the Haruspex extension view. This would mean that the MCP needs to either be embedded or integrate with Haruspex via some abstraction layer so that it can work separately or via Haruspex. The ideal future plan with Haruspex was to have PCL be "merged" almost - the extension view could take the information from the PCL skins JSON and display it to be interacted with and be a third interaction mode for PCL - This is in fact slightly different from the current Skins approach as that takes other backend info (commands, menu layout etc) and turns it into an interactive CLI, whereas this would be doing the same thing, as such it isn't a Skin but instead acting *as* PCL. This isn't in itself an issue, but from my understanding it means that it would effectively act as an intermediary between the "skin" layer - it takes the skin json info (commands, menu layout), and then routes the input to PCL and routes the output back to it. This would actually mean that skins would still be able to be made for PCL and they would then automatically work for Haruspex's PCL display.
The way this comes back round to the DSS rules injector MCP is that if it can provide its own interaction information (input, output, etc) in the same format as Skin then, should the PCL skin-display in Haruspex be complete, it would be portable into Haruspex seamlessly (big claim but AFAIK true, think about this!)
Maybe if that is the way it works, it could then benefit from the Haruspex auto-formatting and indexing being applied to its files in the way that it defines (it likely wouldn't want to have them formatted/indexed in the exact same way as the codebase files are), but i think this would require yet another abstraction layer for Haruspex unless there was going to be duplicated code- the exception being if the Haruspex functions that perform these can take the required formatting/indexing method/info/whatever as arguments so that the Haruspex function can perform the same but the MCP tool would be able to call them with its own requirements to use them for its needs.
