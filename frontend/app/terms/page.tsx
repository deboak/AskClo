import Link from "next/link";
import { Brand } from "@/components/brand";
import "../legal.css";

const sections = [
  ["agreement", "Agreement"], ["service", "The service"], ["accounts", "Your account"],
  ["subscriptions", "Subscriptions"], ["content", "Content and AI"], ["conduct", "Acceptable use"],
  ["availability", "Availability"], ["liability", "Disclaimers"], ["ending", "Ending use"],
  ["law", "Law and contact"],
];

export default function TermsPage() {
  return (
    <main className="legalPage">
      <nav className="shell legalNav"><Brand /><Link href="/">Back to AskClo</Link></nav>
      <header className="legalHero"><div className="shell">
        <span>Last updated 25 September 2026</span>
        <h1>Fair terms for styling together.</h1>
        <p>These Terms explain the rules for using AskClo, including subscriptions, AI-generated recommendations and virtual try-ons.</p>
      </div></header>
      <div className="shell legalContent">
        <aside className="legalContents"><strong>On this page</strong>{sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</aside>
        <article className="legalArticle">
          <section id="agreement"><h2>1. Agreement</h2>
            <p>By creating an account, purchasing a plan or using AskClo, you agree to these Terms and our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the service.</p>
            <p>You must be at least 18 and legally able to enter a binding agreement. If you use AskClo for another person or organisation, you confirm that you have authority to accept these Terms for them.</p>
          </section>
          <section id="service"><h2>2. What AskClo provides</h2>
            <p>AskClo provides AI-assisted styling conversations, wardrobe organisation, garment concepts and virtual try-on visualisations. Features and plan allowances may change as the product develops. We will not reduce a paid plan’s core allowance during its current paid billing period without a reasonable service or legal reason.</p>
          </section>
          <section id="accounts"><h2>3. Your account</h2>
            <ul><li>Provide accurate registration information and keep it current.</li><li>Protect your password and devices, and notify us promptly of unauthorised access.</li><li>One person may not create multiple accounts to obtain additional free trials.</li><li>You are responsible for activity performed through your account unless caused by our failure to use reasonable security.</li></ul>
            <p>Free trials are limited by account, verified phone, device and reasonable anti-abuse controls. Suspicious activity may be denied or reviewed.</p>
          </section>
          <section id="subscriptions"><h2>4. Plans, billing and cancellation</h2>
            <p>Plan prices, billing intervals and included try-ons are shown before checkout. Paid subscriptions renew automatically at the stated interval using the payment method authorised through Paystack until cancelled.</p>
            <p>You may cancel from the subscription section. Cancellation stops future renewal and paid access continues until the end of the current paid period unless stated otherwise. Generation allowances do not roll over, have no cash value and cannot be transferred.</p>
            <p>Except where required by law or where AskClo expressly agrees, completed subscription charges are non-refundable. Failed generations marked as failed do not count against the application’s generation allowance, although temporary provider processing may have occurred.</p>
            <p>Taxes, card conversion charges and fees imposed by your bank or payment provider are your responsibility. We may change future prices with reasonable advance notice; a new price applies no earlier than a future renewal.</p>
          </section>
          <section id="content"><h2>5. Your content and AI output</h2>
            <p>You retain rights you have in photographs, messages and garment images you upload. You give AskClo a limited, worldwide licence to host, copy, process and transmit that content only as needed to operate, secure and improve the service and fulfil your requests.</p>
            <p>You confirm that you have permission to upload and process every image you provide, including photographs of other people. Do not upload confidential material or images for which you lack appropriate rights or consent.</p>
            <p>AI responses and images may be inaccurate, incomplete, similar to content generated for others, or may not precisely reproduce fit, fabric, colour, body shape or tailoring. A virtual try-on is inspiration—not a measurement, purchase guarantee or professional tailoring advice. Inspect garments and obtain professional advice before relying on a visualisation for important decisions.</p>
          </section>
          <section id="conduct"><h2>6. Acceptable use</h2>
            <p>You must not use AskClo to:</p><ul><li>Break the law, infringe rights, impersonate another person or deceive others.</li><li>Create sexual, exploitative, hateful, abusive or non-consensual imagery, especially involving minors.</li><li>Probe, disrupt or bypass security, rate limits, subscriptions, free-trial limits or provider safeguards.</li><li>Use automated systems to scrape, overload or resell the service without written permission.</li><li>Upload malware or content that threatens the service or another person.</li></ul>
          </section>
          <section id="availability"><h2>7. Availability and changes</h2>
            <p>We work to keep AskClo available, but AI providers, payment networks, telecommunications services and hosting systems can fail or be unavailable. We may maintain, modify or discontinue features for security, legal, technical or commercial reasons. Where practical, we will communicate material changes affecting paid users.</p>
          </section>
          <section id="liability"><h2>8. Disclaimers and responsibility</h2>
            <p>AskClo is provided on an “as available” basis. To the extent permitted by law, we disclaim implied warranties that the service will always be uninterrupted, error-free or suitable for a particular event, garment or purchasing decision.</p>
            <p>Nothing in these Terms excludes liability that cannot lawfully be excluded. Otherwise, AskClo is not responsible for indirect or consequential loss, loss caused by your misuse, or failures outside our reasonable control. Our aggregate liability relating to a paid service will not exceed the amount you paid AskClo during the six months immediately before the event giving rise to the claim.</p>
          </section>
          <section id="ending"><h2>9. Suspension and ending use</h2>
            <p>You may stop using AskClo at any time and may request account deletion. We may restrict or suspend an account where reasonably necessary to address fraud, security risk, unlawful conduct, serious or repeated breach of these Terms, or non-payment. Where appropriate, we will provide notice and an opportunity to contact us.</p>
            <p>Terms that by their nature should survive—such as payment obligations, ownership, disclaimers and dispute provisions—remain effective after use ends.</p>
          </section>
          <section id="law"><h2>10. Governing law, changes and contact</h2>
            <p>These Terms are governed by the laws of the Federal Republic of Nigeria. Before starting formal proceedings, you and AskClo agree to make a good-faith effort to resolve the issue through written communication. Courts with lawful jurisdiction in Nigeria may hear unresolved disputes.</p>
            <p>We may update these Terms to reflect service, legal or security changes. Material updates will apply prospectively after the revised Terms are posted or otherwise communicated.</p>
            <div className="legalNotice"><p><strong>Questions about these Terms</strong><br /><a href="mailto:info@askclo.com">info@askclo.com</a></p></div>
          </section>
        </article>
      </div>
    </main>
  );
}
