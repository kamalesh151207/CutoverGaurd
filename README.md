# CutoverGuard

> **AI-assisted Engineering Change Management & Risk-Aware Material Cutover Decision System**  
> *"Don't just change the component. Control the transition."*

---

## Executive Overview

In discrete manufacturing (aerospace, automotive, industrial machinery), executing an Engineering Change Order (ECO) carries severe operational risk. Transitioning between component revisions too early triggers line-stopping stockouts and emergency air freight; transitioning too late incurs obsolescence scrap write-offs and delayed design-rule compliance.

**CutoverGuard** is an **Engineering Decision Application** built for manufacturing planners and supply-chain engineers to analyze Engineering Change Notices, evaluate inventory and supplier constraints, simulate candidate cutover dates, and commit authorized, risk-governed transitions.

### Core Primary Workflow

```
Engineering Change (ECN)
          ↓
Input & Data Quality Validation
          ↓
Inventory & Demand Burn-Rate Analysis
          ↓
Supplier & Replacement Material Readiness
          ↓
Candidate Cutover Trajectory Evaluation
          ↓
Risk & Transition Cost Optimization
          ↓
Recommended Cutover Window Discovery
          ↓
Human Planner Review & Authorization
          ↓
Immutable Decision & Audit Trail Commitment
```

---

## Visual Design — Industrial Enterprise SaaS

- **Main Surface:** `#FFFFFF`
- **Application Workspace Background:** `#F5F7FB`
- **Primary Interactive Blue:** `#2563EB`
- **Primary Hover Blue:** `#1D4ED8`
- **Navy Typography:** `#172B4D`
- **Body Text:** `#334155`
- **Muted Text:** `#64748B`
- **Borders & Dividers:** `#E2E8F0`
- **Tinted Blue Surface:** `#EFF6FF`
- **Semantic Status Signals:** Green `#16A34A` (Feasible / Safe), Amber `#F59E0B` (Caution / Warning), Red `#DC2626` (Shortage / Infeasible)

---

## Workspaces & Application Architecture

CutoverGuard provides **7 dedicated operational workspaces** accessible through a compact, collapsible enterprise sidebar:

| Route | Workspace | Operational Focus |
| :--- | :--- | :--- |
| **`/`** | **Overview** | **Decision Control Center**: Active ECN panel, input readiness matrix, decision summary metrics, interactive cutover curve, constraint boundaries, deterministic rationale, and operational action triggers. |
| **`/ecn`** | **Engineering Changes** | **ECN Registry & Pre-Flight Validation**: Searchable ECN table, active change selection, `+ New ECN` creation modal, and 10-rule CSV BOM data quality gate. |
| **`/cutover`** | **Cutover Analysis** | **Core Optimization Engine**: Interactive SVG cost curves, date slider, scrap/shortage/overhead readouts, LRM milestone track, and planner sign-off cockpit. |
| **`/scenarios`** | **Scenario Simulation** | **What-If Parametric Laboratory**: Side-by-side comparison of baseline vs demand surges (+35%), supplier delays (+6d), and stock variations with live delta metrics. |
| **`/supply-risk`** | **Supply & Risk** | **Sourcing Resilience & Uncertainty**: Multi-factor supplier readiness index (0-100 dial) plus 1,000-run Monte Carlo Box-Muller stochastic lead-time simulation with P10/P50/P90 percentiles. |
| **`/history`** | **Decision History** | **Commitments Log**: Immutable record of past cutover analyses, scenario evaluations, planner approvals (`APPROVED`, `DEFERRED`, `RECALCULATED`), with inspection drawer and CSV export. |
| **`/audit`** | **Audit & Governance** | **Regulatory Verification**: SHA-256 cryptographic hash-chained decision ledger, interactive tamper simulator, and ground-truth AI fact-checking verifier. |

---

## Compact Enterprise Sidebar

- **Expanded Mode (`240px`):** Clean icon + label display with subtle blue active indicator bar and light blue active fill.
- **Collapsed Mode (`64px`):** Icon-only mode with instant enterprise hover tooltips. Toggleable via the collapse button at the bottom of the sidebar or the header toggle button.
- **Bottom Controls:** Settings dialog (Theme mode, currency format, simulation seed, demo reset) and collapse toggle.

---

## Local Development & Execution

```bash
cd CutoverGuard
npm run dev
# or
node server.js
```

Open your browser to:
👉 **`http://localhost:3000`**

---

## Verification & Testing

- `npm test`: Validates all ES Module syntax via `node --check`.
- Zero framework runtime dependencies (native ES Modules, SVG canvas, CSS variables).
- 100% local deterministic evaluation.

---

## License

CutoverGuard is developed for the TECHgium Engineering Evaluation & Demonstration. Distributed under the MIT License.
