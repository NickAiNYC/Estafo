"""Original-source intake engineering - hash-locked, zero-knowledge tips.

The two things qui tam lawyers say kill good cases:
  1. 'We saw it in the news first' (public-disclosure bar) - solved by
     timestamped intake BEFORE anything surfaces.
  2 'The tipster told three people and a reporter' - solved by disciplined,
     privilege-protected channels.

Design (zero-knowledge until counsel engages):

    tipster                  platform                     counsel
    -------                  --------                     ------
    narrative --> SHA-256 --> we store ONLY {tip_ref, sha256,
                              received_at, scheme tag}
    tipster keeps the narrative + tip_ref -----> engagement ->
                              status flips to COUNSEL_REVIEW;
                              identity flows DIRECTLY tipster->counsel,
                              never through us.

What this buys:
  * A verifiable timestamp that the relator held this knowledge at time T
    (original-source evidence for 3730(e)(4)(B) - 'knowledge ... before a
    public disclosure').
  * NY RPC 5.4 hygiene: we are a research service, not a fee-splitting
    partner; nothing about identity or representation is in our custody.
  * Seal discipline: nothing here is a 'complaint', nothing is sent to the
    government, and the platform never contacts a target.

The declaration generator produces a 28 U.S.C. 1746 draft skeleton the
tipster and counsel complete together - we only echo the facts we hold
(hash, timestamp, scheme tag), never narrative text we do not store.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, date
from typing import Optional

from sqlalchemy.orm import Session

from models import OriginalSourceTip

TIP_REF_PREFIX = "EST"


def intake_tip(
    session: Session,
    narrative: str,
    allegation_scheme: Optional[str] = None,
    target_state: str = "NY",
    timestamp_note: str = "server UTC clock at intake",
    retain_narrative: bool = False,
) -> dict:
    """Register a hash-locked tip.

    The narrative text is hashed and (by design) DISCARDED - the whistleblower
    retains the only copy. We return the tip_ref and the hash so the tipster
    can prove later that they possessed this exact text at this time.
    """
    if not narrative or len(narrative.strip()) < 50:
        raise ValueError("Narrative must be at least 50 characters to be a tip")
    if retain_narrative:
        raise ValueError("retaining narrative text is disabled by design (zero-knowledge vault)")

    narrative_sha256 = hashlib.sha256(narrative.encode("utf-8")).hexdigest()
    year = datetime.utcnow().year
    tip_ref = _next_tip_ref(session, year)

    tip = OriginalSourceTip(
        tip_ref=tip_ref,
        narrative_sha256=narrative_sha256,
        narrative_length_chars=len(narrative),
        allegation_scheme=allegation_scheme,
        target_state=target_state,
        received_at=datetime.utcnow(),
        timestamp_note=timestamp_note,
    )
    session.add(tip)
    session.commit()

    return {
        "tip_ref": tip_ref,
        "narrative_sha256": narrative_sha256,
        "received_at": tip.received_at.isoformat(),
        "instructions_to_tipster": [
            "Keep your narrative exactly as written - the SHA-256 above only proves the text you KEEP.",
            f"Record your tip_ref ({tip_ref}) somewhere safe; it is your claim to this intake.",
            "Do not discuss the matter with coworkers, managers, or anyone in the industry.",
            "Do not post about it, tweet about it, or tell a journalist - public disclosure can bar a case.",
            "Do not take documents you are not authorized to access; never remove PHI.",
            "When you engage counsel, give them the tip_ref and your narrative; they verify the hash with us.",
        ],
        "platform_policy": (
            "Estafo stores no identity and no narrative. We cannot unmask you, subpoena or not."
        ),
    }


def _next_tip_ref(session: Session, year: int) -> str:
    count = session.query(OriginalSourceTip).count()
    while True:
        tip_ref = f"{TIP_REF_PREFIX}-{year}-{count + 1:06d}-{secrets.token_hex(2).upper()}"
        if not session.query(OriginalSourceTip).filter_by(tip_ref=tip_ref).first():
            return tip_ref


def verify_tip(session: Session, tip_ref: str, narrative: str) -> dict:
    """Counsel-side verification: does this narrative hash to the recorded one?"""
    tip = session.query(OriginalSourceTip).filter_by(tip_ref=tip_ref).first()
    if not tip:
        return {"tip_ref": tip_ref, "verified": False, "reason": "tip_ref not found"}
    digest = hashlib.sha256(narrative.encode("utf-8")).hexdigest()
    return {
        "tip_ref": tip_ref,
        "verified": digest == tip.narrative_sha256,
        "received_at": tip.received_at.isoformat(),
        "stored_sha256": tip.narrative_sha256,
        "reason": None if digest == tip.narrative_sha256 else "hash mismatch",
    }


def engage_counsel(session: Session, tip_ref: str) -> dict:
    """Flip a tip to COUNSEL_REVIEW. Identity never flows through the platform."""
    tip = session.query(OriginalSourceTip).filter_by(tip_ref=tip_ref).first()
    if not tip:
        raise ValueError(f"Unknown tip_ref {tip_ref}")
    tip.status = "COUNSEL_REVIEW"
    tip.counsel_engaged_at = datetime.utcnow()
    session.commit()
    return {
        "tip_ref": tip_ref, "status": tip.status,
        "counsel_engaged_at": tip.counsel_engaged_at.isoformat(),
        "note": "Identity and narrative are exchanged directly tipster <-> counsel. "
                "Estafo's record serves only as the timestamp + hash anchor.",
    }


def generate_declaration(session: Session, tip_ref: str) -> dict:
    """28 U.S.C. 1746 unsworn-declaration skeleton for counsel + tipster.

    We only insert the facts the platform holds (hash, timestamp, scheme tag).
    The tipster/counsel complete the substantive paragraphs.
    """
    tip = session.query(OriginalSourceTip).filter_by(tip_ref=tip_ref).first()
    if not tip:
        raise ValueError(f"Unknown tip_ref {tip_ref}")

    tip.declaration_generated_at = datetime.utcnow()
    session.commit()

    text = f"""DECLARATION UNDER 28 U.S.C. SEC. 1746  (DRAFT SKELETON - NOT LEGAL ADVICE)

I, ______________________________, declare under penalty of perjury under the
laws of the United States of America that the following is true and correct:

1. I am the holder of whistleblower tip reference {tip.tip_ref} (the "Tip"),
   registered with the Estafo research platform on {tip.received_at:%Y-%m-%d %H:%M:%S} UTC.

2. The narrative I provided at intake, consisting of approximately
   {tip.narrative_length_chars:,} characters, has the SHA-256 digest:

       {tip.narrative_sha256}

3. I possessed the knowledge described in that narrative before I submitted
   the Tip, and that knowledge is based on my [ personal observation /
   employment / independent review of records I was authorized to access ].

4. [ Paragraph for counsel + tipster: describe the conduct, the entities, the
   time period, and the false or fraudulent claims, consistent with the
   sealed complaint. ]

5. [ Paragraph for counsel: original-source facts - what the tipster knew,
   when, and how it materially adds to any public disclosure, per
   31 U.S.C. 3730(e)(4)(B). ]

6. To my knowledge, I have not publicly disclosed the allegations before this
   filing [ OR: describe any prior disclosure and why I am an original
   source notwithstanding ].

I declare under penalty of perjury that the foregoing is true and correct.

Executed on ______________ at ______________________________.

_______________________________
Signature

Platform note (not part of the declaration): Estafo holds no identity or
narrative for tip {tip.tip_ref}; it can confirm only the intake timestamp and
hash above. This skeleton is a research aid to be completed, reviewed, and
filed under the direction of counsel.
"""
    return {
        "tip_ref": tip_ref,
        "declaration_type": "28 U.S.C. 1746 unsworn declaration (draft)",
        "text": text,
        "generated_at": tip.declaration_generated_at.isoformat(),
    }


def tip_status(session: Session, tip_ref: str) -> dict:
    tip = session.query(OriginalSourceTip).filter_by(tip_ref=tip_ref).first()
    if not tip:
        raise ValueError(f"Unknown tip_ref {tip_ref}")
    return {
        "tip_ref": tip.tip_ref,
        "received_at": tip.received_at.isoformat(),
        "narrative_sha256": tip.narrative_sha256,
        "narrative_length_chars": tip.narrative_length_chars,
        "allegation_scheme": tip.allegation_scheme,
        "bar_check_status": tip.bar_check_status,
        "original_source_assessment": tip.original_source_assessment,
        "status": tip.status,
        "counsel_engaged_at": tip.counsel_engaged_at.isoformat() if tip.counsel_engaged_at else None,
    }
