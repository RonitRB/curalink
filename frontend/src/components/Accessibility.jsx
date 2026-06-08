import { useEffect } from 'react';

export default function Accessibility({ onBack }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <div className="legal-container">
        <button className="legal-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to App
        </button>

        <div className="legal-header">
          <h1>Accessibility Statement</h1>
          <p className="legal-updated">Last updated: June 8, 2026</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Our Commitment</h2>
            <p>
              Curalink is committed to ensuring digital accessibility for people with disabilities. We are
              continually improving the user experience for everyone, and applying the relevant accessibility
              standards to ensure we provide equal access to all users.
            </p>
            <p>
              This commitment is in line with the <strong>Rights of Persons with Disabilities Act, 2016</strong> (RPwD Act)
              of India, which mandates accessibility of public-facing information and communication technology,
              and the <strong>Guidelines for Indian Government Websites (GIGW)</strong> accessibility standards.
            </p>
          </section>

          <section>
            <h2>2. Conformance Status</h2>
            <p>
              We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> standards.
              These guidelines explain how to make web content more accessible for people with disabilities.
            </p>
            <p>Conformance with these guidelines helps make the web more user-friendly for everyone.</p>

            <div className="legal-notice">
              <strong>Current Status:</strong> We are actively working toward full WCAG 2.1 AA conformance.
              While we strive to adhere to the guidelines, some areas may not yet fully conform. We are
              committed to continuous improvement.
            </div>
          </section>

          <section>
            <h2>3. Accessibility Features</h2>
            <p>Curalink includes the following accessibility features:</p>

            <h3>3.1 Keyboard Navigation</h3>
            <ul>
              <li>All interactive elements (buttons, links, inputs, tabs) are accessible via keyboard</li>
              <li>Tab order follows a logical reading sequence</li>
              <li>Focus indicators are visible on all focusable elements</li>
              <li>Keyboard shortcuts: <kbd>Ctrl</kbd>+<kbd>N</kbd> (New Chat), <kbd>Ctrl</kbd>+<kbd>K</kbd> (Toggle Sidebar)</li>
              <li>Enter key submits forms, Escape closes overlays</li>
            </ul>

            <h3>3.2 Screen Reader Support</h3>
            <ul>
              <li>Semantic HTML structure (header, main, aside, nav, section, article)</li>
              <li>ARIA labels on icon-only buttons and interactive elements</li>
              <li>Role attributes on dynamic content regions</li>
              <li>Alt text and descriptive labels for visual elements</li>
              <li>Live regions for dynamic content updates (toast notifications, loading states)</li>
            </ul>

            <h3>3.3 Visual Accessibility</h3>
            <ul>
              <li>Color contrast ratios meet WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text)</li>
              <li>Information is not conveyed by color alone — icons, text, and patterns supplement color cues</li>
              <li>Text can be resized up to 200% without loss of content or functionality</li>
              <li>The interface remains usable at up to 400% zoom</li>
              <li>Dark color scheme reduces eye strain for extended reading sessions</li>
            </ul>

            <h3>3.4 Motion & Animation</h3>
            <ul>
              <li>Animations are subtle and non-distracting</li>
              <li>No auto-playing video or audio content</li>
              <li>The <code>prefers-reduced-motion</code> media query is respected — animations are disabled for users who prefer reduced motion</li>
            </ul>

            <h3>3.5 Forms & Input</h3>
            <ul>
              <li>All form fields have associated labels</li>
              <li>Error messages are clearly communicated and associated with the relevant fields</li>
              <li>Required fields are marked with visual indicators</li>
              <li>Voice input is available as an alternative to typing (Web Speech API)</li>
              <li>Autocomplete attributes are set on login/registration forms</li>
            </ul>

            <h3>3.6 Responsive Design</h3>
            <ul>
              <li>The application is fully responsive and works on screens from 375px width and above</li>
              <li>Content reflows appropriately without horizontal scrolling at up to 400% zoom</li>
              <li>Touch targets are at least 44×44 pixels on mobile devices</li>
            </ul>
          </section>

          <section>
            <h2>4. Known Limitations</h2>
            <p>
              Despite our best efforts, some parts of the application may have accessibility limitations:
            </p>
            <ul>
              <li><strong>Voice Input</strong> — the Web Speech API is only supported in Chromium-based browsers and may not be available in all environments</li>
              <li><strong>Complex Data Visualizations</strong> — the analytics dashboard charts may have limited screen reader descriptions; we provide text alternatives where possible</li>
              <li><strong>Third-Party Content</strong> — publication abstracts and clinical trial data retrieved from external APIs may not follow accessibility standards</li>
            </ul>
          </section>

          <section>
            <h2>5. Assistive Technologies</h2>
            <p>Curalink is designed to be compatible with the following assistive technologies:</p>
            <ul>
              <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Keyboard-only navigation</li>
              <li>Browser zoom and text-size adjustments</li>
            </ul>
          </section>

          <section>
            <h2>6. Indian Legal Framework</h2>
            <p>This accessibility statement is provided in compliance with:</p>
            <ul>
              <li><strong>Rights of Persons with Disabilities Act, 2016</strong> — Section 42 mandates accessibility of information and communication technology</li>
              <li><strong>Guidelines for Indian Government Websites (GIGW)</strong> — we follow GIGW accessibility recommendations as best practices</li>
              <li><strong>Information Technology Act, 2000</strong> — Section 3A recognizes electronic accessibility requirements</li>
              <li><strong>United Nations Convention on the Rights of Persons with Disabilities (UNCRPD)</strong> — ratified by India, Article 9 mandates ICT accessibility</li>
            </ul>
          </section>

          <section>
            <h2>7. Feedback & Contact</h2>
            <p>
              We welcome your feedback on the accessibility of Curalink. If you encounter any accessibility
              barriers or have suggestions for improvement, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:accessibility@curalink.app">accessibility@curalink.app</a></li>
              <li><strong>Response Time:</strong> We aim to respond within 5 business days</li>
            </ul>
            <p>
              If you are not satisfied with our response, you may escalate to the <strong>Chief Commissioner
              for Persons with Disabilities</strong> or the relevant <strong>State Commissioner for Persons
              with Disabilities</strong> under the RPwD Act, 2016.
            </p>
          </section>

          <section>
            <h2>8. Assessment & Review</h2>
            <p>
              We regularly review our accessibility practices and conduct assessments against WCAG 2.1 standards.
              This statement is reviewed and updated at least annually, or whenever significant changes are made
              to the application.
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <p>© {new Date().getFullYear()} Curalink. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
