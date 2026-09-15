import re
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/app/menu/menu.component.html"
text = p.read_text(encoding="utf-8")
text2 = re.sub(r"(\s+>[^<\r\n]+)</a\s*\r?\n\s*>", r"\1</a>", text)
text2 = re.sub(
    r'(\[routerLinkActiveOptions\]="\{ exact: true \}"\)\s*)<!-- >Les centres promus \(CP\)</a -->\s*\r?\n\s*>',
    r"\1>Les centres promus (CP)</a>",
    text2,
)
text2 = re.sub(
    r"<!-- <a\s+\*ngIf=\"canViewActivitesCentrePartenariat\(\)\"[\s\S]*?>Partenariat</a\s*\r?\n\s*> -->",
    "<!-- Partenariat menu item desactive -->",
    text2,
)
text2 = re.sub(
    r"<!-- <a\s+\*ngIf=\"canViewActivitesCentreInfos\(\)\"[\s\S]*?>Informations centres</a\s*\r?\n\s*> -->",
    "<!-- Informations centres menu item desactive -->",
    text2,
)
remaining = len(re.findall(r"</a\s*\r?\n\s*>", text2))
if text2 != text:
    p.write_text(text2, encoding="utf-8")
    print("menu.component.html fixed")
else:
    print("no changes")
print("remaining split tags:", remaining)
