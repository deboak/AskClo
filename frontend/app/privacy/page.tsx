import Link from "next/link";
import { Brand } from "@/components/brand";
import "../legal.css";

const sections = [
  ["overview", "Overview"], ["information", "Information we collect"],
  ["uses", "How we use information"], ["sharing", "How information is shared"],
  ["retention", "Retention and security"], ["rights", "Your rights"],
  ["children", "Children"], ["changes", "Changes and contact"],
];

export default function PrivacyPage() {
  return (
    <main className="legalPage">
      <nav className="shell legalNav"><Brand /><Link href="/">Back to AskClo</Link></nav>
      <header className="legalHero"><div className="shell">
        <span>Last updated 25 September 2026</span>
        <h1>Privacy, without the mystery.</h1>
        <p>This policy explains what AskClo collects, why we need it, who helps us process it, and the choices you have.</p>
      </div></header>
      <div className="shell legalContent">
        <aside className="legalContents"><strong>On this page</strong>{sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</aside>
        <article className="legalArticle">
          <section id="overview"><h2>1. Overview</h2>
            <p>AskClo provides AI-assisted personal styling, wardrobe organisation and virtual try-ons. In this policy, “AskClo”, “we”, “us” and “our” refer to the operator of the AskClo service.</p>
            <p>We process personal data fairly, lawfully and transparently, and limit collection to what is reasonably needed to provide, secure and improve the service. This policy is intended to reflect the Nigeria Data Protection Act 2023 and other applicable requirements.</p>
          </section>
          <section id="information"><h2>2. Information we collect</h2>
            <h3>Information you provide</h3>
            <ul><li>Account details, including your name, email address, phone number and encrypted password credentials.</li><li>Style-profile details you choose to provide, such as gender, age or date of birth, body type, style and cultural preferences.</li><li>Profile photographs, wardrobe images, garment descriptions and other images you upload.</li><li>Messages to Clo, styling requests, feedback and generated-look history.</li><li>Subscription details and transaction records. AskClo does not receive or store your complete payment-card number; Paystack processes payment details.</li><li>Communications you send to our support team.</li></ul>
            <h3>Information collected automatically</h3>
            <p>We receive ordinary technical information such as IP address, browser and device characteristics, timestamps, request logs and service diagnostics. For free-trial protection, device and IP signals are converted into keyed hashes before being stored. We also use essential browser storage to maintain your signed-in session and device eligibility.</p>
          </section>
          <section id="uses"><h2>3. How we use information</h2>
            <ul><li>Provide accounts, styling conversations, wardrobe tools and virtual try-ons.</li><li>Personalise recommendations using the preferences and context you provide.</li><li>Verify phone numbers, recover accounts and deliver service messages.</li><li>Process subscriptions, confirm payments and manage plan entitlements.</li><li>Detect abuse, enforce free-trial limits, secure accounts and protect the service.</li><li>Diagnose failures, monitor performance and improve reliability.</li><li>Comply with legal obligations, resolve disputes and enforce our Terms.</li></ul>
            <p>Depending on the context, our lawful bases may include performance of our contract with you, your consent, compliance with law and our legitimate interests in operating and protecting AskClo. You may withdraw consent where processing relies on consent, without affecting earlier lawful processing.</p>
          </section>
          <section id="sharing"><h2>4. How information is shared</h2>
            <p>We do not sell your personal data. We disclose only what is reasonably necessary to service providers acting for us or when the law requires it.</p>
            <ul><li><strong>AI services:</strong> relevant chat content is sent to OpenAI to produce styling responses. Images and prompts selected for generation are sent to fal and its hosted models to create garments and virtual try-ons.</li><li><strong>Payments:</strong> Paystack processes checkout, recurring payments and payment verification.</li><li><strong>Infrastructure:</strong> hosting, database, caching and file-storage providers process application data and uploaded images so AskClo can operate.</li><li><strong>Communications and security:</strong> SMS/email delivery services and Cloudflare Turnstile help verify users, send account messages and prevent automated abuse.</li><li><strong>Legal and safety:</strong> we may disclose information where reasonably necessary to comply with law, court process, protect rights or investigate fraud and security incidents.</li></ul>
            <p>Some providers may process data outside Nigeria. Where applicable, we use contractual and organisational safeguards appropriate to the transfer and the sensitivity of the information.</p>
            <p>We do not use your personal photographs to train our own AI models, and we do not authorise service providers to use them for unrelated advertising.</p>
          </section>
          <section id="retention"><h2>5. Retention and security</h2>
            <p>We keep personal data only for as long as needed for the purposes described above, including while your account is active and for reasonable periods required for security, payment records, dispute resolution and legal compliance. Retention periods vary by data type. Deletion requests may not immediately remove backups or records we are legally required to preserve.</p>
            <p>We use access controls, password hashing, encrypted network connections, rate limits, signed authentication tokens and restricted service credentials. No online system is completely secure, so we cannot promise absolute security.</p>
          </section>
          <section id="rights"><h2>6. Your choices and rights</h2>
            <p>Subject to applicable law, you may ask to access, correct, delete, restrict or obtain a portable copy of your personal data; object to certain processing; or withdraw consent. You may update many profile details directly in AskClo.</p>
            <p>Send requests to <a href="mailto:info@askclo.com">info@askclo.com</a>. We may verify your identity before acting. You may also complain to the Nigeria Data Protection Commission if you believe your rights have not been respected.</p>
          </section>
          <section id="children"><h2>7. Children</h2>
            <p>AskClo is not directed to children under 18. Do not create an account or upload a child’s photograph unless you are legally authorised to do so. If we learn that we collected a child’s personal data without appropriate authority, we will take reasonable steps to remove it.</p>
          </section>
          <section id="changes"><h2>8. Changes and contact</h2>
            <p>We may update this policy as AskClo, our providers or legal requirements change. We will post the revised version here and update the date above. Material changes may also be communicated through the service.</p>
            <div className="legalNotice"><p><strong>Privacy questions or requests</strong><br /><a href="mailto:info@askclo.com">info@askclo.com</a></p></div>
          </section>
        </article>
      </div>
    </main>
  );
}
