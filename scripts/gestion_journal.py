import re
from pathlib import Path

ROOT = Path(".")
POINTS = [
    "01-cahier-des-charges",
    "02-conception",
    "03-modelisation-3D",
    "04-materiaux",
    "05-fabrication",
    "06-assemblage",
    "07-essais",
    "08-presentation",
]

def parse_date(body):
    match = re.search(r"DATE:\s*(\d{4}-\d{2}-\d{2})", body)
    return match.group(1) if match else None

def parse_progress(body):
    results = []
    for line in body.splitlines():
        match = re.search(
            r"^\s*-?\s*([0-8]{2}-[a-z0-9-]+)\s*\|\s*(⬜ À démarrer|🟡 En cours|🟢 Terminé|🔴 Bloqué)\s*\|\s*(\d{1,3})\s*%\s*$",
            line,
        )
        if match and match.group(1) in POINTS:
            results.append((match.group(1), match.group(2), int(match.group(3))))
    return results

def update_history(date, point, status, percent, session_text):
    history = ROOT / "SUIVI" / point / "HISTORIQUE.md"
    history.parent.mkdir(parents=True, exist_ok=True)
    if history.exists():
        content = history.read_text(encoding="utf-8")
    else:
        content = "# Historique des évolutions\n\n| Date | Statut | Avancement | Évolution |\n|---|---|---:|---|\n"

    marker = f"| {date} | {status} | {percent} % | Mise à jour de la séance du {date}. |"
    if marker not in content:
        content = content.rstrip() + "\n" + marker + "\n"
        history.write_text(content, encoding="utf-8")

def main():
    body_file = ROOT / "seance_issue.md"
    if not body_file.exists():
        return

    body = body_file.read_text(encoding="utf-8")
    date = parse_date(body)
    if not date:
        raise SystemExit("DATE absente ou invalide dans la séance.")

    day = ROOT / "JOURNEES" / date
    (day / "photos").mkdir(parents=True, exist_ok=True)
    (day / "fichiers").mkdir(parents=True, exist_ok=True)
    (day / "comptes-rendus").mkdir(parents=True, exist_ok=True)

    report = day / "README.md"
    if not report.exists():
        report.write_text(f"# Séance du {date}\n\n{body}\n", encoding="utf-8")

    for point, status, percent in parse_progress(body):
        update_history(date, point, status, percent, body)

if __name__ == "__main__":
    main()
