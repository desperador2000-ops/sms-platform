export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="text-2xl font-bold text-brand-700">SMS Platform</div>
        <nav className="flex gap-3">
          <a className="btn-secondary">Connexion</a>
          <a className="btn-primary">Inscription</a>
        </nav>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-8">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-500">International SMS</p>
          <h1 className="text-4xl font-bold leading-tight">Réception & gestion SMS mondiale</h1>
          <p className="mt-4 text-slate-600">
            Numéros internationaux, routing fournisseur, webhooks signés, réception temps réel, OTP detection, et facturation internationale.
          </p>
          <div className="mt-6 flex gap-3">
            <a className="btn-primary">Voir le dashboard</a>
            <a className="btn-secondary">Catalogue</a>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold">Vue d’ensemble</h2>
          <ul className="mt-6 space-y-4 text-sm text-slate-700">
            <li>• Twilio, Vonage, Telnyx, Africa’s Talking</li>
            <li>• Webhooks signés et idempotents</li>
            <li>• Inbox multi-pays + recherche plein texte</li>
            <li>• OTP detection + copie rapide</li>
            <li>• Stripe + Flutterwave + multi-devise</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
