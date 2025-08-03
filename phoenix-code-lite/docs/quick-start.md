# Phoenix-Code-Lite Quick Start Guide

Get up and running with Phoenix-Code-Lite in under 5 minutes.

## Step 1: Installation

```bash
npm install -g phoenix-code-lite
```

## Step 2: Initialize Project

```bash
cd your-project-directory
phoenix-code-lite init
```

## Step 3: Your First Generation

```bash
phoenix-code-lite generate --task "Create a function that calculates the area of a circle"
```

## Step 4: Review Results

Phoenix-Code-Lite will generate:

- Implementation file (`circle-area.js`)
- Test file (`circle-area.test.js`)
- Documentation
- Quality report

## Step 5: Customize Configuration

```bash
# For production-ready code
phoenix-code-lite config --template enterprise

# For learning and experimentation
phoenix-code-lite config --template starter

# For speed-optimized workflows
phoenix-code-lite config --template performance
```

## Next Steps

1. **Explore examples**: Try generating different types of code
2. **Read the full user guide**: Learn about advanced features
3. **Customize configuration**: Adjust settings for your workflow
4. **Review audit logs**: Analyze your development patterns

## Need Help?

```bash
phoenix-code-lite help --contextual
```

Happy coding!
