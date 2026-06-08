import { useEffect } from 'react';

export default function PrivacyPolicy({ onBack }) {
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
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: June 8, 2026</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>
              Curalink ("we", "us", "our") is an AI-powered medical research assistant. This Privacy Policy explains
              how we collect, use, store, and protect your personal data when you use our platform at{' '}
              <strong>curalink-ten.vercel.app</strong> (the "Service").
            </p>
            <p>
              This policy is drafted in compliance with the <strong>Information Technology Act, 2000</strong> (IT Act),
              the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal
              Data or Information) Rules, 2011</strong> (SPDI Rules), and the <strong>Digital Personal Data
              Protection Act, 2023</strong> (DPDPA) of India.
            </p>
          </section>

          <section>
            <h2>2. Data Controller</h2>
            <p>
              The data controller responsible for your personal data is:<br />
              <strong>Curalink</strong><br />
              Email: <a href="mailto:privacy@curalink.app">privacy@curalink.app</a>
            </p>
            <p>
              For any grievances regarding the processing of personal data, you may contact our Grievance Officer at the
              email address above, in accordance with Section 5(9) of the SPDI Rules.
            </p>
          </section>

          <section>
            <h2>3. Data We Collect</h2>

            <h3>3.1 Account Information</h3>
            <ul>
              <li><strong>Full Name</strong> — provided during registration</li>
              <li><strong>Email Address</strong> — used as your unique login identifier</li>
              <li><strong>Password</strong> — stored only as a cryptographic hash (bcrypt, 12 salt rounds); we never store or can view your plain-text password</li>
            </ul>

            <h3>3.2 Research Session Data</h3>
            <ul>
              <li><strong>Patient Context</strong> — patient name, disease/condition, location, age, and gender that you voluntarily enter for research personalization</li>
              <li><strong>Research Queries</strong> — the medical questions you submit</li>
              <li><strong>AI Responses</strong> — the research results, publications, clinical trials, and AI-generated summaries</li>
              <li><strong>Bookmarks</strong> — research responses you choose to save</li>
            </ul>

            <h3>3.3 Automatically Collected Data</h3>
            <ul>
              <li><strong>Authentication Token</strong> — a JWT (JSON Web Token) stored in your browser's localStorage for session management</li>
              <li><strong>Cookie Consent Preference</strong> — your accept/decline choice stored in localStorage</li>
            </ul>

            <div className="legal-notice">
              <strong>Important:</strong> Curalink does NOT use tracking cookies, analytics pixels, or third-party advertising trackers.
              We do not collect IP addresses, browser fingerprints, or device identifiers for tracking purposes.
            </div>
          </section>

          <section>
            <h2>4. Purpose of Data Collection</h2>
            <p>We process your personal data for the following purposes:</p>
            <ul>
              <li><strong>Account Management</strong> — to create and manage your user account</li>
              <li><strong>Service Delivery</strong> — to provide personalized medical research results based on your queries and patient context</li>
              <li><strong>Session Persistence</strong> — to save your research history so you can continue later</li>
              <li><strong>Authentication</strong> — to verify your identity and protect your data from unauthorized access</li>
              <li><strong>Analytics</strong> — to show you your own usage statistics (research activity, top conditions) — this data is never shared</li>
            </ul>
          </section>

          <section>
            <h2>5. Legal Basis for Processing</h2>
            <p>Under the DPDPA 2023, we process your data based on:</p>
            <ul>
              <li><strong>Consent</strong> — you provide explicit consent by creating an account and entering research queries</li>
              <li><strong>Legitimate Purpose</strong> — processing necessary to provide the Service you requested</li>
            </ul>
          </section>

          <section>
            <h2>6. Data Storage & Security</h2>

            <h3>6.1 Where We Store Data</h3>
            <p>
              All data is stored in <strong>MongoDB Atlas</strong> cloud infrastructure. The database is protected by
              encrypted connections (TLS/SSL), access control lists, and authentication credentials.
            </p>

            <h3>6.2 Security Measures</h3>
            <p>In accordance with the SPDI Rules and Section 43A of the IT Act, we implement the following reasonable security practices:</p>
            <ul>
              <li>Passwords are hashed using <strong>bcrypt</strong> with 12 salt rounds — we cannot read your password</li>
              <li>All API communication uses <strong>HTTPS</strong> encryption in transit</li>
              <li>Authentication via <strong>JWT tokens</strong> with expiry (7 days)</li>
              <li><strong>Rate limiting</strong> on authentication endpoints to prevent brute-force attacks</li>
              <li><strong>Input sanitization</strong> to prevent injection attacks</li>
              <li><strong>User-scoped data access</strong> — you can only access your own sessions and bookmarks</li>
              <li><strong>Security headers</strong> (X-Frame-Options, X-Content-Type-Options, etc.) to prevent common web attacks</li>
              <li><strong>CORS restrictions</strong> — API only accepts requests from the authorized frontend domain</li>
            </ul>
          </section>

          <section>
            <h2>7. Third-Party Services</h2>
            <p>Curalink interacts with the following third-party services to deliver research results:</p>

            <table className="legal-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Data Shared</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Groq API (Llama 3.3-70B)</td>
                  <td>Research query text, patient context, retrieved abstracts</td>
                  <td>AI reasoning and synthesis</td>
                </tr>
                <tr>
                  <td>PubMed / NCBI Entrez</td>
                  <td>Search query terms</td>
                  <td>Biomedical publication retrieval</td>
                </tr>
                <tr>
                  <td>OpenAlex</td>
                  <td>Search query terms</td>
                  <td>Scholarly article retrieval</td>
                </tr>
                <tr>
                  <td>ClinicalTrials.gov</td>
                  <td>Disease name, location</td>
                  <td>Clinical trial search</td>
                </tr>
                <tr>
                  <td>MongoDB Atlas</td>
                  <td>All account and session data</td>
                  <td>Database hosting</td>
                </tr>
                <tr>
                  <td>Vercel</td>
                  <td>Frontend static files</td>
                  <td>Frontend hosting</td>
                </tr>
                <tr>
                  <td>Render.com</td>
                  <td>Backend application code</td>
                  <td>Backend hosting</td>
                </tr>
              </tbody>
            </table>

            <p>
              We do not sell, rent, or trade your personal data to any third party. Data shared with the services
              above is limited to what is necessary to provide the research functionality.
            </p>
          </section>

          <section>
            <h2>8. Your Rights</h2>
            <p>Under the DPDPA 2023 and SPDI Rules, you have the following rights:</p>
            <ul>
              <li><strong>Right to Access</strong> — you can view all your data through the app (sessions, bookmarks, profile)</li>
              <li><strong>Right to Correction</strong> — you can update your profile information</li>
              <li><strong>Right to Erasure</strong> — you can delete individual sessions and bookmarks; contact us at privacy@curalink.app to request full account deletion</li>
              <li><strong>Right to Withdraw Consent</strong> — you can stop using the Service and request deletion of your account and all associated data</li>
              <li><strong>Right to Grievance Redressal</strong> — you may raise grievances with our Grievance Officer at privacy@curalink.app; we will respond within 30 days</li>
              <li><strong>Right to Nominate</strong> — under DPDPA Section 14, you may nominate an individual to exercise your rights in case of death or incapacity</li>
            </ul>
          </section>

          <section>
            <h2>9. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account, all
              associated data (sessions, bookmarks, profile) will be permanently deleted within 30 days.
            </p>
            <p>
              Inactive accounts (no login for 24 months) may be flagged for deletion with prior notice
              to your registered email address.
            </p>
          </section>

          <section>
            <h2>10. Cookies & Local Storage</h2>
            <p>Curalink uses <strong>browser localStorage</strong> (not traditional cookies) for:</p>
            <ul>
              <li><strong>Authentication token</strong> (essential) — to keep you logged in across page refreshes</li>
              <li><strong>Cookie consent preference</strong> (essential) — to remember your consent choice</li>
            </ul>
            <p>
              We do <strong>not</strong> use any third-party cookies, tracking cookies, or analytics cookies.
              All stored data is essential for the Service to function.
            </p>
          </section>

          <section>
            <h2>11. Children's Data</h2>
            <p>
              Curalink is not intended for use by individuals under 18 years of age. We do not knowingly
              collect personal data from minors. If you are a parent or guardian and believe your child has
              provided us with personal data, please contact us at privacy@curalink.app.
            </p>
          </section>

          <section>
            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with
              an updated "Last updated" date. Continued use of the Service after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2>13. Contact Us</h2>
            <p>
              For privacy-related inquiries, data requests, or grievances:<br />
              <strong>Email:</strong> <a href="mailto:privacy@curalink.app">privacy@curalink.app</a><br />
              <strong>Grievance Officer:</strong> Available at the same email address<br />
              <strong>Response Time:</strong> Within 30 days of receiving your request
            </p>
          </section>

          <section>
            <h2>14. Governing Law</h2>
            <p>
              This Privacy Policy is governed by and construed in accordance with the laws of India, including
              the Information Technology Act, 2000, the SPDI Rules, 2011, and the Digital Personal Data
              Protection Act, 2023. Any disputes shall be subject to the exclusive jurisdiction of the courts
              in India.
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
