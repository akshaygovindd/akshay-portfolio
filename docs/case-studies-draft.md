# Case studies: draft text and review notes

**Status:** the published text now lives in `content/case-studies/*.mdx` and is the source of truth. This file keeps the Stage 1 review notes: section 0 and the "Wanted to say, could not verify" lists. Those are notes to myself, written as a review, and they never appear on the site. The drafted case-study text below has been brought in line with the pages (first-person author voice).

Sources: fresh shallow clones of the four repos (read only, nothing run) in the scratchpad. I also read the notebook outputs that are saved in the repos, the report files in the FoodLens and Wildfire repos, and the CSVs in the Emergency repo. "Derived" means I did the arithmetic on repo numbers; the sum is not printed in the repo.

JobPulse is left out, as agreed.

**Revision 2 (after your answers):** READMEs fixed in the two clones (uncommitted, diffs shown in the chat); live cards changed in `config/site.ts`; FoodLens uses Gold counts only; the course brief's rules are now listed apart from my own decisions; both Wildfire class F1 scores are shown.

---

## 0. Places where a repo disagreed with itself

Points 1-3, 9, 10 and 11 are now fixed in the READMEs (uncommitted) and in the text below. The others stay as notes, and I did not change them.

**FoodLens**
1. **Quarantine table is never filled (README fixed).** The README, the report and the Gold notebook describe a `Quarantine_Inspection` table for invalid or duplicate Gold records. The table is created (`01_Environment_Setup`) and a loader function exists (`04`, cell 5), but nothing calls it. I will not claim quarantine routing on the site. I will say "a quarantine table exists; the committed notebooks do not load it."
2. **"Drop inspection" is really "drop violation rows" (README fixed).** README and report say the PASS+critical rule drops the inspection. The Chicago code drops only the critical violation rows of a PASS inspection and keeps the rest of that inspection.
3. **The Dallas business rules remove a lot (now in the README).** Dallas goes from 397,106 rows after DQX to 240,800 after the two business rules. That is 156,306 rows, about 39%. The README does not mention it. I cannot tell from the repo whether that is right or an over-strict reading of the assignment.
4. **"Duplicate violations: keep distinct" vs. the code (README fixed to say duplicates are dropped).** Step 9 runs `dropDuplicates` on (inspection_id, date, violation_code, description). That removed 62,216 Chicago rows and 589 Dallas rows (derived). The assignment text says duplicates "to be loaded as distinct", which could mean either.
5. **Power BI vs Gold.** The dashboards show 279,603 inspections and 43,684 restaurants. Gold has 279,471 and 43,677. Silver has 279,398 distinct inspection ids. The repo does not explain these gaps. The case study uses the Gold counts and mentions the gap in "What I'd do next".
6. **Ingestion is CSV, not API (README diagram fixed).** The old README diagram said "Open Data API". The notebooks read CSV files from a Volume (`Util`: `Food_Inspections_20260406.csv`, etc.).
7. **Chicago scores are derived, not recorded.** Pass=90, Pass w/ Conditions=80, Fail=70, No Entry=0 comes from the assignment. Dallas scores are the real inspection scores. The two are not comparable, and the "pass rate" mixes them.
8. **This was a course assignment** (DAMG 7370). Several DQ rules, the score mapping and "SCD2 on one dimension of your choice" come from the brief. I will say so and not present them as my own design choices.

**Wildfire**
9. **README feature table did not match the notebook (README fixed).** Code vs old README:
   - `State_Fire_Rate` is each state's share of all fires. The README says "historical human-caused fire rate".
   - `Is_Drought_Season` is Summer and Fall (Jun-Nov). The README says June-September.
   - `Region` is cut by longitude. The README says "from state".
   - The README lists `discovery_doy` as a feature. The code drops it and uses `state`.
   - The report (a .docx, not changed) says `State_Fire_Rate` was computed from training data only. The code computes it on the full table before the split. It does not use the target, so it is not label leakage, but the wording is wrong.
10. **Old README said fire size is not a useful predictor (README fixed).** The notebook prints a mean of 30.9 acres for human fires and 312.5 for natural. I will not repeat that README sentence.
11. **The headline F1 is for the human (majority) class.** The lightning class gets F1 0.78 for the tuned RF. README, card and case study now show both.

**Instacart**
12. **Instacart README stack line says "33.8M rows".** That is `order_products` only; the README's own table sums to 37,290,032 rows (derived). The site card and this draft now say "33.8M order-product rows from 3M+ orders". The Instacart README itself is unchanged.
13. **No timings anywhere.** `06_performance_optimization.sql` runs EXPLAIN ANALYZE before and after the indexes, but no result is saved (I searched the whole repo for plan output). The card now says "7 indexes on the main query paths".
14. **"Monetary" in RFM is item count** (there is no price), and "Recency" is `MAX(order_number)`, not days. Both are in the SQL comments or code.

**Emergency Response**
15. **"306 tests".** Stated on the page as "306 tests run offline on every push in GitHub Actions". I counted 282 `def test_` functions plus parametrized cases; the exact count is being confirmed in the CI log.

**Not touched, for you to decide**
- Wildfire `.docx` report is left as submitted coursework.
- The Wildfire README temporal sentence (spring and summer peaks) rests on a plot and a code comment; I did not verify it.

---

## 1. FoodLens: Chicago and Dallas inspection pipeline

### 1. Problem
For a data-architecture course, I had to merge food-inspection records from Chicago and Dallas, which share no keys and store violations in completely different shapes, into one clean star schema for BI reporting.

### 2. Architecture
- Two CSV exports (Chicago 308,161 rows, Dallas 78,984 rows) land in a Databricks Volume.
- Raw to Bronze: write timestamped Parquet, load Bronze Delta tables, log source vs target row counts to a metadata table.
- Bronze to Silver: Chicago violations are split from one pipe-delimited string. Dallas violations are unpivoted from 25 wide columns. Both become one row per violation per inspection in one 26-column schema (plus one load-timestamp column).
- Silver: DQ rules, then business rules, then de-duplication. Written as one Delta table.
- Silver to Gold: Delta MERGE into a star schema: `dim_date`, `dim_restaurant` (SCD Type 2), `dim_violation_detail`, `fact_inspections`, `fact_violations`.
- Power BI reads the Gold tables (four dashboards).

### 3. Key decisions
**Set by the course brief (not my decisions):** the Silver rules (name, date, inspection type and zip must be valid; Dallas score 0-100; Chicago result not null); PASS cannot have a critical or urgent violation; Dallas score 90 or more cannot have more than 3 violations; the Chicago score mapping (Pass 90, Pass w/ Conditions 80, Fail 70, No Entry 0); Medallion layers; SCD2 on one dimension; one dimension for both cities' violation codes; four BI dashboards.

**Mine, as the repo shows them:**
1. **MD5 surrogate keys from business fields.** The cities share no identifiers. `restaurant_id` is MD5 of name, facility type, address and zip. `violation_id` is MD5 of code, description and detail. Dallas also has no inspection id, so I hash name, date, address and zip. The trade-off, from the code: two Dallas inspections of the same place on the same day get the same id.
2. **One row per violation, as the common grain.** I chose the lowest grain both sources can reach (split and regex for Chicago, slot-by-slot union for Dallas), so one Silver schema and one violation dimension serve both cities. Dallas fields that do not exist are derived or defaulted: facility type by keyword match on the name, risk set to "Unknown".
3. **SCD Type 2 on `dim_restaurant`, via the UNION ALL NULL-key MERGE.** The brief required SCD2 on one dimension; choosing the restaurant, hashing the AKA name as the change signal, and the MERGE pattern were my choices. A change in the hash of the AKA name expires the current row and inserts a new one. Two limits from the code: Dallas AKA equals its DBA name, so Dallas rows never create a new version, and the effective dates are the load time, not the date of the change at the source.

### 4. Data quality / evaluation
- Silver rules (from the brief): name, date, inspection type and zip format must be valid; Dallas score must be 0-100; Chicago result must not be null. Bad rows are dropped.
- Business rules (from the brief): PASS cannot have a critical violation (the code drops that violation row only); Dallas score 90 or more cannot have more than 3 violations (the code drops the whole inspection).
- De-duplication on inspection, date, violation code and description (my step; the brief's wording on duplicates is ambiguous).
- Row-count reconciliation at every Bronze load, logged to `child_metadata`. Three logged runs, all SUCCESS with equal counts.
- Post-write checks on Silver: zero PASS-with-critical, zero Dallas scores over 100, zero Dallas 90+ with more than 3 violations, zero bad zips. All passed.
- Every load is idempotent by design: Bronze and Silver overwrite, Gold uses MERGE with "insert if not matched", so a rerun does not duplicate rows. I have not seen a recorded second Gold run, so this is a design property, not a tested result.
- I created a `Quarantine_Inspection` table and wrote a loader function for it, but I never call it, so nothing is quarantined.
- What is not there: tests, and a Gold-to-Power-BI reconciliation.

### 5. Results
- 387,145 raw rows in (308,161 + 78,984; derived), 1,179,288 violation rows in Silver and in `fact_violations`.
- Silver by city: Chicago 939,077 rows, Dallas 240,211 rows.
- DQ: Chicago 49 bad rows (all zip). Dallas 1,300 bad rows: 1,186 zip, 75 null name, 39 out-of-range score.
- Gold: `dim_date` 4,518; `dim_restaurant` 43,677; `dim_violation_detail` 911; `fact_inspections` 279,471; `fact_violations` 1,179,288.
- Four Power BI dashboards on the Gold tables. I use the Gold counts above, not the figures printed on the dashboards.

### 6. What I'd do next
Three things in this repo are unfinished. First, the quarantine table exists but nothing writes to it, so bad Gold records are not captured. Second, the Dallas business rules remove about 39% of Dallas rows after DQX, and I should check whether the assignment really meant that. Third, the Power BI dashboards show slightly more inspections and restaurants than Gold (279,603 against 279,471, and 43,684 against 43,677), and I have not reconciled the gap. I would also add tests for the transform logic, record a second Gold run to show the MERGE rerun leaves counts unchanged, and make the SCD2 dates come from the source.

### Numbers and sources
| Number | Source |
|---|---|
| 308,161 / 78,984 raw rows | `Notebooks/02_Raw_to_Bronze_Load.ipynb` output; `README.md` |
| 3 logged Bronze runs, all SUCCESS | `02_Raw_to_Bronze_Load.ipynb` step 4 output |
| 1,001,388 Chicago Silver rows before DQ, 49 bad | `03_Bronze_to_Silver_Load.ipynb` cell 12 output |
| Dallas 398,406 before DQ, 1,300 bad (1,186 / 75 / 39) | `03` cells 16, 18 output; `README.md`; `Food_Inspections_Report.pdf` |
| Dallas 397,106 to 240,800 after business rules | `03` cells 18, 20 output (the 156,306 and 39% are derived) |
| Dedup: Chicago 1,001,293 to 939,077; Dallas 240,800 to 240,211 | `03` cell 22 output (differences derived) |
| 1,179,288 Silver rows; 939,077 / 240,211 by city | `03` cell 24 output |
| Silver integrity checks all zero | `03` cell 28 output |
| 26-column schema | `03` cell 8 output |
| Gold row counts | `04_Silver_to_Gold_Load.ipynb` cell 20 output; `README.md` |
| 279,398 distinct Silver inspection ids | `03` cell 28 output |
| 279,603 inspections / 43,684 restaurants (used only for the gap in "What I'd do next") | `Dashboard Images/Dashboard-1.png`, `Dashboard-3.png` |

### Wanted to say, could not verify
- "Four dashboards drive decisions" or any use of the dashboards. Nothing in the repo shows a real user.
- That reruns are safe. There is only the MERGE design, no recorded second run.
- Run time of the pipeline. Not recorded.
- Why Dallas "critical" means violation_points == 3. The code does it, no document explains it.

---

## 2. Emergency Response: negotiating LLM agents for ambulances and hospital beds

### 1. Problem
For a graduate agents course, I wanted to know whether LLM agents that negotiate over contested ambulances and hospital capacity beat a strong rule-based allocator. That is hard to test honestly because the agents must never do something physically impossible, and each comparison needs the same scenario run under every system.

### 2. Architecture
- A seeded scenario generator builds a 20 x 20 km, 120-minute city (ground truth), and an LLM writes the 911 reports, cached.
- Four agents: Incident Assessment (reads reports), Dispatch (proposes ambulances and teams), Hospital Coordination (admissions; in v3 one per hospital), Resource Allocation (arbitrates conflicts, up to 3 rounds, then a fixed fallback rule).
- A Python conflict detector sits between proposals and the validator.
- One Python validator checks every action; the simulation engine checks again when it executes.
- The engine writes event logs. A Streamlit dashboard replays saved runs, with no simulation and no API calls.
- Five systems compared: naive, greedy, agents without negotiation, agents with negotiation, and an oracle ablation. Three scenarios: normal, surge, bottleneck.

### 3. Key decisions
1. **Agents propose, Python validates and executes.** No agent can change the world. The validator never modifies state and gives a reason code for every rejection (`sim/validator.py`). The engine checks again at execution.
2. **A strong greedy baseline and paired seeds, not just a naive one.** Every system runs the same seeds, so differences are paired. The baselines read ground truth while the agents must infer urgency from text. `docs/ASSUMPTIONS.md` section 12 says this deliberately favours the baselines. The oracle ablation measures how much that costs.
3. **Reproducibility over fresh sampling.** Every LLM call is cached by agent, model, instructions and prompt, and the cache is committed. The simulation is deterministic given a seed. Versions v1, v2, v3 are frozen with tags and never pooled. The trade-off is stated in the docs: one sample per input, so run-to-run model variance is not measured.

### 4. Data quality / evaluation
- 306 tests run offline on every push in GitHub Actions, with no API key.
- The analysis rebuilds per-victim outcomes from the event logs and checks them against the saved metrics. They match for all 206 v1 and v2 runs (`00_reconstruction_check.csv`).
- Intervals: 95% t-intervals across seeds, paired by seed, plus an exact permutation test.
- Assessment agent accuracy against ground truth (v1): severity exact 91.9%, critical flag correct 99.6%, over 960 victims in 420 incidents.
- Guardrail: the validator blocked 794 infeasible proposals in all saved agent runs (209 v1, 334 v2, 251 v3). None was executed. In v3 the engine refused 6 loan commits at execution.

### 5. Results
Primary metric: critical service rate (CSR), the share of critical victims first reached within their deadline. Mean over seeds.
- Agents and negotiation beat naive by +10.9 to +23.3 points, and all 12 intervals exclude zero. (8 of 12 also pass the exact permutation test; the 4 bottleneck ones do not, with 5 seeds.)
- Agents and negotiation versus greedy: every interval contains zero. Point estimates run from -3.5 to +4.0 points. Equivalence is not shown; the intervals are up to about 20 points wide.
- Negotiation versus agents without it: 35 of 50 paired runs never diverged. Of the 15 that did, negotiation helped in 4, hurt in 2, tied in 9.
- Normal scenario CSR (v1): naive 35.8%, greedy 58.5%, agents 55.0%, negotiation 57.8%.
- Cost: about $0.09 and 1.5-2 minutes of model time per agent run at list price. 106 agent runs in v1 and v2 cost $9.53; with v3, 136 runs cost $12.62.
- v3 (hospitals lend staff): no measurable change in critical-patient treatment time; no interval excludes zero.

### 6. What I'd do next
The limits are clear: small seed counts (10, 10 and 5 per scenario), one model, one run per seed, a synthetic grid, and 911 reports from a formulaic generator that are easier than real calls. So the honest result is "no detectable difference from greedy", not "no difference". The next step is more seeds and repeated runs per seed to measure model variance. After that, noisier and more realistic reports, and a scenario where hospital staff is actually scarce, since v3 found that treatment slots rarely bind. The project is simulation only and is not meant for real dispatch.

### Numbers and sources
| Number | Source |
|---|---|
| CSR table (35.8 / 58.5 / 55.0 / 57.8 etc.) | `results/analysis/01_csr.csv`; `docs/RESULTS.md` RQ1 |
| +10.9 to +23.3 vs naive; 12 intervals; 8 of 12 permutation | `01_rq1_vs_naive.csv`, `01_rq1_permutation.csv`; `docs/RESULTS.md` |
| -3.5 to +4.0 vs greedy | `01_rq1_paired_vs_greedy.csv`; `docs/RESULTS.md` |
| 50 pairs, 15 diverged, 35 not, 4 / 2 / 9 | `02_divergence_summary.csv` |
| 794 = 209 + 334 + 251 | `06_invalid_proposals.csv` (v1, v2; sums 209 and 334 I checked); `results/v3/coordination.csv` (154 + 95 + 1 + 1 = 251, my sum of mean x seeds); `README.md` |
| 6 loans refused at execution | `docs/RESULTS.md` v3 section; `09_v3_loans.csv` |
| 206 reconstruction matches | `00_reconstruction_check.csv`; `docs/RESULTS.md` |
| 91.9% severity exact; 99.6% critical flag; 960 victims; 420 incidents | `results/v1/assessment_accuracy.json` |
| $0.09 per run; 1.5-2 min | `07_cost_overall.csv` ($0.086-0.099; 93-111 s); `docs/RESULTS.md` RQ4 |
| 106 runs, $9.53; 136 runs, $12.62 | `07_cost_overall.csv` (sum $9.529); `09_v3_runs.csv` (v3 $3.09) |
| v3 null result | `09_v3_contrasts.csv`; `docs/RESULTS.md` v3 section |

### Wanted to say, could not verify
- The 306 count: to be confirmed in the GitHub Actions log.
- That any of this transfers to real dispatch. The repo says it does not.
- Run-to-run model variance. The repo says it is not measured.
- The model name `gpt-5.4-mini` is stated in `docs/ASSUMPTIONS.md` and `config.py`. I did not call the API to confirm it.

---

## 3. Instacart: SQL analytics on 3.4M orders

### 1. Problem
I wanted a SQL project at a real size, where schema design and index choices matter, and where a live dashboard runs real queries. The repo gives no client or stakeholder; the README states this goal ("shows SQL skills end to end").

### 2. Architecture
- Instacart Market Basket CSVs (Kaggle) are loaded into PostgreSQL by a Python loader in 100,000-row chunks.
- Five tables with primary and foreign keys: `orders`, `order_products`, `products`, `aisles`, `departments`.
- Seven SQL files from basic to advanced: joins, CTEs, window functions, RFM and cohort analysis, views, indexing, stored functions and a trigger.
- Three views and two materialized views (`mv_department_stats`, `mv_top_products`).
- A Streamlit dashboard of five pages reads a Neon cloud Postgres database. Most pages read the materialized views, and query results are cached for 10 minutes.

### 3. Key decisions
1. **Materialized views for the dashboard.** Overview and Product pages read `mv_department_stats` and `mv_top_products` instead of aggregating 33.8M `order_products` rows per page view (the pages' SQL shows this). The trade-off: they need a manual `REFRESH`.
2. **Seven indexes, including a composite and a partial one.** The partial index covers only `reordered = 1`. The file's comment gives the reason: it speeds up reorder analysis without indexing every row. The cost is index size, which the file also queries.
3. **Proxies where the data has no money.** The dataset has no prices, so "Monetary" in RFM and the CLV tiers use item counts (`total_items`, thresholds 100 / 200 / 500). Recency uses `MAX(order_number)`. These are comments in the SQL, not hidden. The trade-off is that these are weaker signals than real recency and spend.

### 4. Data quality / evaluation
- Schema constraints: primary keys, foreign keys, NOT NULL, and a composite primary key on `order_products`. The loader loads tables in foreign-key order.
- An audit trigger logs updates and deletes on `products` to `product_audit_log`.
- Performance: the SQL file has EXPLAIN ANALYZE before and after indexing, but no output is saved. I cannot cite a result.
- What is not there: no tests, no row-count check after loading, no recorded query results.

### 5. Results
- Scale (README table): 3,421,083 orders; 33,819,106 order lines; 49,688 products; 134 aisles; 21 departments.
- Built: 7 SQL files, 7 indexes, 3 views, 2 materialized views, 3 functions, 1 trigger, 5 dashboard pages. I counted these in the files.
- A deployed dashboard (live link in the README) with a Query Explorer that runs SQL against the cloud database.
- No performance numbers, because none are saved.

### 6. What I'd do next
My limits: no saved timings, no tests, and no row-count check after loading. Next, I'd script the load into Neon instead of doing it by hand. I would save the EXPLAIN ANALYZE output, so the index work has numbers. I would add row-count checks after loading, and replace the item-count proxies with real recency in days (the data has `days_since_prior_order`).

### Numbers and sources
| Number | Source |
|---|---|
| 3,421,083 / 33,819,106 / 49,688 / 134 / 21 rows | `README.md` Database section (the CSV data is too large for the repo) |
| 37,290,032 total (derived) | sum of the above |
| 7 SQL files; 7 indexes; 3 views; 2 materialized views; 3 functions; 1 trigger | `analysis/01..07*.sql` (counted) |
| 5 dashboard pages | `dashboard/pages/` |
| 100,000-row chunks; 10-minute cache | `data/load_data.py`; `dashboard/util/db.py` |

### Wanted to say, could not verify
- Any speed-up from the indexes. No output saved.
- Any business finding (top department, reorder rate, segment sizes). The README and files contain none.
- That the row counts match the database. I cannot see it.

---

## 4. Wildfire: human or lightning?

### 1. Problem
For a data-science course, my teammate and I wanted to classify US wildfires as human-caused or lightning-caused from 1.88 million records, a task where 83.8% of fires are human-caused, so accuracy alone says nothing.

### 2. Architecture
- Data: USDA Forest Service fire records (1992-2015), exported from SQLite to one CSV (1,880,465 rows).
- Cleaning: drop "Missing/Undefined" causes (1,713,742 rows left), drop ID and name columns, build the target (Lightning = 0, every other cause = 1).
- Features: 12 in total, 5 engineered (Season, Is_Drought_Season, Region, State_Fire_Rate, Owner_Type). Categories are label-encoded; scaling is fit on train only.
- Stratified 80/20 split (1,370,993 train, 342,749 test).
- Five models (LR, LinearSVC, KNN, Decision Tree, Random Forest), all with `class_weight='balanced'` except KNN. The best model is tuned with GridSearchCV and checked with 5-fold CV.

### 3. Key decisions
1. **F1 and ROC-AUC, not accuracy, and balanced class weights.** An all-"human" model would score 83.8% accuracy and learn nothing. I used `class_weight='balanced'` instead of resampling.
2. **Random Forest after comparing the five at baseline.** On the same held-out test set, RF had the best F1 (0.9597) and AUC (0.9547) before tuning. The Decision Tree had the highest precision (0.9625) but lower recall. Linear models plateaued near F1 0.876, which I put down to non-linear geography.
3. **Constraints taken on purpose.** KNN trained on a 100,000-row sample because it was too slow on 1.37M rows. The tree was capped at depth 5 for readability. A smaller weather-enriched (55K) dataset was too small for the course size requirement, so I used the larger one without weather.

### 4. Data quality / evaluation
- Stratified split keeps the class ratio equal in train and test (16.2% / 83.8%).
- Scaler fit on train only.
- Tuning: GridSearchCV, 27 candidates x 3 folds = 81 fits, scored on F1, on the training set only.
- Stability: 5-fold CV F1 mean 0.9590, std 0.0003.
- All models are scored on the same test set: accuracy, precision, recall, F1, AUC, confusion matrix and ROC.
- Not done: a separate validation set (model choice used the test metrics), and no spatial or temporal split.

### 5. Results
- Tuned Random Forest on the test set: ROC-AUC 0.9579 (shown as 0.958 on the site), accuracy 0.9322.
- F1 by class: 0.96 for human-caused (precision 0.95, recall 0.97) and 0.78 for lightning-caused (precision 0.82, recall 0.75). The pooled `f1_score` of 0.9598 is the human class.
- Tuning added +0.0001 F1 over the default forest (0.9597).
- Best parameters: 200 trees, max depth 30, min leaf 1.
- Top RF feature importances: longitude 0.267, latitude 0.168, Owner_Type 0.097.
- Other models, F1: LR 0.8758, SVM 0.8756, KNN 0.9452, Decision Tree 0.9103.
- For context: a model that always predicts "human" would score about 0.91 F1 on that class, which is why I report ROC-AUC and both classes.

### 6. What I'd do next
My limits: no weather data, and records that end in 2015, so they may not match recent fire patterns. Next I would add weather features, try gradient boosting (XGBoost, LightGBM), build a multi-class cause model, and serve predictions through an API. There is one more limit. Final fire size and containment time are only known after a fire, so this model labels past fires; it does not forecast new ones. Longitude and latitude carry most of the signal, so I would also test it on held-out regions or years.

### Numbers and sources
| Number | Source |
|---|---|
| 1,880,465 rows; 1,713,742 after cleaning | `WILDFIRE_FINAL.ipynb` cells 2, 4 output |
| 1,435,274 human / 278,468 natural; 83.8% / 16.2%; 5.2:1 | cell 5 output; `README.md` |
| 1,370,993 train / 342,749 test | cell 14 output |
| 12 features, 5 engineered | cells 12-13 output and code |
| Model metrics (all rows) | cells 17-24 output; `README.md` table matches |
| F1 0.96 human, 0.78 lightning; P/R 0.95 / 0.97 and 0.82 / 0.75 | cell 24 output (classification report, 2 decimals) |
| GridSearch 81 fits, best CV F1 0.9585, best params | cell 23 output |
| +0.0001 F1 from tuning | cell 25 output |
| 5-fold CV 0.9590, std 0.0003 | cell 26 output |
| Feature importances | cell 28 output |
| Correlation: longitude 0.345 | cell 10 output |
| KNN 100K sample | cell 19 output |
| No weather data; 1992-2015; future work | notebook conclusion; `INFO6105 Team 6 Report.docx` sections 6.1, 6.2 |
| About 0.91 F1 for a model that always predicts "human" | derived: 2 x 0.838 x 1 / (0.838 + 1) |

### Wanted to say, could not verify
- Which seasons peak for which cause. Only plot images and a code comment show it, and I did not use the images.
- That Random Forest beats the others by a significant margin. There is one split and one seed, no repeat or test.
- That the 5 engineered features "paid off". The notebook says so. I have no ablation that removes them.
- Any use by fire agencies. Nothing in the repo shows it.
- Team split. The README lists my part as feature engineering, model training, EDA and the notebook, and my teammate's part as preprocessing, analysis and the report. The cleaning code is in the same notebook, so I will write "we" for cleaning.
