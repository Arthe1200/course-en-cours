import re
from pathlib import Path

ROOT = Path('.')
POINTS = ['01-cahier-des-charges','02-conception','03-modelisation-3D','04-materiaux','05-fabrication','06-assemblage','07-essais','08-presentation']

def main():
    for report in ROOT.glob('JOURNEES/*/README.md'):
        date = report.parent.name
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
            continue
        text = report.read_text(encoding='utf-8')
        for point in POINTS:
            if point not in text:
                continue
            history = ROOT / 'SUIVI' / point / 'HISTORIQUE.md'
            history.parent.mkdir(parents=True, exist_ok=True)
            if history.exists():
                current = history.read_text(encoding='utf-8')
            else:
                current = '# Historique des évolutions\n\n| Date | Séance | Avancement | Évolution |\n|---|---|---:|---|\n'
            marker = f'| {date} | {date} | — | Mise à jour depuis la journée {date}. |'
            if marker not in current:
                history.write_text(current.rstrip() + '\n' + marker + '\n', encoding='utf-8')

if __name__ == '__main__':
    main()
