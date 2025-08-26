# Contributing to TalkWave

Thank you for your interest in contributing to TalkWave! We welcome contributions from the community.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/TalkWave.git
   cd TalkWave
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Add your Firebase configuration
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🛠️ Development Guidelines

### Code Style
- Follow ESLint and Prettier configurations
- Use TypeScript with strict type checking
- Follow React best practices and hooks guidelines
- Maintain consistent naming conventions

### Architecture
- Follow the established clean architecture pattern
- Keep components focused and reusable
- Use custom hooks for business logic
- Implement proper error boundaries

### Testing
- Write unit tests for new features
- Test components with React Testing Library
- Ensure all tests pass before submitting PR

### Firebase Integration
- Use Firebase Realtime Database for real-time features
- Implement proper security rules
- Optimize database queries and listeners
- Handle offline scenarios gracefully

## 📝 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all checks pass

## 🐛 Bug Reports

When reporting bugs, please include:
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser/device information
- Console errors (if any)
- Screenshots (if applicable)

## 💡 Feature Requests

For feature requests, please:
- Check if the feature already exists
- Provide a clear use case
- Explain the expected behavior
- Consider implementation complexity

## 📋 Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed

## 🎯 Priority Areas

We're particularly interested in contributions for:
- Real-time messaging features
- UI/UX improvements
- Performance optimizations
- Firebase integration enhancements
- Mobile responsiveness
- Accessibility improvements

## 📞 Questions?

Feel free to open an issue for questions or join our discussions!

Thank you for contributing to TalkWave! 🌊
