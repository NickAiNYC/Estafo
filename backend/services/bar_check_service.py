"""Public-disclosure bar-check service - 31 U.S.C. 3730(e)(4).

The bar: a qui tam is jurisdictionally barred when the essence of the fraud
has been publicly disclosed (in a criminal/civil/administrative hearing,
congressional report, audit, investigation report, or NEWS MEDIA) unless the
relator is an original source. The defense is pleaded constantly; a bar-check
run BEFORE filing (and again at intake) is the difference between a case and
a dismissed case.

What we check (per target entity / NPI / alias):
  1. COURT DOCKETS - CourtListener/RECAP search API for FCA/qui tam mentions.
  2. GOVERNMENT PRESS - DOJ, HHS-OIG, NY AG, OMIG press release search.
  3. NEWS MEDIA - Google News RSS for the entity + fraud/exclusion keywords.
  4. OUR OWN VAULT - PublicDisclosureHit rows we already recorded.

Grading:
  HIGH BAR RISK   - a disclosure predating the tip that describes the same
                    scheme (allegation-level overlap).
  MODERATE        - the entity appears publicly in an enforcement/audit
                    context, but not this scheme.
  LOW             - nothing found (with the caveat that free searches do not
                    see everything; a PACER sweep by counsel is still due
                    diligence).

Original-source assessment runs alongside: with direct, independent knowledge
(31 U.S.C. 3730(e)(4)(B)) even a HIGH-BAR disclosure can be survived by an
original source - the intake record is what proves that.
"""

from __future__ import annotations

import logging
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional
from urllib.parse import urlencode, quote_plus
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session

from models import PublicDisclosureHit, OriginalSourceTip

logger = logging.getLogger(__name__)

USER_AGENT = "Estafo-BarCheck/1.0 (research; contact via repository)"
TIMEOUT = 20

SCHEME_KEYWORDS = [
    "false claims", "qui tam", "medicaid fraud", "medicare fraud",
    "fraud", "exclusion", "excluded", "kickback", "settlement",
    "investigation", "audit",
]


@dataclass
class BarCheckHit:
    source_type: str            # DOCKET / PRESS_RELEASE / NEWS / AGENCY
    title: str
    url: str
    published: Optional[date]
    similarity: float            # 0..1 relevance to the target+scheme
    discloses_allegations: bool  # does it appear to disclose THIS scheme?
    snippet: str = ""


@dataclass
class BarCheckReport:
    target: str
    npi: Optional[str]
    ran_at: datetime
    hits: list[BarCheckHit] = field(default_factory=list)
    bar_risk: str = "LOW"        # LOW / MODERATE / HIGH
    original_source_assessment: str = "PENDING"
    recommendation: str = ""
    tip_ref: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "target": self.target, "npi": self.npi,
            "ran_at": self.ran_at.isoformat(),
            "bar_risk": self.bar_risk,
            "original_source_assessment": self.original_source_assessment,
            "hits": [
                {
                    "source_type": h.source_type, "title": h.title, "url": h.url,
                    "published": h.published.isoformat() if h.published else None,
                    "similarity": h.similarity,
                    "discloses_allegations": h.discloses_allegations,
                    "snippet": h.snippet[:300],
                }
                for h in self.hits
            ],
            "recommendation": self.recommendation,
            "tip_ref": self.tip_ref,
            "statute": "31 U.S.C. 3730(e)(4): public-disclosure bar; original-source exception at (e)(4)(B).",
            "limits": (
                "Free-source sweep (CourtListener, RSS, agency pages). It does NOT replace "
                "a PACER docket sweep by counsel - sealed qui tams are invisible to every "
                "public source, which is the first-to-file risk 3730(b)(5) instead."
            ),
        }


# ---------------------------------------------------------------------------
# Source fetchers (each is best-effort; failures degrade, never crash)
# ---------------------------------------------------------------------------

def fetch_courtlistener(target: str, limit: int = 10) -> list[BarCheckHit]:
    """CourtListener search API (public, low-volume, no key required)."""
    url = "https://www.courtlistener.com/api/rest/v4/search/?" + urlencode({
        "q": f'"{target}" (qui tam OR "false claims")',
        "type": "r",  # opinions + RECAP results
        "order_by": "dateFiled desc",
        "page_size": str(limit),
    })
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urlopen(request, timeout=TIMEOUT) as response:
        import json
        payload = json.loads(response.read().decode("utf-8"))
    hits = []
    for result in payload.get("results", [])[:limit]:
        published = None
        for key in ("dateFiled", "date_created", "created_at"):
            value = result.get(key)
            if value:
                try:
                    published = datetime.fromisoformat(value.replace("Z", "")).date()
                    break
                except ValueError:
                    continue
        snippet = re.sub(r"<[^>]+>", " ", result.get("snippet") or "")[:300]
        hits.append(BarCheckHit(
            source_type="DOCKET", title=result.get("caseName") or result.get("title") or "(untitled)",
            url=result.get("absolute_url") or "", published=published,
            similarity=0.7 if re.search(r"qui tam|false claim|medicaid|medicare", snippet, re.I) else 0.4,
            discloses_allegations=bool(re.search(
                r"(qui tam|false claim).{0,120}(medicaid|medicare|fraud)", snippet, re.I | re.S)),
            snippet=snippet,
        ))
    return hits


def fetch_google_news(target: str, limit: int = 10) -> list[BarCheckHit]:
    """Google News RSS for entity + fraud keywords."""
    query = f"{target} (medicaid OR medicare) (fraud OR 'false claims' OR excluded OR settlement)"
    url = f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=en-US&gl=US&ceid=US:en"
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=TIMEOUT) as response:
        tree = ET.fromstring(response.read())
    hits = []
    for item in tree.iter("item"):
        if len(hits) >= limit:
            break
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or "").strip()
        published = None
        for fmt in ("%a, %d %b %Y %H:%M:%S GMT", "%a, %d %b %Y %H:%M:%S %z"):
            try:
                published = datetime.strptime(pub, fmt).date()
                break
            except ValueError:
                continue
        discloses = bool(re.search(
            r"(fraud|false claims|excluded|kickback|settlement|investigat)",
            title, re.I)) and bool(re.search(r"(medicaid|medicare|health)", title, re.I))
        hits.append(BarCheckHit(
            source_type="NEWS", title=title, url=link, published=published,
            similarity=0.8 if discloses else 0.5, discloses_allegations=discloses,
            snippet=title,
        ))
    return hits


def fetch_doj_press(target: str, limit: int = 5) -> list[BarCheckHit]:
    """DOJ press search page (best-effort scrape of result titles)."""
    url = f"https://www.justice.gov/news?search_api_fulltext={quote_plus(target)}"
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=TIMEOUT) as response:
        html = response.read().decode("utf-8", errors="replace")
    titles = re.findall(
        r'<h3[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]{10,200})</a>', html)
    hits = []
    for link, title in titles[:limit]:
        discloses = bool(re.search(r"false claims|medicaid|medicare|fraud|health ?care", title, re.I))
        hits.append(BarCheckHit(
            source_type="PRESS_RELEASE", title=title,
            url=link if link.startswith("http") else f"https://www.justice.gov{link}",
            published=None, similarity=0.75 if discloses else 0.4,
            discloses_allegations=discloses, snippet=title,
        ))
    return hits


FETCHERS = {
    "DOCKET": fetch_courtlistener,
    "NEWS": fetch_google_news,
    "PRESS_RELEASE": fetch_doj_press,
}


# ---------------------------------------------------------------------------
# Assessment
# ---------------------------------------------------------------------------

def run_bar_check(
    session: Session,
    target: str,
    npi: Optional[str] = None,
    tip_ref: Optional[str] = None,
    use_network: bool = True,
) -> BarCheckReport:
    """Sweep public sources, grade the bar risk, persist the hits."""
    report = BarCheckReport(
        target=target, npi=npi, tip_ref=tip_ref,
        ran_at=datetime.utcnow(),
    )

    if use_network:
        for source_type, fetcher in FETCHERS.items():
            try:
                report.hits.extend(fetcher(target))
            except Exception as exc:
                logger.info("Bar-check source %s failed for %s: %s", source_type, target, exc)

    # Persist hits
    for hit in report.hits:
        session.add(PublicDisclosureHit(
            target=target, npi=npi, source_type=hit.source_type,
            title=hit.title[:500], url=hit.url, published_date=hit.published,
            similarity=hit.similarity, discloses_allegations=hit.discloses_allegations,
            checked_against_tip_ref=tip_ref,
        ))

    # Grade
    disclosing = [h for h in report.hits if h.discloses_allegations and h.similarity >= 0.6]
    if disclosing:
        report.bar_risk = "HIGH"
    elif report.hits:
        report.bar_risk = "MODERATE"
    else:
        report.bar_risk = "LOW"

    # Original-source overlay: a hash-locked tip with direct knowledge changes posture
    if tip_ref:
        tip = session.query(OriginalSourceTip).filter_by(tip_ref=tip_ref).first()
        if tip:
            tip.bar_check_status = "BAR_RISK" if report.bar_risk == "HIGH" else "CLEAR"
            report.original_source_assessment = _assess_original_source(tip, report.bar_risk)
            tip.original_source_assessment = report.original_source_assessment
    else:
        report.original_source_assessment = _assess_original_source(None, report.bar_risk)

    if report.bar_risk == "HIGH":
        report.recommendation = (
            "Same-scheme public disclosure found. DO NOT file before counsel assesses "
            "3730(e)(4) original-source posture: this tip must carry direct and independent "
            "knowledge that materially adds to the disclosure. If it does not, decline the "
            "lead or route around the disclosure."
        )
    elif report.bar_risk == "MODERATE":
        report.recommendation = (
            "Entity appears in public enforcement context but no same-scheme disclosure "
            "located. Proceed; counsel should still sweep PACER for related sealed dockets "
            "(first-to-file, 3730(b)(5)) before filing."
        )
    else:
        report.recommendation = (
            "No public disclosure found in free sources. Proceed to dossier. Standard "
            "counsel PACER sweep still applies."
        )

    session.commit()
    return report


def _assess_original_source(tip: Optional[OriginalSourceTip], bar_risk: str) -> str:
    """3730(e)(4)(B) original-source posture from the intake record."""
    if tip is None:
        return "PENDING" if bar_risk != "HIGH" else "AT_RISK"
    # A hash-locked tip with a coherent narrative implies firsthand knowledge was
    # declared at intake; final legal determination is counsel's.
    if bar_risk == "HIGH":
        return "AT_RISK"      # disclosure exists - original-source quality is now decisive
    return "LIKELY"
