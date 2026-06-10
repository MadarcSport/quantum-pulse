import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Quantum Pulse",
  description: "Privacy policy for Quantum Pulse.",
};

const sectionStyle = {
  margin: "0 0 22px",
} as const;

const headingStyle = {
  margin: "0 0 10px",
  fontSize: 20,
  color: "#e2e8f0",
} as const;

const paragraphStyle = {
  margin: "0 0 10px",
  lineHeight: 1.7,
  color: "#cbd5e1",
} as const;

const listStyle = {
  margin: "0 0 10px 18px",
  padding: 0,
  color: "#cbd5e1",
  lineHeight: 1.7,
} as const;

export default function PrivacyPage() {
  return (
    <main
      style={{
        width: "min(900px, calc(100% - 32px))",
        margin: "32px auto 56px",
        padding: "26px 22px",
        borderRadius: 18,
        border: "1px solid rgba(148, 163, 184, 0.22)",
        background:
          "linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.94) 100%)",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 32, color: "#f8fafc" }}>
          Privacy Policy
        </h1>
        <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.7 }}>
          Effective date: June 10, 2026
        </p>
        <p style={{ margin: "8px 0 0", color: "#94a3b8", lineHeight: 1.7 }}>
          This template is provided for operational use and should be reviewed
          by qualified legal counsel before public launch.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>1. Who We Are</h2>
        <p style={paragraphStyle}>
          Quantum Pulse ("we", "us", "our") provides stock and market-related
          information through this website and related services (the "Service").
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>2. Information We Collect</h2>
        <ul style={listStyle}>
          <li>
            Account information: identifiers from authentication providers,
            including email address and user ID.
          </li>
          <li>
            Usage information: pages visited, interactions, approximate request
            times, and technical diagnostics.
          </li>
          <li>
            Device and network information: browser type, operating system,
            language, IP address, and similar metadata.
          </li>
          <li>
            Cookie and session information used to keep you signed in and
            protect account access.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>3. How We Use Information</h2>
        <ul style={listStyle}>
          <li>Provide, maintain, and secure the Service.</li>
          <li>Authenticate users and prevent abuse or fraudulent activity.</li>
          <li>Diagnose performance issues and improve product quality.</li>
          <li>Comply with legal obligations and enforce our Terms.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>4. Legal Bases (Where Applicable)</h2>
        <p style={paragraphStyle}>
          Where required by law, we process personal information on the basis of
          contract performance, legitimate interests (service security and
          improvement), legal obligations, and consent where specifically
          requested.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>5. Third-Party Services</h2>
        <p style={paragraphStyle}>
          We use service providers to operate the Service, such as:
        </p>
        <ul style={listStyle}>
          <li>Authentication provider: Clerk.</li>
          <li>Infrastructure and hosting provider(s).</li>
          <li>Market data/news providers where applicable.</li>
        </ul>
        <p style={paragraphStyle}>
          These providers may process data under their own privacy notices and
          contractual safeguards.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>6. Data Retention</h2>
        <p style={paragraphStyle}>
          We retain personal information only as long as reasonably necessary
          for account operations, legal compliance, dispute resolution, and
          security obligations. Retention periods may vary by data type and
          applicable law.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>7. Data Sharing</h2>
        <p style={paragraphStyle}>
          We do not sell personal information. We may disclose information to
          service providers, legal authorities when required, or in connection
          with business transfers (such as merger or acquisition), subject to
          legal protections.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>8. International Transfers</h2>
        <p style={paragraphStyle}>
          Your information may be processed in countries other than your own.
          Where required, we apply appropriate safeguards for cross-border data
          transfers.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>9. Your Rights</h2>
        <p style={paragraphStyle}>
          Depending on your location, you may have rights to:
        </p>
        <ul style={listStyle}>
          <li>Access and receive a copy of your personal information.</li>
          <li>Request correction or deletion of personal information.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent where processing is based on consent.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>10. Cookies and Similar Technologies</h2>
        <p style={paragraphStyle}>
          We use necessary cookies and similar technologies for authentication,
          security, and core functionality. If optional cookies are introduced,
          we will update this policy and provide suitable controls where
          required.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>11. Security</h2>
        <p style={paragraphStyle}>
          We use reasonable technical and organizational safeguards to protect
          information. No system is fully secure, and we cannot guarantee
          absolute security.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>12. Children's Privacy</h2>
        <p style={paragraphStyle}>
          The Service is not directed to children under the age threshold set by
          applicable law in your jurisdiction. We do not knowingly collect
          personal information from children in violation of applicable law.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>13. Changes to This Policy</h2>
        <p style={paragraphStyle}>
          We may update this Privacy Policy from time to time. We will revise
          the effective date and provide notice where required by law.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>14. Contact</h2>
        <p style={paragraphStyle}>
          To submit privacy requests, contact us at:
          <br />
          <code>privacy@your-domain.example</code>
        </p>
      </section>

      <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.7 }}>
        See also: <Link href="/terms">Terms of Service</Link>
      </p>
    </main>
  );
}
