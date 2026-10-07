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

POINT_NAMES = {
    "01-cahier-des-charges": "📋 Cahier des charges",
    "02-conception": "🧩 Conception",
    "03-modelisation-3D": "🧱 Modélisation 3D",
    "04-materiaux": "🧪 Matériaux",
    "05-fabrication": "🛠️ Fabrication",
    "06-assemblage": "🔩 Assemblage",
    "07-essais": "🏁 Essais",
    "08-presentation": "🎤 Présentation",
}

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
            percent = max(0, min(100, int(match.group(3))))
            results.append((match.group(1), match.group(2), percent))
    return results

def update_history(date, point, status, percent):
    history = ROOT / "SUIVI" / point / "HISTORIQUE.md"
    history.parent.mkdir(parents=True, exist_ok=True)

    if history.exists():
        content = history.read_text(encoding="utf-8")
    else:
        content = "# Historique des évolutions\n\n| Date | Statut | Avancement | Évolution |\n|---|---|---:|---|\n"

    # Harmonise l'ancien en-tête si nécessaire.
    content = content.replace(
        "| Date | Séance | Avancement | Évolution |",
        "| Date | Statut | Avancement | Évolution |",
    )

    marker = f"| {date} | {status} | {percent} % | Mise à jour de la séance du {date}. |"
    if marker not in content:
        content = content.rstrip() + "\n" + marker + "\n"
        history.write_text(content, encoding="utf-8")

def update_point_readme(point, status, percent):
    path = ROOT / "SUIVI" / point / "README.md"
    if not path.exists():
        return

    content = path.read_text(encoding="utf-8")
    content = re.sub(r"(\*\*Statut :\*\*\s*).+", rf"\g<1>{status}", content, count=1)
    content = re.sub(r"(\*\*Avancement :\*\*\s*)\d+\s*%", rf"\g<1>{percent} %", content, count=1)
    path.write_text(content, encoding="utf-8")

def progress_bar(percent, size=20):
    filled = round(percent / 100 * size)
    return "🟩" * filled + "⬜" * (size - filled)

def update_home():
    path = ROOT / "README.md"
    if not path.exists():
        return

    values = {}
    for point in POINTS:
        point_file = ROOT / "SUIVI" / point / "README.md"
        percent = 0
        if point_file.exists():
            match = re.search(r"\*\*Avancement :\*\*\s*(\d+)\s*%", point_file.read_text(encoding="utf-8"))
            if match:
                percent = max(0, min(100, int(match.group(1))))
        values[point] = percent

    average = round(sum(values.values()) / len(POINTS)) if POINTS else 0
    content = path.read_text(encoding="utf-8")

    table_lines = ["| Partie du projet | Avancement |", "|---|---:|"]
    for point in POINTS:
        percent = values[point]
        table_lines.append(
            f"| {POINT_NAMES[point]} | {progress_bar(percent)} **{percent} %** |"
        )
    new_table = "\n".join(table_lines)

    content = re.sub(
        r"(?s)\| Partie du projet \| Avancement \|\n\|---\|---:\|\n.*?(?=\n### ⭐ AVANCEMENT GLOBAL)",
        new_table,
        content,
        count=1,
    )

    content = re.sub(
        r"(?s)(### ⭐ AVANCEMENT GLOBAL\n\n)\*\*\d+ %\*\*\n\n<progress value="\d+" max="100"></progress>",
        rf"\g<1>**{average} %**\n\n<progress value="{average}" max="100"></progress>\n\n**{progress_bar(average)}**",
        content,
        count=1,
    )

    path.write_text(content, encoding="utf-8")

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
        update_history(date, point, status, percent)
        update_point_readme(point, status, percent)

    update_home()

if __name__ == "__main__":
    main()
