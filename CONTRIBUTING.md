# Contributing to Clypra Studio

First off, thank you for considering contributing to Clypra Studio! 🎉

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainer.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed** and what you expected
- **Include your environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List any similar features** in other applications

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Suitable for newcomers
- `help wanted` - Extra attention needed
- `bug` - Something isn't working
- `enhancement` - New feature or request

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Git

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/clypra-studio.git
   cd clypra-studio
   ```

3. **Add the upstream repository**:

   ```bash
   git remote add upstream https://github.com/AIEraDev/clypra-studio.git
   ```

4. **Install dependencies**:

   ```bash
   npm install
   ```

5. **Create a `.env.local` file**:

   ```bash
   cp .env.example .env.local
   ```

   Add your Gemini API key (optional for most development work)

6. **Start the development server**:

   ```bash
   npm run dev
   ```

7. **Run tests**:
   ```bash
   npm test
   ```

### Project Structure

```
clypra-studio/
├── apps/
│   └── studio/          # Main studio application
├── packages/
│   └── clypra-engine/   # Core rendering engine
├── api/                 # API handlers (deprecated - moved to clypra-api)
├── docs/                # Documentation
└── scripts/             # Build and utility scripts
```

## Pull Request Process

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/amazing-feature
   ```

2. **Make your changes** following our coding guidelines

3. **Write or update tests** for your changes

4. **Run tests and linting**:

   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

5. **Commit your changes** using conventional commits:

   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork**:

   ```bash
   git push origin feat/amazing-feature
   ```

7. **Open a Pull Request** on GitHub with:
   - Clear title describing the change
   - Detailed description of what changed and why
   - Screenshots/videos for UI changes
   - Reference to related issues (e.g., "Fixes #123")

8. **Wait for review** - maintainers will review your PR and may request changes

9. **Make requested changes** and push additional commits

10. **Once approved**, your PR will be merged!

## Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Avoid `any` - use proper types or `unknown`
- Export types that might be useful to consumers
- Use `interface` for object shapes, `type` for unions/aliases

### React

- Use functional components with hooks
- Keep components focused and single-purpose
- Use descriptive component names (e.g., `FilterWorkspace` not `FW`)
- Extract complex logic into custom hooks
- Prefer composition over prop drilling

### Styling

- Use Tailwind CSS for styling
- Follow the existing color scheme using CSS variables
- Keep responsive design in mind (mobile-first)
- Use semantic class names for custom CSS

### File Organization

- Group related files in folders
- Keep file names descriptive and kebab-case
- Co-locate tests with implementation files
- Use index files for clean exports

### Performance

- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`
- Use `React.memo` for expensive components
- Lazy load routes and heavy components
- Optimize canvas rendering operations

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
feat(filters): add V2 MPG filter support
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
refactor(engine): optimize canvas rendering pipeline
perf(render): reduce memory usage in compositor
test(filters): add unit tests for filter cache
chore(deps): upgrade @clypra/engine to v2.0.1
```

### Scope

Use the area of codebase affected:

- `auth` - Authentication
- `filters` - Filter system
- `mpg` - MPG pipeline
- `engine` - Core engine
- `ui` - User interface
- `api` - API routes
- `deps` - Dependencies

## Testing

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for complex features
- Use descriptive test names: `it('should apply V2 filter to video frame')`
- Test edge cases and error conditions
- Mock external dependencies (API calls, file system)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Questions?

- Open an issue for discussion
- Reach out to [@AIEraDev](https://github.com/AIEraDev)
- Check existing documentation in `/docs`

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes for significant contributions
- README acknowledgments section (for major features)

---

Thank you for contributing to Clypra Studio! 🚀
