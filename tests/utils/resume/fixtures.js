/**
 * A fully-populated resume covering every section, used across the resume
 * test suite so the tests exercise real, representative data.
 */
import { defaultResume } from '@/utils/resume/schema';

// 1x1 transparent PNG.
export const TINY_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export function fullResume() {
    const d = defaultResume('Ada — Software Engineer');
    d.basics = {
        name: 'Ada Lovelace',
        label: 'Software Engineer',
        email: 'ada@example.com',
        phone: '+44 20 7946 0000',
        url: 'https://ada.dev',
        location: { city: 'London', region: 'England', countryCode: 'GB' },
        summary: 'Analytical engineer with a decade building reliable systems in TypeScript and Go.',
        photo: TINY_PNG,
        profiles: [
            { network: 'GitHub', username: 'ada', url: 'https://github.com/ada' },
            { network: 'LinkedIn', username: 'ada-lovelace', url: 'https://linkedin.com/in/ada-lovelace' },
        ],
    };
    d.work = [
        {
            name: 'Analytical Engines Ltd',
            position: 'Principal Engineer',
            startDate: '2021-03',
            endDate: '',
            location: 'Remote',
            summary: 'Led the platform team.',
            highlights: ['Cut build time by 60%', 'Mentored 5 engineers'],
        },
        {
            name: 'Babbage Co',
            position: 'Senior Engineer',
            startDate: '2017-01',
            endDate: '2021-02',
            location: 'London',
            summary: '',
            highlights: ['Shipped the billing service'],
        },
    ];
    d.education = [
        {
            institution: 'University of London',
            area: 'Mathematics',
            studyType: 'B.Sc.',
            startDate: '2013',
            endDate: '2017',
            score: 'First Class',
            courses: ['Numerical Analysis', 'Algorithms'],
        },
    ];
    d.skills = [
        { name: 'Languages', level: 'Advanced', keywords: ['TypeScript', 'Go', 'Python'] },
        { name: 'Cloud', level: '', keywords: ['AWS', 'Kubernetes'] },
    ];
    d.projects = [
        {
            name: 'OpenMetrics',
            description: 'A metrics toolkit.',
            url: 'https://github.com/ada/openmetrics',
            highlights: ['1k+ stars'],
        },
    ];
    d.certificates = [
        { name: 'CKA', issuer: 'CNCF', date: '2022-06', url: 'https://cncf.io/cka' },
    ];
    d.awards = [
        { title: 'Engineer of the Year', awarder: 'Analytical Engines Ltd', date: '2022', summary: 'For platform work.' },
    ];
    d.languages = [
        { language: 'English', fluency: 'Native' },
        { language: 'French', fluency: 'Professional' },
    ];
    d.interests = [{ name: 'Chess', keywords: ['strategy', 'endgames'] }];
    d.references = [{ name: 'Charles Babbage', reference: 'Available on request.' }];
    d.meta.customSections = [
        {
            id: 'cs-1',
            title: 'Publications',
            items: [
                { title: 'Notes on the Analytical Engine', description: '1843' },
                { title: 'On Bernoulli Numbers', description: '1843' },
            ],
        },
    ];
    return d;
}
