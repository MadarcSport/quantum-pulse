import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Quantum Pulse",
  description: "Terms of service for Quantum Pulse.",
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

export default function TermsPage() {
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
          Terms of Service
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
        <h2 style={headingStyle}>1. Acceptance of Terms</h2>
        <p style={paragraphStyle}>
          By accessing or using Quantum Pulse (the "Service"), you agree to be
          bound by these Terms of Service ("Terms"). If you do not agree, do not
          use the Service.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>2. Eligibility and Accounts</h2>
        <ul style={listStyle}>
          <li>You must provide accurate account information.</li>
          <li>You are responsible for activity under your account.</li>
          <li>
            You must promptly notify us of unauthorized access or security
            issues.
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>3. Financial Information Disclaimer</h2>
        <p style={paragraphStyle}>
          Content provided through the Service is for informational purposes
          only and is not investment, legal, tax, or financial advice. You are
          solely responsible for your investment decisions.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>4. Permitted Use</h2>
        <p style={paragraphStyle}>You agree not to:</p>
        <ul style={listStyle}>
          <li>Use the Service for unlawful or fraudulent activity.</li>
          <li>Interfere with security, integrity, or performance.</li>
          <li>
            Scrape, harvest, reverse engineer, or misuse Service content except
            as permitted by law.
          </li>
          <li>Attempt unauthorized access to systems or accounts.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>5. Third-Party Content and Services</h2>
        <p style={paragraphStyle}>
          The Service may include data, links, and tools provided by third
          parties. We are not responsible for third-party content, availability,
          or policies.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>6. Intellectual Property</h2>
        <p style={paragraphStyle}>
          The Service, including branding, software, and original content, is
          owned by or licensed to us and protected by applicable intellectual
          property laws.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>7. Service Changes and Availability</h2>
        <p style={paragraphStyle}>
          We may modify, suspend, or discontinue any part of the Service at any
          time without liability, including for maintenance, updates, or
          security reasons.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>8. Termination</h2>
        <p style={paragraphStyle}>
          We may suspend or terminate access if you violate these Terms or if
          necessary to protect users, the Service, or legal compliance.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>9. Disclaimers</h2>
        <p style={paragraphStyle}>
          The Service is provided "as is" and "as available" without warranties
          of any kind, whether express or implied, to the extent permitted by
          law.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>10. Limitation of Liability</h2>
        <p style={paragraphStyle}>
          To the fullest extent permitted by law, we are not liable for
          indirect, incidental, special, consequential, or punitive damages, or
          loss of profits, data, or goodwill arising from use of the Service.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>11. Indemnification</h2>
        <p style={paragraphStyle}>
          You agree to indemnify and hold harmless Quantum Pulse and its
          affiliates from claims, liabilities, damages, and expenses arising
          from your use of the Service or breach of these Terms.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>12. Governing Law</h2>
        <p style={paragraphStyle}>
          These Terms are governed by the laws of your selected operating
          jurisdiction. Include venue and governing-law details before launch.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>13. Changes to Terms</h2>
        <p style={paragraphStyle}>
          We may update these Terms at any time. We will revise the effective
          date and provide notice where required by law.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>14. Contact</h2>
        <p style={paragraphStyle}>
          Questions about these Terms can be sent to:
          <br />
          <code>legal@your-domain.example</code>
        </p>
      </section>

      <p style={{ margin: 0, color: "#94a3b8", lineHeight: 1.7 }}>
        See also: <Link href="/privacy">Privacy Policy</Link>
      </p>
    </main>
  );
}
