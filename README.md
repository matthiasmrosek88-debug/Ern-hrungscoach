# Mein Coach V6 – einfache Einrichtung

Keine Anmeldung und keine Cloud-Datenbank. Die App speichert Profil, Ziele, Gewicht und Ernährung lokal auf dem iPhone (IndexedDB). Über Backup exportieren/importieren kannst du die Daten sichern.

## GitHub → Cloudflare
1. ZIP entpacken.
2. Den Inhalt in ein neues GitHub-Repository hochladen. `wrangler.jsonc`, `package.json`, `src` und `public` müssen direkt im Repository-Stamm liegen.
3. Cloudflare → Workers & Pages → Create/Import repository → Repository auswählen → Deploy.
4. Beim Worker unter Settings → Variables and Secrets das Secret `OPENAI_API_KEY` anlegen.
5. Die workers.dev-Adresse auf dem iPhone in Safari öffnen → Teilen → Zum Home-Bildschirm.

Der Worker wird über `wrangler.jsonc` erkannt. Nur `/api/*` läuft durch den Worker; die Oberfläche wird als Static Assets ausgeliefert.
