/**
 * A realistic, fully-populated example resume. Loading it is the fastest way for
 * a first-time visitor to see what the tool produces — the "see it working
 * before you type" pattern every paid builder opens with, minus the sign-up.
 */
import { defaultResume } from './schema';
import type { ResumeDoc } from './types';

export function sampleResume(name = 'Example resume'): ResumeDoc {
    const doc = defaultResume(name);
    doc.basics = {
        name: 'Avery Chen',
        label: 'Senior Frontend Engineer',
        email: 'avery.chen@example.com',
        phone: '+1 415 555 0142',
        url: 'https://averychen.dev',
        location: { city: 'San Francisco', region: 'CA', countryCode: 'US' },
        summary:
            'Frontend engineer with 8 years building design systems and high-traffic web apps. Led the migration of a 400k-line React codebase to TypeScript, cutting production type errors by 71%. Happiest where performance work meets accessibility.',
        photo: '',
        profiles: [
            { network: 'LinkedIn', username: 'averychen', url: 'https://linkedin.com/in/averychen' },
            { network: 'GitHub', username: 'averychen', url: 'https://github.com/averychen' },
        ],
    };
    doc.work = [
        {
            name: 'Northwind Software',
            position: 'Senior Frontend Engineer',
            startDate: '2021-03',
            endDate: '',
            location: 'San Francisco, CA',
            summary: '',
            highlights: [
                'Migrated a 400k-line React codebase to TypeScript over two quarters, reducing production type errors by 71%',
                'Cut Largest Contentful Paint from 4.1s to 1.3s by code-splitting the dashboard and preloading critical fonts',
                'Built the component library now used by 6 product teams, shipping 90+ accessible components',
                'Mentored 4 engineers; 2 were promoted to senior within 18 months',
            ],
        },
        {
            name: 'Lumen Analytics',
            position: 'Frontend Engineer',
            startDate: '2018-06',
            endDate: '2021-02',
            location: 'Remote',
            summary: '',
            highlights: [
                'Rebuilt the reporting UI in Vue 3, lifting weekly active usage 34%',
                'Automated visual regression testing across 120 screens, catching 40+ layout defects before release',
                'Reduced bundle size 38% by replacing moment.js and lodash with targeted utilities',
            ],
        },
    ];
    doc.education = [
        {
            institution: 'University of Washington',
            area: 'Computer Science',
            studyType: 'B.Sc.',
            startDate: '2014',
            endDate: '2018',
            score: '3.8 GPA',
            courses: [],
        },
    ];
    doc.skills = [
        { name: 'Languages', level: '', keywords: ['TypeScript', 'JavaScript', 'Python', 'SQL'] },
        { name: 'Frameworks', level: '', keywords: ['React', 'Vue 3', 'Next.js', 'Nuxt'] },
        { name: 'Tooling', level: '', keywords: ['Vite', 'Playwright', 'Vitest', 'Figma', 'CI/CD'] },
    ];
    doc.projects = [
        {
            name: 'Palette',
            description: 'Open-source contrast checker for design systems.',
            url: 'https://github.com/averychen/palette',
            highlights: [
                'Grew to 2.4k GitHub stars and 15k weekly npm downloads',
                'Ships a WCAG 2.2 audit that runs in under 50ms on a 500-token palette',
            ],
        },
    ];
    doc.certificates = [
        { name: 'Certified Accessibility Specialist (CPACC)', issuer: 'IAAP', date: '2023-05', url: '' },
    ];
    doc.languages = [
        { language: 'English', fluency: 'Native' },
        { language: 'Mandarin', fluency: 'Professional' },
    ];
    return doc;
}
