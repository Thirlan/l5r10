# Legend of the Five Rings 4th Edition - Itadori Edition Rules Review

## Project Overview
A comprehensive rewrite of Legend of the Five Rings 4th edition rules to clarify, streamline, and balance the game system. The goal is to create a shorter, more accessible rulebook while maintaining the depth and flavor of the system.

**Edition Name:** Itadori Edition (temporary - references the collaborative nature of this project)

---

## Table of Contents
1. [Combat Stances & Mechanics](#combat-stances--mechanics)
2. [Weapons & Equipment](#weapons--equipment)
3. [Movement & Initiative](#movement--initiative)
4. [Mounted Combat](#mounted-combat)
5. [Core Mechanics Overhaul](#core-mechanics-overhaul)
6. [Magic & Spell System](#magic--spell-system)
7. [Character Advancement](#character-advancement)
8. [Traits & Rankings](#traits--rankings)
9. [Courtier Schools & Political Leverage](#courtier-schools--political-leverage)
10. [Dueling System](#dueling-system)
11. [Documentation & Clarity](#documentation--clarity)

---

## Combat Stances & Mechanics

### Remove Full Defense and Center Stances
- **Problem:** These stances add complexity for minimal benefit and were added late in 4e development against some staff wishes
- **Implementation:**
  - Remove Full Defense and Center Stance completely
  - Start combat in Attack Stance by default
  - Revert to previous edition's simpler stance system
- **Status:** Not Started

### Full Attack Stance Modification
- **Proposed Change:**
  - Modify bonus from `+2k1` to `+1k1` (may need playtesting)
  - Add user's Fire Ring to the total of the roll
  - Ensure it's useable while mounted by default
  - Fire Ring now has a special purpose in combat (currently the only ring that doesn't)
- **Benefit:** Balances ring usage; Fire Ring now matters in combat calculations
- **Status:** Not Started

### Defense Stance Modification
- **Changes:**
  - Remove spellcasting ability during Defense Stance
  - This nerfs shugenja balance (currently considered overpowered in 4e)
  - Aligns with 1st edition standards
- **Mitigation Needed:** Add mechanics to protect shugenja (see "Attacks of Opportunity" below)
- **Status:** Not Started

### Attacks of Opportunity
- **Implementation:**
  - Defense skill rank 3: Bushi may make attacks of opportunity while in Defense Stance
  - Helps balance the loss of shugenja free-casting
  - Creates tactical depth
- **Consideration:** May add D&D-like complexity; monitor for system bloat
- **Status:** Not Started

### To-Hit TN Calculation (Optional)
- **Consideration:** Current calculation: `5 + 5 x Reflexes` 
- **Alternative (Not Decided):** `5 x Air Ring + 2 x Defense Skill`
- **Current Decision:** Keep base armor TN calculation simple; Air Ring contribution to Defense Stance is sufficient
- **Status:** On Hold - Insufficient data

---

## Weapons & Equipment

### Weapon Category Consolidation

#### Small Blades Consolidation
- **Group Together:** Jitte/Sai, Tanto/Aiguchi, Kama, Shuriken/Kunai
- **Create:** "Small Blades" weapon category
- **Suggested Implementation:** Unified damage calculation, same skill usage
- **Status:** Not Started

#### Scimitar Standardization
- **Change:** Make Scimitar use same rules as Katana
- **Goal:** Simplify weapon variety; reduce stat-checking
- **Status:** Not Started

#### Small Unarmed Weapons
- **Tonfa, Nunchaku, Jo, Machi-Kanshisha:**
  - Consolidate to same rules: `0k2` damage, small category
  - All use Jiujutsu skill
- **Tsubute (Throwing Stones):**
  - Move under Jiujutsu skill
  - Damage: `0k1`
  - Flavor: Just stones being thrown
- **Status:** Not Started

#### Polearm and Spear Consolidation
- **Consolidate categories:** Combine polearms and spears into single category
- **Unified stats:** Naginata, Bisento, Nagamaki → `3k3` damage
- **Special Ability:** Spears can be thrown with full attack
- **Reach Bonuses:** Add reach bonuses to longer weapons like spears and polearms
- **Consolidations:**
  - Combine Sade-Garami and Sasumata stats
  - Combine Mai Chong with Yari
  - Combine Nage-Yari with Yari
- **Status:** Not Started

#### Chain Weapons Consolidation
- **Consolidate:** All chain weapons into one category
- **Suggested Implementation:** Same damage, effects, and skill usage
- **Status:** Not Started

#### Heavy Weapons Consolidation
- **Consolidate:** All heavy weapons into one category
- **Unified Stats:**
  - `3k3` damage
  - Ignore 2 armor reduction
  - +5 bonus on knockdown attempts
  - Optional: Consider `1k4` damage variant for playtesting
- **Status:** Not Started

#### Blowgun Classification
- **Change:** Move blowgun under Kyujutsu skill
- **Make it:** Small weapon classification
- **Status:** Not Started

#### Weapons to Remove
- **Remove Sang Kauw:** No longer needed
- **Remove Kumade:** No longer needed
- **Remove Parangu:** No longer needed
- **Remove Ninja-To:** No longer needed
- **Remove Warfans:** No longer needed
- **Status:** Not Started

### Arrow Mechanics
- **Proposed change:** Apply D&D's two-tier range system
- **Implementation:** Flat -5 penalty past short range to simulate disadvantage
- **Armor Piercing Arrows:** Should ignore armor reduction
- **Status:** Not Started

### Scroll Casting Requirements
- **New Rule:** If casting a spell from a scroll, you need both hands
- **Mastery Bonus:** Mastering the spell reduces requirement to one hand
- **Status:** Not Started

---

## Movement & Initiative

### Movement Simplification
- **Problem:** Movement rules are unnecessarily complex, characters move slowly and difference between high water rinkgs and low water rings too high, allowing for kiting
- **Implementation:** reduce the gap in movement between water ranks and make all actions the same movement
- **Proposed Formula (Water Ring based):**
  - 4 squares + 1 Water = 5 squares (25 feet)
  - 4 squares + 2 Water = 6 squares (30 feet)
  - 4 squares + 3 Water = 7 squares (35 feet)
  - 4 squares + 4 Water = 8 squares (40 feet)
  - 4 squares + 5 Water = 9 squares (45 feet)
- **All actions have same movement ** = Simple and Free use the formula above
  - Certain techniques and abilities will need adjustment
- **Status:** Not Started

### Initiative for Mounted Combat
- **Change:** Roll both character's and mount's initiative
- **Result:** Use the LOWER of the two rolls for both
- **Benefit:** Aligns mount and character on same initiative, simplifying actions
- **Status:** Not Started

---

## Mounted Combat

### Horsemanship Damage Check
- **New Rule:** Every time you take damage, roll Horsemanship
- **TN:** Equal to damage dealt (minus armor reduction)
- **Failure:** Fall off mount, land prone
- **Benefit:** Makes mounted combat more skill-intensive and tactical
- **Status:** Not Started

### Unicorn Cavalry Cost Analysis
- **Discussion Point:** Unicorn characters start with free horse (cost factored into starting gold)
- **Current:** 10 Koku starting gold
- **Proposal:** Possibly reduce to 5 Koku due to horse investment
- **Decision Pending:** Balance considerations vs. narrative identity of Unicorn (wealthy, merchant-focused)
- **Status:** On Hold - Requires playtesting
- **Note:** Soft balance (money/equipment) vs hard balance (permanent abilities) - may not be worth adjusting

### Mounted Combat Power Balance
- **Assessment:** Mounted combat is strong but situational
- **Downsides:** Can't use in dungeons/castles, terrain restrictions, prone to deliberate GM nerfs
- **Current Decision:** Do NOT nerf mounted power; make it more skill-intensive instead
- **Possible Adjustments:**
  - Higher Horsemanship TN requirements
  - Lower bonuses for mounted riders
  - Less monstrous Utaku steed stats
- **Status:** On Hold - Monitor during playtesting

---

## Core Mechanics Overhaul

### Free Raises Removal
- **Problem:** "Free Raises" concept is confusing and provides minimal gain
- **Solution:** Remove the concept entirely
- **Replacement:** Use simple +5 bonus to rolls when it would come up
- **Special Exception:** Void point limit for normal raises can be ignored in these +5 cases
- **Status:** Not Started

### Degrees of Success
- **New Concept:** Add "degrees of success" mechanics
- **When Used:** Situations where Raises don't make sense but high rolls should matter
- **Example:** Lore checks - higher rolls = more information
- **Implementation Details:** TBD
- **Status:** Not Started

### Reflexes Over-Usage Reduction
- **Problem:** Reflexes trait is too dominant, used in most ranged attack rolls
- **Solution:** Remove Reflexes from most ranged attack rolls
- **Benefit:** Encourages more diverse character building
- **Status:** Not Started

### Dice Addition/Subtraction Balancing
- **Problem:** Many effects add or subtract dice, causing potential die pool explosions
- **Solution:** Convert most dice additions/subtractions to flat numerical bonuses/penalties
- **Benefit:** Easier to track, prevents die pool bloat
- **Status:** Not Started

---

## Magic & Spell System

### Spell List Trimming
- **Problem:** Spell list is bloated
- **Action:** Trim unnecessary spells
- **Consideration:** Which spells to remove? Create decision matrix
- **Status:** Needs Research

### Spell Availability Restructuring
- **Radical Option:** Make all spells available at any Insight rank
- **Gating:** Only gated by TN, like 1st edition
- **Benefit:** Simplifies progression, makes spells more flexible
- **Consideration:** May reduce the distinction between rank capabilities
- **Status:** On Hold - Needs Community Input

### Insight Rank System (Radical Change)
- **Radical Proposal:** Eliminate Insight Ranks entirely
- **Alternative System:** 
  - Techniques/spells granted when sensei determines readiness
  - Maximum one per in-game year
- **Rationale:** Techniques already bound to setting and RP considerations
- **Assessment:** "Too extreme" - current decision to keep as-is
- **Status:** Rejected (but keep as reference for future consideration)

### Shugenja Balance
- **Problem:** Shugenja considered overpowered in 4e
- **Factors:**
  - Can cast in Defense Stance (being removed)
  - Too many available spells
- **Actions:**
  - Remove Defense Stance casting (see: Stances section)
  - Trim spell list
  - May need additional review after balance changes
- **Status:** In Progress

---

## Character Advancement

### Technique Acquisition Timeline
- **Current Proposal:** 6-month training requirement per rank is acceptable
- **Alternative Rejected:** Annual (in-game year) requirement considered "too extreme"
- **Status:** Currently Accepted

### "Attack Twice" Technique Distribution
- **Problem:** Power gap between schools getting "attack twice" at rank 3 vs rank 4 is too significant
- **Solution:** All combat-focused schools must have "attack twice" at rank 3 if not already there
- **Affected Schools:** TBD - Requires review of each combat school
- **Status:** Not Started

### Courtier Schools Rank 4 Options
- **Proposal:** All courtier schools get a rank 4 choice:
  - Make two attacks per round, OR
  - Low-level shugenja power
- **Benefit:** Gives courtiersMore combat utility and options
- **Status:** Not Started

---

## Traits & Rankings

### Maximum Rank Cap - Partial Implementation
- **Decision Made:** Cap: Traits, Skills, Fear, and Shadowland Taint at 5 ranks maximum
- **Reasoning:** Matches 1st edition design; designers of 4e regret not doing this
- **Math Impact:** Character power no longer breaks down as quickly during advancement
- **NOT Capped (Reasoning Below):**
  - Honor (10 ranks): Too difficult to track honor loss penalties; characters would hit cap too fast
  - Shadowland Taint (10 ranks): Similar bookkeeping problems as Honor
  - Fame/Glory (10 ranks): Not rolled, capping provides no mechanical value
- **Character Features Needing Recalculation:** TBD - Requires audit of all features
- **Most Interesting Skill Masteries:** Move these to other character advancement aspects
- **Status:** Requires Implementation

### +5 Insight to Rank 5 skills
- **Change:** All skills lose mastery but rank 5 gives +5 insight
- **Reasoning:** Difficult to gain insight from skills alone, forcing people to dump into Traits/Rings to rank up. Traits are also already too valuable.
- **Status:** Not Started

### Fame/Glory Renaming
- **Change:** Rename "Glory" trait to "Fame"
- **Benefit:** More efficiently encapsulates vestigial Infamy rules
- **Implementation:** Global find-and-replace throughout documents
- **Status:** Not Started

### Low Skill Category Replacement
- **Current Category Name:** "Low Skill"
- **Problem:** "Low" is a strong negative value judgment; creates wrong expectations
- **Proposed Name:** "Dubious Skill"
- **Benefit:** Better indicates context-dependent honor loss (sometimes costs honor, sometimes doesn't)
- **Examples:** Commerce, Temptation, Courtesies
- **Status:** Not Started

---

## Courtier Schools & Political Leverage

### Seven Aspects of Political Power
- **Identified Dimensions:**
  1. **Economic Power** (commerce, resources)
  2. **Information Power** (intelligence, secrets)
  3. **Social Influence** (charisma, diplomacy)
  4. **Legitimacy** (honor, law, tradition)
  5. **Military Power** (force capability)
  6. **Narrative Control** (fame, propaganda)
  7. **Administrative Power** (bureaucracy, governance)

### Clan Court Specialization Matrix

#### Crab Yasuki Leverage Order
1. **Top 2:** Economic Power, Military Power
2. **Bottom 2:** Information Power, Narrative Control
3. **School Identity:** Pragmatic merchants and traders
4. **Proposed Abilities:** TBD

#### Crane Doji Leverage Order
1. **Top 3:** Social Influence, Narrative Control, Administrative Power
2. **Bottom 1:** Military Power
3. **School Identity:** Diplomatic masters of court
4. **Proposed Abilities:** 
   - Rank 1: +5 to Gifts and Favors skill
   - Combat: Free Action - If target of guard action, gain +3 defense AND guard gains 1k1 to next attack
   - Status: Review for balance

#### Dragon Kitsuki Leverage Order
1. **Top 1:** Information Power
2. **Bottom 3:** Narrative Control, Administrative Power, Economic Power
3. **School Identity:** Detached investigators; outside politics
4. **Proposed Abilities:**
   - Rank 1: +5 to Investigation skill
   - Already has combat boost
5. **Status:** Already balanced

#### Lion Ikomas Leverage Order
1. **Top 2:** Military Power, Legitimacy
2. **Bottom 2:** Information Power, Economic Power
3. **School Identity:** Honored military historians
4. **Proposed Abilities:**
   - Rank 1: +5 to History, Storytelling, and Oratory skills
   - Combat: Free Action - Target may re-roll one die on their next roll
   - (Lion courtiers directly manipulate Glory/Fame at low ranks)
5. **Status:** Needs Implementation

#### Phoenix Isawa Leverage Order
1. **Top 1:** Information Power (tied with Legitimacy)
2. **Strong Areas:** Legitimacy, Administrative Power
3. **School Identity:** Scholars and researchers
4. **Proposed Abilities:**
   - Rank 1: +5 to Lore skill
   - Combat: Needs design (possibly support/casting related)
5. **Status:** Needs Implementation

#### Imperial Soshi/Kanpaku Leverage Order
1. **Top 1:** Legitimacy + Administrative Power (co-equal)
2. **Strong Areas:** Economic Power, Narrative Control
3. **School Identity:** Authority and law
4. **Proposed Abilities:**
   - Rank 1: +5 to Intimidate skill
   - Combat: Needs design (possibly authority-based)
5. **Status:** Needs Implementation

#### Unicorn Ide Leverage Order
1. **Top Area:** Economic Power (merchant focus, money effects, messenger-courier vibes)
2. **Secondary:** Social Influence (manipulation, recruitment)
3. **School Identity:** Wealthy merchants, traders, messengers, recruiters
4. **Proposed Abilities:**
   - Rank 1: +5 to Sincerity skill
   - Combat: Free Action - Increase all allies within 20' Initiative (including self) by +3 until end of next turn
   - Secondary Option: Horse-riding buffs (Ide have "rider" aesthetic)
5. **Status:** Needs Implementation

#### Scorpion Bayushi Leverage Order
1. **Top Area:** Information Power (secrets, blackmail)
2. **Secondary:** Social Influence + Narrative Control
3. **School Identity:** Spies, manipulators, masters of deception (not ninja-like)
4. **Note on Yasuki:** Yasuki are smugglers; make them "rogue-ier"
4. **Original Proposed Ability:** Free Action - Reduce target's to-hit rolls by 3 until next turn (bonus if target has disadvantage)
5. **Issues with Above:** Depends on Disadvantages (bookkeeping nightmare)
6. **Revised Proposals:**
   - Option A: Scorpion gets broad buff for targeting low-honor opponents (mirrors Crane buffing high-honor allies)
   - Option B: Simplify to: "Reduce target to-hit by 3" without disadvantage condition
   - Option C: Scorpion gets stealth/infiltration combat ability
7. **Status:** Decision Needed - Choose best option

### Rank 1 Bonus Implementation
- **Design:** Each clan courtier gets +5 bonus at rank 1 to their specialty skill
- **Possible Trade-off:** May require moving some rank 1 powers up to rank 2 for balance
- **Crane Baseline:** Already has +5, use as reference
- **Status:** Pending full implementation

### Courtier School Combat Utility
- **Objective:** Every courtier should have some combat utility (samurai are "those who fight")
- **Note on Crane Design:** Guard-based reaction buff is clever but controversial
- **Implementation:** Ensure each courtier gets +5 to initiative/defense/offense appropriately
- **Status:** Pending design completion

### Scorpion Cleanup Decision
- **Problem:** Current Scorpion design depends on tracking "disadvantages" (meta-game hassle)
- **Solution Options:**
  1. Allow "Lying and Tempting" to be full identity without mechanics reliance
  2. Mirror Crane (high-honor buff) with Scorpion (low-honor buff)
  3. Remove disadvantage condition entirely
- **Current thinking:** Option needs selection and implementation
- **Status:** Needs Re-Discussion

---

## Dueling System

### Problem Statement
- **Issue:** With the exception of Void points, duels have no decision points for either bushi or shugenja
- **Gap:** No courtier dueling system exists
- **Objective:** Create meaningful choices that involve all 5 rings

### Iaijitsu Duel Structure

#### Round 1 & 2 - Action Selection Phase
**Each player chooses ONE of the following actions, then reveals simultaneously:**

- **Focus** (Void + Meditation)
  - Gain +5 to your Iaijitsu strike roll
  
- **Assess** (Water - Perception + Battle)
  - Learn 2 traits or skills
  - Opposing player indicates what they will NOT pick next round
  
- **Readiness** (Fire - Agility + Kenjutsu)
  - Gain +5 to your hit roll
  
- **Dodge** (Air - Reflexes + Defense)
  - Gain +5 to your to-hit TN (enemy's difficulty to hit you)

- **Endure** (Earth - Willpower + Meditation)
  - Ignore all roll penalties for the remainder of the duel

#### Round 1 & 2 - Resolution
- Higher roll of the two chosen actions gets their chosen benefit then move to next round
- Each ring plays a role in different action options

#### Final Round - Striking Phase
- Both roll Iaijitsu + Reflexes
- Difference < 5: Both strike simultaneously
- Difference ≥ 5: Higher roller strikes first
- Follow normal combat resolution

### Courtier Dueling System
- **Status:** Needs Complete Design
- **Considerations:**
  - What traits/skills matter (Etiquette, Courtesies, Politics?)
  - How to involve all rings
  - Victory conditions beyond striking damage

### Implementation Status
- **Iaijitsu System:** Ready for playtesting
- **Courtier System:** Needs Design
- **Integration:** Needs clarification on how courtiers engage in non-combat duels

---

## Documentation & Clarity

### Single Source of Information Goal
- **Problem:** Rules poorly organized across main rulebook, errata, and source books
- **Solution:** Create unified document
- **Benefits:** Easier for players to find information
- **Status:** This project in progress

### Clarification Additions
- **Problem Examples:**
  - Various courtier classes reference honor loss for using Commerce but no explanation exists
  - Confusion between Shugenja (Shinto priest + Onmyōji) and Monk (Buddhist monk + Onmyōji)
- **Solution:** Add clarifying sentences and examples where needed
- **Status:** Needs systematic review

### Bloat Reduction
- **Goal:** Make rulebook shorter and faster to reference
- **Strategy:** "Take half your ideas and throw them away to avoid feature creep"
- **Actions:**
  - Remove unnecessary complexity (stances, free raises, etc.)
  - Consolidate overlapping rules
  - Simplify without losing depth
- **Status:** In Progress

### Shugenja vs. Monk Distinction
- **Problem:** Book has difficulty explaining subtle distinctions
- **Current Status:** Even designers have trouble with this
- **Action Needed:** Write clarifying sentences defining:
  - What makes a Shugenja fundamentally different
  - What makes a Monk fundamentally different
  - Why both use onmyōji elements
- **Status:** Not Started

---

## Brainstorming & Additional Ideas

### Combat Enhancements
- **Terrain Effects:** Consider adding simple terrain modifiers to combat (high ground, obstacles)
- **Called Shots:** Optional rules for targeting specific locations (risky but potentially higher reward)
- **Weapon Mastery Benefits:** Could tied skills progress unlock special maneuvers?
- **Positioning System:** Simplified grid or range brackets for important tactical info

### Magic System Expansions
- **Spell Components:** Should certain powerful spells require material components?
- **Ritual Casting:** Allow spells to be cast as rituals for reduced TN but longer casting time
- **Spell Schools:** Group spells by theme (Fire spells, Healing spells, etc.) for easier reference
- **Custom Spells:** Framework for GMs to create balanced new spells?

### Courtier Expansion Ideas
- **Duel of Wits:** Formal courtier combat using Skill checks and rhetoric
- **Intrigue Track:** Track active schemes and their progress toward completion
- **Faction System:** Leverage clan politics for additional mechanics rewards
- **Trade Goods System:** Detailed commerce rules for Unicorn and Crab merchants

### Character Advancement Alternatives
- **Milestone Advancement:** Consider offering milestone-based progression as alternative to XP
- **School-Specific Trees:** Each school gets unique visual/mechanical progression tree
- **Specialization Paths:** At certain ranks, choose narrow specialization vs. broad knowledge

### New Player Experience
- **Quick Start Rules:** Create essential 1-2 page rules summary for new players
- **Character Sheet Improvements:** Redesign sheet to highlight most-used information
- **Beginner Campaign:** Write introductory adventure designed for new players

### Mechanical Variants
- **Simplified Void Point System:** Consider capping Void points at 3 for balance
- **Simplified Honor System:** Optional rules for groups that don't want honor tracking
- **Fast Combat Optional Rules:** Allow experienced players to skip some combat details
- **Sanity/Stress System:** Optional mechanics for psychological impact of Shadowlands

### Setting Integration
- **Clan Authenticity Audit:** Ensure all mechanics reflect clan FFG/L5R canon
- **Historical Accuracy:** Review weapon stats against actual historical sources
- **Flavor Text Integration:** Add cultural context to each major mechanical system
- **NPC Templates:** Pre-built stat blocks for common NPC types

### Documentation Improvements
- **Visual Reference Charts:** Quick-lookup charts for modifiers, combat, spells
- **Decision Trees:** "Pick your character concept" flowcharts leading to optimal builds
- **Failure Mode Examples:** Show what happens when rolls fail, not just successes
- **Tools & Resources:** Index of recommended dice rollers, character sheet tools

---

## Glossary of Terms

- **Bushi:** Warrior class character
- **Shugenja:** Spell-casting priest class character
- **Courtier:** Political/social influence class character
- **Monk:** Religious warrior class character
- **Dueling:** Formal one-on-one combat (Iaijitsu, Shugenja duel, or Courtier challenge)
- **Raise:** Spending extra dice to add bonus effects to a roll
- **Void Points:** Special resource points used for re-rolls and special abilities
- **Rings:** Five core attributes (Air, Earth, Fire, Water, Void)
- **Traits:** Secondary attributes reflecting skill and quality
- **Shadowlands Taint:** Corruption from exposure to Shadowlands
- **Fame/Glory:** Reputation and renown trait
- **Insight Rank:** Level of character advancement and magical knowledge

---

## Version History
- **v0.1** - 2026-04-25: Initial compilation from discussion channel
- Current Status: Organization phase, decisions needed on marked items
