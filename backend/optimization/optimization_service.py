"""
RAILOPTIMA - Block Scheduling / Optimization Engine
====================================================
Given an asset's urgency/failure data and a set of candidate maintenance
windows, this module:

  1. Forecasts expected traffic (train count) for each candidate window
     using the trained traffic model.
  2. Computes an expected-disruption score per window.
  3. Computes a composite priority/desirability score per window.
  4. Ranks windows and returns the recommended one + alternatives.
  5. Produces a human-readable explanation ("why this slot?").

This is deterministic given its inputs (same inputs -> same output), which
is what makes it unit-testable (see backend/tests/test_scheduling.py).
"""
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional


# Average minutes of delay introduced per train running through an active
# maintenance block. This is a simplifying, clearly-labelled assumption
# (see README "Limitations") rather than a claim of measured real-world data.
DELAY_MINUTES_PER_TRAIN = 3.2


@dataclass
class CandidateWindow:
    start_hour: int          # 0-23, local hour the window begins
    duration_hours: int
    predicted_traffic: float  # forecast train count for the window
    disruption_minutes: float = field(init=False)
    priority_score: float = field(init=False, default=0.0)

    def __post_init__(self):
        self.disruption_minutes = round(self.predicted_traffic * DELAY_MINUTES_PER_TRAIN, 1)

    def label(self) -> str:
        end_hour = (self.start_hour + self.duration_hours) % 24
        return f"{self.start_hour:02d}:00\u2013{end_hour:02d}:00"

    def traffic_level(self) -> str:
        if self.predicted_traffic <= 3:
            return "LOW"
        elif self.predicted_traffic <= 9:
            return "MEDIUM"
        return "HIGH"


@dataclass
class ScheduleRecommendation:
    section: str
    date: str
    recommended: CandidateWindow
    alternatives: List[CandidateWindow]
    urgency_score: float
    failure_probability: float
    delay_reduction_pct: float
    confidence_pct: float
    explanation: str
    feature_importance_pct: Optional[dict] = None


def compute_priority_score(urgency_score: float, disruption_minutes: float, backlog_days: float = 0.0) -> float:
    """
    Composite scheduling score. Higher = more strongly preferred window.

    priority = urgency_weight * urgency
             + backlog_weight * min(backlog_days, 60)
             - disruption_weight * disruption_minutes

    The weights below reflect the relative operational importance of safety
    urgency vs. commercial disruption, tunable via config in a real deployment.
    """
    urgency_weight = 1.6
    backlog_weight = 0.15
    disruption_weight = 1.0

    score = (
        urgency_weight * urgency_score
        + backlog_weight * min(backlog_days, 60)
        - disruption_weight * disruption_minutes
    )
    return round(score, 2)


def rank_windows(
    section: str,
    date: str,
    urgency_score: float,
    failure_probability: float,
    duration_hours: int,
    candidate_hours: List[int],
    traffic_forecaster,
    backlog_days: float = 0.0,
    feature_importance_pct: Optional[dict] = None,
) -> ScheduleRecommendation:
    """
    traffic_forecaster: callable(section, date, start_hour, duration_hours) -> float
        Returns forecast average train count for the window (delegates to
        the trained traffic model via ml_service).
    """
    windows: List[CandidateWindow] = []
    for start_hour in candidate_hours:
        predicted_traffic = traffic_forecaster(section, date, start_hour, duration_hours)
        cw = CandidateWindow(start_hour=start_hour, duration_hours=duration_hours,
                              predicted_traffic=predicted_traffic)
        cw.priority_score = compute_priority_score(urgency_score, cw.disruption_minutes, backlog_days)
        windows.append(cw)

    if not windows:
        raise ValueError("No feasible maintenance windows were generated for this request.")

    windows.sort(key=lambda w: w.priority_score, reverse=True)
    best = windows[0]
    alternatives = windows[1:]

    # Delay reduction vs the next-best alternative (0 if only one window exists)
    if alternatives:
        next_best_disruption = alternatives[0].disruption_minutes
        if next_best_disruption > 0:
            delay_reduction_pct = round(
                max(0.0, (next_best_disruption - best.disruption_minutes) / next_best_disruption * 100), 1
            )
        else:
            delay_reduction_pct = 0.0
    else:
        delay_reduction_pct = 0.0

    # Confidence heuristic: higher when the best window is clearly separated
    # from the runner-up, and when predicted traffic is low (less variance risk).
    if alternatives:
        gap = best.priority_score - alternatives[0].priority_score
        separation_conf = min(1.0, gap / max(abs(best.priority_score), 1.0))
    else:
        separation_conf = 0.5
    traffic_conf = max(0.0, 1 - best.predicted_traffic / 20)
    confidence_pct = round(min(99.0, 55 + 25 * separation_conf + 20 * traffic_conf), 1)

    explanation = build_explanation(section, urgency_score, failure_probability, best, alternatives, delay_reduction_pct)

    return ScheduleRecommendation(
        section=section,
        date=date,
        recommended=best,
        alternatives=alternatives,
        urgency_score=urgency_score,
        failure_probability=failure_probability,
        delay_reduction_pct=delay_reduction_pct,
        confidence_pct=confidence_pct,
        explanation=explanation,
        feature_importance_pct=feature_importance_pct,
    )


def build_explanation(section, urgency_score, failure_probability, best: CandidateWindow,
                       alternatives: List[CandidateWindow], delay_reduction_pct: float) -> str:
    lines = [
        f"Asset urgency on {section} is {urgency_score:.0f}/100.",
        f"Failure probability is {failure_probability * 100:.0f}%.",
        f"Traffic forecast for {best.label()} is {best.predicted_traffic:.1f} trains "
        f"({best.traffic_level()} density).",
        f"Expected disruption in this window is approximately {best.disruption_minutes:.0f} minutes.",
    ]
    if alternatives:
        next_best = alternatives[0]
        lines.append(
            f"This window reduces expected disruption by {delay_reduction_pct:.0f}% compared with the "
            f"next-best window ({next_best.label()}, {next_best.disruption_minutes:.0f} min disruption)."
        )
    return " ".join(lines)


def default_candidate_hours() -> List[int]:
    """A sensible default set of candidate block start times covering
    night/early-morning, morning-peak, midday and evening slots."""
    return [0, 2, 5, 10, 13, 16, 21]
