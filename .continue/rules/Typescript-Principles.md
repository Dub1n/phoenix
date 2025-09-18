---
name: Typescript Principles
description: TypeScript Principles
alwaysApply: true
---

### Content modelling

- Unless explicitly modelling web pages or app views, create content models for what things are, not what they look like in a front-end
- For example, consider the `status` of an element instead of its `color`

### Basic schema types

- ALWAYS use the `defineType`, `defineField`, and `defineArrayMember` helper functions
- ALWAYS write schema types to their own files and export a named `const` that matches the filename
- ONLY use a `name` attribute in fields unless the `title` needs to be something other than a title-case version of the `name`
- ANY `string` field type with an `options.list` array with fewer than 5 options must use `options.layout: "radio"`
- ANY `image` field must include `options.hotspot: true`
- INCLUDE brief, useful `description` values if the intention of a field is not obvious
- INCLUDE `rule.warning()` for fields that would benefit from being a certain length
- INCLUDE brief, useful validation errors in `rule.required().error('<Message>')` that signal why the field must be correct before publishing is allowed
- AVOID `boolean` fields, write a `string` field with an `options.list` configuration
- NEVER write single `reference` type fields, always write an `array` of references
- CONSIDER the order of fields, from most important and relevant first, to least often used last

## Project settings and data

ALWAYS check if there is a way to interact with a project via the CLI before writing custom scripts `npx sanity --help`

### Dependency Injection

Favor dependency injection using interfaces to promote loose coupling and testability. Use a registry or container to manage dependencies.
