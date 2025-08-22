# Demo Markdown File for Formatting

This file contains various formatting issues that the markdown formatter can fix.

##   Inconsistent Header Spacing

Some headers have extra spaces, others don't.

###Table Formatting Issues

|Column 1|Column 2|Column 3|
|---|---|---|
|Data 1|Data 2|Data 3|
|Longer data that needs alignment|Short|Medium length data|

##List Formatting Problems

-   Inconsistent list spacing
-   Mixed list markers
  *   Nested items with different markers
  +   Another nested item
-   Trailing spaces in list items   
-   Inconsistent indentation

##Whitespace Issues

This paragraph has    multiple    spaces    between    words.

This line has trailing spaces.   
This line has tabs	and	spaces	mixed.

##Link and Reference Issues

[Broken link](broken-link.md)
[Relative link](./relative-file.md)
[External link](https://example.com)

##Code Block Issues

```python
def badly_formatted_function(  param1,param2,param3  ):
    if param1==True:
        print("This code has spacing issues")
    return param1+param2
```

##Blockquote Issues

> This blockquote has inconsistent spacing
>   And this line has extra indentation
>This line has no space after >

##Mixed Content Issues

1.   Numbered list with extra spaces
2.   Another numbered item
   -   Mixed with bullet points
   -   And inconsistent indentation

##End of File Issues

This is the last line with trailing spaces.   

Multiple empty lines below:




##Summary

This file demonstrates:
-   Inconsistent spacing
-   Mixed list markers
-   Table alignment issues
-   Header spacing problems
-   Whitespace inconsistencies
-   Code formatting issues
-   Mixed content structure

## Unbold Headers Demo Section

### Before (Problematic Format)
# **Bold Main Header**
## *Italic Section Header*
### **Mixed *emphasis* Header**
#### **Complex **Nested** Bold** Header
##### *Simple Italic Header*
###### **Bold Level 6 Header**

### After (Expected Result)
# Bold Main Header
## Italic Section Header
### Mixed emphasis Header
#### Complex Nested Bold Header
##### Simple Italic Header
###### Bold Level 6 Header

## Emoji Substitution Demo Section

### Before (Problematic Emoji Usage)
This section demonstrates emoji usage that can cause readability issues in monospace fonts:

#### Status Indicators
- ✅ Task completed successfully
- ❌ Task failed with error
- ⚠️ Warning about potential issues
- ℹ️ Information note for users

#### Progress Tracking
- 🔥 Hot priority item
- ⭐ Important milestone reached
- 💯 Perfect score achieved
- 🎯 Target hit successfully

#### Actions and Tools
- 🔧 Fixing technical issues
- ⚙️ Configuring system settings
- 🛠️ Building new features
- 🔍 Searching for solutions

#### Navigation and Flow
- ➡️ Next step in process
- ⬅️ Previous step
- ⬆️ Move up in hierarchy
- ⬇️ Move down in hierarchy
- 🔄 Repeat the cycle
- ⏸️ Pause for review

#### File and Code Context
- 📁 Working in project directory
- 📂 Opening subfolder
- 📄 Reading documentation
- 💾 Saving progress

#### Time and Communication
- ⏰ Time-sensitive task
- 💬 User feedback received
- 💭 Internal discussion needed
- 📢 Important announcement

### After (Expected Result with Emoji Substitution)
This section demonstrates emoji usage that can cause readability issues in monospace fonts:

#### Status Indicators
- ✓ Task completed successfully
- ✗ Task failed with error
- ⚠ Warning about potential issues
- i Information note for users

#### Progress Tracking
- * Hot priority item
- * Important milestone reached
- % Perfect score achieved
- ⊕ Target hit successfully

#### Actions and Tools
- ◦ Fixing technical issues
- ⌘ Configuring system settings
- ◦ Building new features
- ⌕ Searching for solutions

#### Navigation and Flow
- → Next step in process
- ← Previous step
- ↑ Move up in hierarchy
- ↓ Move down in hierarchy
- ⇔ Repeat the cycle
- ‖ Pause for review

#### File and Code Context
- ⚇ Working in project directory
- ⍥ Opening subfolder
- □ Reading documentation
- □ Saving progress

#### Time and Communication
- ⋯ Time-sensitive task
- " User feedback received
- ` Internal discussion needed
- ! Important announcement

### Configuration Options
The emoji substitution rule can be configured to enable/disable specific emoji categories:
- Success/Error marks (✓, ✗, etc.)
- Warning symbols (⚠, ⚡, etc.)
- Information indicators (i, *, etc.)
- Progress indicators (*, %, etc.)
- Action tools (◦, ⌘, ⌕, etc.)
- Navigation arrows (→, ←, ↑, ↓, etc.)
- File symbols (⚇, ⍥, □, etc.)
- Time indicators (⋯, etc.)
- Communication symbols (", `, !, etc.)
- Miscellaneous symbols (⌂, ⊎, ⏼, etc.)
