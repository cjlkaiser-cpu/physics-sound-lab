#!/usr/bin/env python3
"""
Tonnetz Simulation Analysis
Generates statistics and visualizations for the paper
"""

import sqlite3
import pandas as pd
import numpy as np
from pathlib import Path
import json

DB_PATH = Path(__file__).parent / 'results.db'
OUTPUT_DIR = Path(__file__).parent / 'output'

def load_data():
    """Load simulation data from SQLite"""
    conn = sqlite3.connect(DB_PATH)

    simulations = pd.read_sql_query("SELECT * FROM simulations", conn)
    statistics = pd.read_sql_query("SELECT * FROM statistics", conn)
    events = pd.read_sql_query("SELECT * FROM chord_events", conn)

    conn.close()

    return simulations, statistics, events

def analyze_default_batch(stats_df):
    """Analyze default batch simulations"""
    # Filter to default batches
    default = stats_df[stats_df['simulation_id'].isin(
        stats_df[~stats_df['chord_sequence'].isna()]['simulation_id']
    )]

    if len(default) == 0:
        print("No default batch data found")
        return None

    print("\n" + "="*60)
    print("DEFAULT BATCH ANALYSIS")
    print("="*60)

    metrics = {
        'total_transitions': default['total_transitions'],
        'unique_chords': default['unique_chords'],
        'adjacency_rate': default['adjacency_rate'],
        'avg_voice_leading': default['avg_voice_leading'],
        'p_count': default['p_count'],
        'l_count': default['l_count'],
        'r_count': default['r_count']
    }

    for name, data in metrics.items():
        print(f"\n{name}:")
        print(f"  Mean: {data.mean():.3f}")
        print(f"  Std:  {data.std():.3f}")
        print(f"  Min:  {data.min():.3f}")
        print(f"  Max:  {data.max():.3f}")

    # Transformation distribution
    total_p = default['p_count'].sum()
    total_l = default['l_count'].sum()
    total_r = default['r_count'].sum()
    total_trans = total_p + total_l + total_r

    if total_trans > 0:
        print(f"\nTransformation Distribution:")
        print(f"  P (Parallel):     {total_p:5d} ({100*total_p/total_trans:.1f}%)")
        print(f"  L (Leading-tone): {total_l:5d} ({100*total_l/total_trans:.1f}%)")
        print(f"  R (Relative):     {total_r:5d} ({100*total_r/total_trans:.1f}%)")

    return default

def analyze_chord_coverage(stats_df):
    """Analyze which chords are visited most frequently"""
    print("\n" + "="*60)
    print("CHORD COVERAGE ANALYSIS")
    print("="*60)

    all_chords = []
    for seq in stats_df['chord_sequence'].dropna():
        all_chords.extend(seq.split(','))

    if not all_chords:
        print("No chord sequence data found")
        return None

    from collections import Counter
    chord_counts = Counter(all_chords)

    print(f"\nTotal chord events: {len(all_chords)}")
    print(f"Unique chords: {len(chord_counts)}")

    print("\nTop 10 most visited chords:")
    for chord, count in chord_counts.most_common(10):
        pct = 100 * count / len(all_chords)
        print(f"  {chord:6s}: {count:5d} ({pct:.1f}%)")

    print("\nLeast visited chords:")
    for chord, count in chord_counts.most_common()[-5:]:
        pct = 100 * count / len(all_chords)
        print(f"  {chord:6s}: {count:5d} ({pct:.1f}%)")

    return chord_counts

def analyze_transitions(events_df):
    """Analyze transition patterns"""
    print("\n" + "="*60)
    print("TRANSITION ANALYSIS")
    print("="*60)

    if len(events_df) == 0:
        print("No event data found")
        return None

    # Adjacent vs non-adjacent
    adjacent = events_df['is_adjacent'].sum()
    total = len(events_df)

    print(f"\nTotal transitions: {total}")
    print(f"Adjacent transitions: {adjacent} ({100*adjacent/total:.1f}%)")

    # Transformation counts
    trans_counts = events_df['transformation'].value_counts()
    print("\nTransformation counts:")
    for trans, count in trans_counts.items():
        if trans and trans != 'None':
            print(f"  {trans}: {count}")

    # Voice leading distribution
    vl = events_df['voice_leading'].dropna()
    if len(vl) > 0:
        print(f"\nVoice Leading (semitones):")
        print(f"  Mean: {vl.mean():.3f}")
        print(f"  Std:  {vl.std():.3f}")
        print(f"  Max:  {vl.max():.3f}")

    # Transition matrix
    print("\nBuilding transition matrix...")
    transitions = events_df[['prev_chord', 'chord_name']].dropna()
    if len(transitions) > 0:
        trans_matrix = pd.crosstab(transitions['prev_chord'], transitions['chord_name'])

        # Save to CSV
        OUTPUT_DIR.mkdir(exist_ok=True)
        trans_matrix.to_csv(OUTPUT_DIR / 'transition_matrix.csv')
        print(f"  Saved to {OUTPUT_DIR / 'transition_matrix.csv'}")

    return events_df

def generate_paper_table(stats_df, sims_df):
    """Generate Table 1 for the paper"""
    print("\n" + "="*60)
    print("TABLE 1: SIMULATION RESULTS")
    print("="*60)

    # Merge to get batch info
    merged = stats_df.merge(sims_df[['id', 'batch_name', 'force', 'friction']],
                            left_on='simulation_id', right_on='id')

    # Identify batch types
    chaotic = merged[merged['force'] > 0]
    random = merged[merged['force'] == 0]

    table_data = []

    if len(chaotic) > 0:
        chaotic_row = {
            'Method': 'Chaotic (Ours)',
            'n': len(chaotic),
            'Transitions': f"{chaotic['total_transitions'].mean():.1f} +/- {chaotic['total_transitions'].std():.1f}",
            'Unique Chords': f"{chaotic['unique_chords'].mean():.1f} +/- {chaotic['unique_chords'].std():.1f}",
            'Adjacency': f"{chaotic['adjacency_rate'].mean()*100:.1f}%",
            'Voice Leading': f"{chaotic['avg_voice_leading'].mean():.2f}"
        }
        table_data.append(chaotic_row)

    if len(random) > 0:
        random_row = {
            'Method': 'Random Baseline',
            'n': len(random),
            'Transitions': f"{random['total_transitions'].mean():.1f} +/- {random['total_transitions'].std():.1f}",
            'Unique Chords': f"{random['unique_chords'].mean():.1f} +/- {random['unique_chords'].std():.1f}",
            'Adjacency': f"{random['adjacency_rate'].mean()*100:.1f}%",
            'Voice Leading': f"{random['avg_voice_leading'].mean():.2f}"
        }
        table_data.append(random_row)

    if table_data:
        table_df = pd.DataFrame(table_data)
        print("\n" + table_df.to_string(index=False))

        OUTPUT_DIR.mkdir(exist_ok=True)
        table_df.to_csv(OUTPUT_DIR / 'table1_results.csv', index=False)
        print(f"\nSaved to {OUTPUT_DIR / 'table1_results.csv'}")

    return table_data

def export_for_figures(stats_df, events_df):
    """Export data for figure generation"""
    OUTPUT_DIR.mkdir(exist_ok=True)

    # Coverage histogram data
    coverage = stats_df['unique_chords'].value_counts().sort_index()
    coverage.to_csv(OUTPUT_DIR / 'coverage_histogram.csv')

    # Adjacency rate distribution
    adj_rates = stats_df['adjacency_rate']
    adj_rates.to_csv(OUTPUT_DIR / 'adjacency_distribution.csv', index=False)

    # Sample chord sequences (first 5)
    samples = stats_df['chord_sequence'].head(5)
    with open(OUTPUT_DIR / 'sample_sequences.json', 'w') as f:
        json.dump(samples.tolist(), f, indent=2)

    print(f"\nExported figure data to {OUTPUT_DIR}/")

def main():
    """Main analysis function"""
    print("Tonnetz Simulation Analysis")
    print("===========================\n")

    if not DB_PATH.exists():
        print(f"Database not found: {DB_PATH}")
        print("Run simulations first: node run_batch.js")
        return

    sims, stats, events = load_data()

    print(f"Loaded {len(sims)} simulations")
    print(f"Loaded {len(stats)} statistics records")
    print(f"Loaded {len(events)} chord events")

    if len(stats) == 0:
        print("\nNo data to analyze. Run simulations first.")
        return

    # Run analyses
    analyze_default_batch(stats)
    analyze_chord_coverage(stats)
    analyze_transitions(events)
    generate_paper_table(stats, sims)
    export_for_figures(stats, events)

    print("\n" + "="*60)
    print("Analysis complete!")
    print("="*60)

if __name__ == '__main__':
    main()
