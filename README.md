# Rugalmas Adókalkulátor 2027

Nyilvános, tájékoztató jellegű webes kalkulátor a 2027-re várható egyéni vállalkozói és KIVA-s Kft. adózási formák összehasonlítására.

## V1 állapot

- 4 lépéses, mobilbarát felület
- ÚJ KATA 2027 tervezeti logika
- átalányadó
- vállalkozói SZJA becslés
- KIVA-s Kft. becslés
- HIPA: egyszerűsített kisvállalkozói sávok és KIVA 120%-os módszer összevetése
- ezres tagolású Ft-mezők
- KATA jogosultsági/kockázati ellenőrzések
- Webnode iframe beágyazási mód automatikus magasságkezeléssel
- kézi ellenőrzési esetek a TEST_CASES.md fájlban

> Fontos: a 2027-es ÚJ KATA jelenleg tervezeti szabályokon alapul. A kalkulátor eredménye nem minősül adótanácsadásnak.

## GitHub Pages élesítés

A repositoryban nincs szükség build folyamatra.

GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**
- Branch: `main`
- Folder: `/(root)`

Várt publikus URL:
`https://ghpkonyvelo-bot.github.io/rugalmas-adokalkulator/`

## Webnode

A `WEBNODE_EMBED.html` fájl tartalmazza a Webnode HTML-kód elembe beilleszthető iframe kódot.

## Fő források

- https://kormany.hu/dokumentumtar/tarsadalmi-egyeztetes-a-kisadozo-egyeni-vallalkozok-teteles-adojarol-szolo-torvenyjavaslatrol
- https://nav.gov.hu/ado/szja/Kedvezo_valtozasok_az_atalanyadozasban
- https://nav.gov.hu/ado/kiva
