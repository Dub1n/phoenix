# CLI Design for Templum

## New Design 2.1 Display

### New Main Menu

```terminal
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             Templum                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│   Connect and interact with your Backend Services                                               │
│                                                                                                 │
│ › Backend Services - View and manage connected backend services                                 │
│   Execute Commands - Run commands on connected backends                                         │
│   System Status - View system health and configuration                                          │
│   Settings - Configure Templum behavior                                                         │
│                                                                                                 │
│   ───────────────────────────────────────────────────────────────────────────────────────────   │
│   Back                                                                                          │
│   Home                                                                                          │
│   Help                                                                                          │
│   Exit                                                                                          │
│                                                                                                 │
│                                                                                                 │
│                                                                                                 │
│                                                                                                 │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### New Backend Services

```terminal
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             Templum                                             │
│┌────────────────────────────────────────────────────────────────────────────────────────────────┴┐
││                                        Backend Services                                         │
│├─────────────────────────────────────────────────────────────────────────────────────────────────┤
││   Manage connections to a backend service                                                       │
││                                                                                                 │
││ › Connected Services        - Show all currently connected backend services                     │
││   Refresh Service Discovery - Scan for new backend servicres                                    │
││   minimal-example           - Healthy                                                           │
││   haruspex                  - Disconnected Not available                                        │
││   pcl                       - Disconnected Not available                                        │
││   litany                    - Disconnected Not available                                        │
││                                                                                                 │
││   ───────────────────────────────────────────────────────────────────────────────────────────   │
││   Back                                                                                          │
││   Home                                                                                          │
││   Help                                                                                          │
││   Exit                                                                                          │
││                                                                                                 │
└┤                                                                                                 │
 │                                                                                                 │
 └─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### New List Connected Services

```terminal
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             Templum                                             │
│┌────────────────────────────────────────────────────────────────────────────────────────────────┴┐
││                                        Backend Services                                         │
││┌────────────────────────────────────────────────────────────────────────────────────────────────┴┐
│││                                      Connected Services                                         │
││├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│││                                                                                                 │
│││   ┌——————───────————┬──────────────┬──────────┬────────────────────────────────────────────┐    │
│││   │ Service         │ Status       │ Response │ Description                                │    │
│││   ├─────────────────┼──────────────┼──────────┼────────────────────────────────────────────┤    │
│││   │ haruspex        │ Disconnected │ N/A      │ analysis, prediction                       │    │
│││   │ pcl             │ Disconnected │ N/A      │ tdd-workflow, testing                      │    │
│││   │ litany          │ Disconnected │ N/A      │ context-management, memory-integration     │    │
│││   │ minimal-example │ Healthy      │ N/A      │ None                                       │    │
│││   └─────────────────┴──────────────┴──────────┴────────────────────────────────────────────┘    │
│││                                                                                                 │
│││   ──────────────────────────────────────────────────────────────────────────────────────────    │
│││ › Back                                                                                          │
│││   Home                                                                                          │
│││   Help                                                                                          │
│││   Exit                                                                                          │
└┤│                                                                                                 │
 ││                                                                                                 │
 └┤                                                                                                 │
  │                                                                                                 │
  └─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### minimal-example

```terminal
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             Templum                                             │
│┌────────────────────────────────────────────────────────────────────────────────────────────────┴┐
││                                        Backend Services                                         │
││┌────────────────────────────────────────────────────────────────────────────────────────────────┴┐
│││                                 minimal-example Service Info                                    │
││├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│││   <Description of minimal-example that is included in the skin-defintion>                       │
│││                                                                                                 │
│││   Connection        Healthy                                                                     │
│││   Last Check        2025-09-12T15:38:01.552Z                                                    │
│││   Port              4001                                                                        │
│││   Version           1.0.0                                                                       │
│││                                                                                                 │
│││   ──────────────────────────────────────────────────────────────────────────────────────────    │
│││ › Back                                                                                          │
│││   Home                                                                                          │
│││   Help                                                                                          │
│││   Exit                                                                                          │
│││                                                                                                 │
└┤│                                                                                                 │
 ││                                                                                                 │
 └┤                                                                                                 │
  │                                                                                                 │
  └─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Execute Command example page

```terminal
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             Templum                                             │
│┌────────────────────────────────────────────────────────────────────────────────────────────────┴┐
││                                        Execute Command                                          │
││┌────────────────────────────────────────────────────────────────────────────────────────────────┴┐
│││                                       minimal-example                                           │
││├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│││   Run a minimal-example command                                                                 │
│││                                                                                                 │
│││   ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│││   │ > type a command                                                                        │   │
│││   └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│││    <Response from the minimal-example server line 1>                                            │
│││    <Response from the minimal-example server line 2>                                            │
│││    <Response from the minimal-example server line 3>                                            │
│││                                                                                                 │
│││                                                                                                 │
│││                                                                                                 │
│││   ──────────────────────────────────────────────────────────────────────────────────────────    │
│││   Back                                                                                          │
└┤│   Home                                                                                          │
 ││   Help                                                                                          │
 └┤   Exit                                                                                          │
  │                                                                                                 │
  └─────────────────────────────────────────────────────────────────────────────────────────────────┘

# or

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              Templum                                            │
│ ┌───────────────────────────────────────────────────────────────────────────────────────────────┴─┐
│ │                                         Execute Command                                         │
│ │ ┌───────────────────────────────────────────────────────────────────────────────────────────────┴─┐
│ │ │                                       minimal-example                                           │
│ │ ├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ │ │   Run a minimal-example command                                                                 │
│ │ │                                                                                                 │
│ │ │   ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│ │ │   │ > type a command                                                                        │   │
│ │ │   └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│ │ │    <Response from the minimal-example server line 1>                                            │
│ │ │    <Response from the minimal-example server line 2>                                            │
│ │ │    <Response from the minimal-example server line 3>                                            │
│ │ │                                                                                                 │
│ │ │                                                                                                 │
│ │ │                                                                                                 │
│ │ │   ──────────────────────────────────────────────────────────────────────────────────────────    │
│ │ │   Back                                                                                          │
└─┤ │   Home                                                                                          │
  │ │   Help                                                                                          │
  └─┤   Exit                                                                                          │
    │                                                                                                 │
    └─────────────────────────────────────────────────────────────────────────────────────────────────┘

```

The > is full colour when the textbox is selected and greyed out when the menu items are selected
The type a command is greyed out until the user types and then it goes away until returned to that menu
This Design 2.1 does not have a textbox below the Window and when input is need it is in the appropriate location in the window itself (similarly positioned to how it is in the 1.0 design)

### New Design 2.1 Spec

Naming Convention is not case specific - can be lowerCase or CapitalisedCasing etc.

- Window: The rectangular boxes with outside corners (or implied outside corners) that constitute the interface other than the "TextBox". The "Window" includes its border
  ┌─────────────────────────┐
  │                         │  <- this (including the contents) is a window, even if it is partially covered
  └─────────────────────────┘

- WindowBorder: The border around the outside of the window

- WindowTitleBar: The line with whitespace and text between the Window's top border and the border below that

- WindowTitle: The text in the WindowTitleBar

- WindowWidth: The width of the "floating window" including the edge characters
  - ->│ [...] Templum Universal Interface [...] │<- this width

- WindowLength: The number of lines that a window occupies, including the WindowBorder

- Page: The contents of the Window in the main panel - does not incude the border or the WindowTitle

- PageBorder: The border between the WindowTitle and the Page

- PageDescription: The text at the top of the Page that describes the Page's purpose

- Selector: "›" - the selection character

- MenuSeparator: The line above the Back, Home, Help, and Exit options that conforms to the three-character padding rule

- [ ] No emojis - just remove them by hand, *don't* write any script or code to do this.
- [ ] WindowWidth is set to the minimum width required to display the widest contents of any "Page" with 3 character padding between the contents and the border
- [ ] The WindowTitle is centred in the WindowTitleBar
- [ ] The TextBox moves (by adding whitespace before its three lines' contents) to match the x-position of the current Window
- [ ] There are always 3 whitespace characters between the WindowBorder and the Page contents except for the "Selector" character which goes in the middle character's space
- [ ] There is a whitespace line between the PageDescription and the rest of the Page's contents
- [ ] There are no pages that say "Press Enter to continue..." - they all will have the Back, Home, Help, and Exit options (including the homepage but the Back and Home are greyed out here)
- [ ] There is a whitespace line between the page contents and the MenuSeparator
- [ ] When navigating through menus, if the page contents are a menu (or contain menu options) the Selector behaves as though items above and below the MenuSeparator are in the same menu
- [ ] There is no Status/Connection and Health separation: If connected, it will display the health, and if disconnected it will display "Disconnected"
- [ ] Pressing Exit actually needs to exit and return the user to the terminal, currently it says Interactive session ended \n Session history: _ interactions recorded
  - The user has to press Ctrl+C to exit again for it to say "Templum CLI shutting down..."
  - If user presses Ctrl+C, the TextBox should change text to say "Press Ctrl+C again to shut down Templum CLI" and it fully shuts down
  - If the user selects Exit from the menu, the text that said "Exit" now says "Press Enter again to shut down Templum CLI" and on pressing enter a second time it fully shuts down
- [ ] The paths between pages and the menu items that point there cannot be hardcoded - this information is able to be taken indirectly from the skin definition - as such there is no need to say "this button leads to this page when in this page"
  - It might be the case now but the Templum Menu should operate in the same way a backend service's menu operates - it has a a SkinDefinition and is interacted with in the same way
- [ ] It needs to actually have a way to swap which Skin it is rendering - currently it can show which backend is present but there is no option to "use" a backend via the CLI, just via the commands
  - The Home page needs to have a rework including each connected backend service will have an item on the Home menu at the top, below the PageDescription and the whitespace line below that
  - This would be a shortcut to their "ServicePage" which has options that include Load Skin, View Service Details, etc.
- [ ] In Backend Services list, the connected services need to be above the disconnected ones, and the connected services are ordered alphabetically and the disconnected services are ordered alphabetically
