# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to the project maintainer. You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We'll acknowledge receipt of your vulnerability report within 48 hours
- **Assessment**: We'll assess the vulnerability and determine its severity within 7 days
- **Fix Development**: We'll work on a fix and keep you updated on progress
- **Disclosure**: Once a fix is available, we'll coordinate disclosure timing with you
- **Credit**: We'll credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices for Users

### API Keys and Secrets

- **Never commit** `.env` files or API keys to version control
- Use environment variables for all sensitive configuration
- Rotate API keys regularly
- Use separate API keys for development and production

### Authentication

- The studio uses JWT tokens for authentication with the Clypra API
- Tokens are stored in `localStorage` - clear them when logging out
- Admin access requires proper JWT token with `isAdmin: true` claim
- Never share your authentication tokens

### Dependencies

- Regularly update dependencies to get security patches
- Review dependency updates for security advisories
- Use `npm audit` to check for known vulnerabilities

### Deployment

- Use HTTPS in production
- Set proper CORS headers in the API
- Enable Content Security Policy (CSP) headers
- Use environment-specific configuration
- Don't expose sensitive endpoints publicly

## Known Security Considerations

### Client-Side Storage

- JWT tokens are stored in `localStorage`
- Consider using `httpOnly` cookies for production deployments
- Clear tokens on logout

### API Integration

- Gemini API calls should go through your backend (already implemented)
- Never expose API keys in client-side code
- Implement rate limiting on API endpoints

### File Uploads

- Validate file types and sizes
- Sanitize file names
- Use virus scanning for user-uploaded content in production

### Cross-Site Scripting (XSS)

- React provides XSS protection by default
- Be cautious with `dangerouslySetInnerHTML`
- Sanitize user input before rendering
- Validate and escape data from external sources

### Admin Access

- Admin routes are protected with JWT authentication
- Filter Lab and MPG Playground require admin privileges
- Verify `isAdmin` claim server-side for sensitive operations

## Dependency Security

We use automated tools to monitor dependencies:

- **Dependabot**: Automatic security updates
- **npm audit**: Regular vulnerability scanning
- **GitHub Security Advisories**: Monitoring for known issues

Run security checks:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated
```

## Security Update Process

1. Security vulnerability reported or discovered
2. Vulnerability assessed and severity determined
3. Fix developed and tested
4. Security advisory published
5. Fix released with patch version bump
6. Users notified via GitHub Security Advisories

## Contact

For security concerns, contact:

- **Email**: [Your security email]
- **GitHub**: [@AIEraDev](https://github.com/AIEraDev)

## Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

_No vulnerabilities reported yet_

---

Thank you for helping keep Clypra Studio and its users safe!
