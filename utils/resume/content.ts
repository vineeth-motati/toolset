/**
 * Static, curated writing helpers — action verbs and role-tagged bullet
 * starters — surfaced inline in the editor. No network, no AI. This is the
 * "local & private" answer to the paid tools' AI writing feature.
 */

export const ACTION_VERBS: string[] = [
    'Led', 'Built', 'Designed', 'Launched', 'Delivered', 'Shipped', 'Improved',
    'Reduced', 'Increased', 'Automated', 'Migrated', 'Architected', 'Owned',
    'Drove', 'Scaled', 'Optimized', 'Streamlined', 'Implemented', 'Developed',
    'Created', 'Managed', 'Mentored', 'Coordinated', 'Negotiated', 'Analyzed',
    'Resolved', 'Refactored', 'Integrated', 'Championed', 'Spearheaded',
];

/** Bullet templates grouped by loose role family; `{}` are fill-in hints. */
export const PHRASE_LIBRARY: Record<string, string[]> = {
    'General impact': [
        'Increased {metric} by {X}% through {action}',
        'Reduced {cost/time} by {X}% by {action}',
        'Delivered {project} {ahead of schedule / under budget}',
        'Owned {area} end-to-end, from {start} to {outcome}',
    ],
    Engineering: [
        'Built {feature} used by {N} users, improving {metric} by {X}%',
        'Reduced page load time from {A}s to {B}s by {optimization}',
        'Migrated {system} to {tech}, cutting {cost/incidents} by {X}%',
        'Automated {process}, saving {N} hours per {week/month}',
    ],
    Management: [
        'Led a team of {N} to deliver {outcome}',
        'Mentored {N} engineers; {promoted/grew} {N} to {level}',
        'Defined roadmap for {area}, aligning {stakeholders}',
    ],
    'Sales / Marketing': [
        'Grew {pipeline/revenue} by {X}% ({$amount}) in {timeframe}',
        'Closed {N} deals worth {$amount}, exceeding quota by {X}%',
        'Launched {campaign}, generating {N} leads at {X}% lower CAC',
    ],
    Design: [
        'Redesigned {flow}, lifting {conversion/engagement} by {X}%',
        'Built and maintained a design system adopted across {N} products',
        'Ran {N} usability tests that informed {decision}',
    ],
};

export const SUMMARY_STARTERS: string[] = [
    '{Role} with {N}+ years building {domain} products…',
    'Results-driven {role} specializing in {skills}…',
    '{Role} focused on {impact area}, with a track record of {outcome}…',
];
