interface AnimationProperty {
    transform?: string;
    backgroundColor?: string;
    opacity?: string;
    width?: string;
    height?: string;
    background?: string;
    textDecorationThickness?: string;
    textDecorationColor?: string;
    boxShadow?: string;
    backgroundPosition?: string;
    borderRadius?: string;
    color?: string;
    filter?: string;
    borderWidth?: string;
    borderColor?: string;
    margin?: string;
    padding?: string;
    left?: string;
    top?: string;
    right?: string;
    bottom?: string;
    zIndex?: string;
    textShadow?: string;
    borderRight?: string;
    strokeWidth?: string;
    strokeDasharray?: string;
    fill?: string;
    stroke?: string;
    d?: string;
    perspective?: string;
}

interface Keyframe {
    percentage: number;
    properties: AnimationProperty;
}

interface Animation {
    animationName: string;
    duration: number;
    timingFunction: string;
    iterationCount: number | 'infinite';
    direction: 'normal' | 'alternate' | 'reverse' | 'alternate-reverse';
    keyframes: Keyframe[];
}

interface AnimationCategory {
    [key: string]: {
        [key: string]: Animation;
    };
}

interface AnimationPresets {
    basic: AnimationCategory;
    entrances: AnimationCategory;
    exits: AnimationCategory;
    text: AnimationCategory;
    attention: AnimationCategory;
    background: AnimationCategory;
    threeD: AnimationCategory;
    complex: AnimationCategory;
    hover: AnimationCategory;
    svg: AnimationCategory;
}

export const animationPresets: AnimationPresets = {
    basic: {
        scale: {
            scaleUp: {
                animationName: 'scaleUp',
                duration: 1,
                timingFunction: 'ease',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1.5)',
                            backgroundColor: '#EF4444',
                            opacity: '0.8',
                        },
                    },
                ],
            },
            scaleDown: {
                animationName: 'scaleDown',
                duration: 1,
                timingFunction: 'ease',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1.5)',
                            backgroundColor: '#EF4444',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                ],
            },
            scaleBig: {
                animationName: 'scaleBig',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            backgroundColor: '#10B981',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'scale(2)',
                            backgroundColor: '#F59E0B',
                            opacity: '0.7',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1)',
                            backgroundColor: '#10B981',
                            opacity: '1',
                        },
                    },
                ],
            },
            scaleSmall: {
                animationName: 'scaleSmall',
                duration: 1,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'scale(0.5)',
                            backgroundColor: '#EF4444',
                            opacity: '0.6',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                ],
            },
            // Additional scale animations
            scaleElastic: {
                animationName: 'scaleElastic',
                duration: 1.5,
                timingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 60,
                        properties: {
                            transform: 'scale(1.3)',
                            opacity: '0.9',
                        },
                    },
                    {
                        percentage: 80,
                        properties: {
                            transform: 'scale(0.95)',
                            opacity: '0.95',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                ],
            },
        },
        rotate: {
            rotate360: {
                animationName: 'rotate360',
                duration: 2,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                            backgroundColor: '#10B981',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(360deg)',
                            backgroundColor: '#EF4444',
                            opacity: '1',
                        },
                    },
                ],
            },
            rotate90: {
                animationName: 'rotate90',
                duration: 1,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(90deg)',
                            backgroundColor: '#EF4444',
                            opacity: '1',
                        },
                    },
                ],
            },
            rotate180: {
                animationName: 'rotate180',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                            backgroundColor: '#6366F1',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(180deg)',
                            backgroundColor: '#F43F5E',
                            opacity: '0.9',
                        },
                    },
                ],
            },
            rotate270: {
                animationName: 'rotate270',
                duration: 2.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                            backgroundColor: '#F59E0B',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(270deg)',
                            backgroundColor: '#10B981',
                            opacity: '0.8',
                        },
                    },
                ],
            },
            rotateInfinite: {
                animationName: 'rotateInfinite',
                duration: 3,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                            borderColor: '#FF5722',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(360deg)',
                            borderColor: '#2196F3',
                            opacity: '1',
                        },
                    },
                ],
            },
        },
        translate: {
            translateUp: {
                animationName: 'translateUp',
                duration: 1,
                timingFunction: 'ease',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(0)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(-20px)',
                            backgroundColor: '#EF4444',
                            opacity: '0.8',
                        },
                    },
                ],
            },
            translateDown: {
                animationName: 'translateDown',
                duration: 1,
                timingFunction: 'ease',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(-20px)',
                            backgroundColor: '#EF4444',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(0)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                ],
            },
            translateLeft: {
                animationName: 'translateLeft',
                duration: 1.2,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(0)',
                            backgroundColor: '#10B981',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(-30px)',
                            backgroundColor: '#F59E0B',
                            opacity: '0.9',
                        },
                    },
                ],
            },
            translateRight: {
                animationName: 'translateRight',
                duration: 1.2,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(0)',
                            backgroundColor: '#6366F1',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(30px)',
                            backgroundColor: '#F43F5E',
                            opacity: '0.9',
                        },
                    },
                ],
            },
            translateDiagonal: {
                animationName: 'translateDiagonal',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translate(0, 0)',
                            backgroundColor: '#FF4081',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'translate(50px, 50px)',
                            backgroundColor: '#40C4FF',
                            opacity: '0.7',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translate(0, 0)',
                            backgroundColor: '#FF4081',
                            opacity: '1',
                        },
                    },
                ],
            },
        },
        opacity: {
            fadeIn: {
                animationName: 'fadeIn',
                duration: 1,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                        },
                    },
                ],
            },
            fadeOut: {
                animationName: 'fadeOut',
                duration: 1,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '0',
                        },
                    },
                ],
            },
            fadeOutSlow: {
                animationName: 'fadeOutSlow',
                duration: 2,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '0',
                        },
                    },
                ],
            },
            fadeInSlow: {
                animationName: 'fadeInSlow',
                duration: 2,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                        },
                    },
                ],
            },
            fadeOutFast: {
                animationName: 'fadeOutFast',
                duration: 0.5,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '0',
                        },
                    },
                ],
            },
            fadeInFast: {
                animationName: 'fadeInFast',
                duration: 0.5,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                        },
                    },
                ],
            },
            fadeOutIn: {
                animationName: 'fadeOutIn',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                        },
                    },
                ],
            },
            crossFade: {
                animationName: 'crossFade',
                duration: 3,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                        },
                    },
                ],
            },
        },
        color: {
            colorChange: {
                animationName: 'colorChange',
                duration: 1,
                timingFunction: 'ease',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundColor: '#3B82F6',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundColor: '#EF4444',
                        },
                    },
                ],
            },
            colorShift: {
                animationName: 'colorShift',
                duration: 3,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundColor: '#F43F5E',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            backgroundColor: '#10B981',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundColor: '#6366F1',
                        },
                    },
                ],
            },
            gradientGlow: {
                animationName: 'gradientGlow',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            background:
                                'linear-gradient(45deg, #FF6B6B, #FFD93D)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            background:
                                'linear-gradient(45deg, #6BCB77, #4D96FF)',
                        },
                    },
                ],
            },
            rainbow: {
                animationName: 'rainbow',
                duration: 4,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundColor: '#FF0000',
                        },
                    },
                    {
                        percentage: 16.66,
                        properties: {
                            backgroundColor: '#FF7F00',
                        },
                    },
                    {
                        percentage: 33.33,
                        properties: {
                            backgroundColor: '#FFFF00',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            backgroundColor: '#00FF00',
                        },
                    },
                    {
                        percentage: 66.66,
                        properties: {
                            backgroundColor: '#0000FF',
                        },
                    },
                    {
                        percentage: 83.33,
                        properties: {
                            backgroundColor: '#4B0082',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundColor: '#8B00FF',
                        },
                    },
                ],
            },
            neonGlow: {
                animationName: 'neonGlow',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            color: '#0FF',
                            textShadow:
                                '0 0 5px #0FF, 0 0 10px #0FF, 0 0 20px #0FF',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            color: '#F0F',
                            textShadow:
                                '0 0 10px #F0F, 0 0 20px #F0F, 0 0 30px #F0F',
                        },
                    },
                ],
            },
        },
        skew: {
            skewX: {
                animationName: 'skewX',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'skewX(0deg)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'skewX(20deg)',
                            backgroundColor: '#EF4444',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'skewX(0deg)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                ],
            },
            skewY: {
                animationName: 'skewY',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'skewY(0deg)',
                            backgroundColor: '#10B981',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'skewY(20deg)',
                            backgroundColor: '#F59E0B',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'skewY(0deg)',
                            backgroundColor: '#10B981',
                            opacity: '1',
                        },
                    },
                ],
            },
            skewBounce: {
                animationName: 'skewBounce',
                duration: 2,
                timingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'skew(0deg, 0deg)',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'skew(20deg, 20deg)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'skew(0deg, 0deg)',
                        },
                    },
                ],
            },
        },
        flip: {
            flipHorizontal: {
                animationName: 'flipHorizontal',
                duration: 1,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotateY(0deg)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'rotateY(180deg)',
                            backgroundColor: '#EF4444',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotateY(0deg)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                ],
            },
            flipVertical: {
                animationName: 'flipVertical',
                duration: 1,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotateX(0deg)',
                            backgroundColor: '#10B981',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'rotateX(180deg)',
                            backgroundColor: '#F59E0B',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotateX(0deg)',
                            backgroundColor: '#10B981',
                            opacity: '1',
                        },
                    },
                ],
            },
            flipInfinite: {
                animationName: 'flipInfinite',
                duration: 2,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotateY(0deg)',
                            backgroundColor: '#FF4081',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotateY(360deg)',
                            backgroundColor: '#40C4FF',
                            opacity: '1',
                        },
                    },
                ],
            },
        },
        spin: {
            spin: {
                animationName: 'spin',
                duration: 2,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(360deg)',
                            backgroundColor: '#EF4444',
                            opacity: '1',
                        },
                    },
                ],
            },
            spinReverse: {
                animationName: 'spinReverse',
                duration: 2,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'reverse',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                            backgroundColor: '#EF4444',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(-360deg)',
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                ],
            },
            spinPulse: {
                animationName: 'spinPulse',
                duration: 3,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg) scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'rotate(180deg) scale(1.2)',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(360deg) scale(1)',
                            opacity: '1',
                        },
                    },
                ],
            },
            spinBounce: {
                animationName: 'spinBounce',
                duration: 2.5,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'rotate(180deg) scale(1.5)',
                            opacity: '0.7',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(360deg)',
                            opacity: '1',
                        },
                    },
                ],
            },
        },
        // Additional basic animations (skew, flip, spin, etc.)
    },
    entrances: {
        fade: {
            fadeIn: {
                animationName: 'fadeIn',
                duration: 1,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '0',
                            transform: 'translateY(-20px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                            transform: 'translateY(0)',
                        },
                    },
                ],
            },
            fadeInDown: {
                animationName: 'fadeInDown',
                duration: 1.2,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '0',
                            transform: 'translateY(-50px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                            transform: 'translateY(0)',
                        },
                    },
                ],
            },
            fadeInUp: {
                animationName: 'fadeInUp',
                duration: 1.2,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '0',
                            transform: 'translateY(50px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                            transform: 'translateY(0)',
                        },
                    },
                ],
            },
            fadeInLeft: {
                animationName: 'fadeInLeft',
                duration: 1.5,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '0',
                            transform: 'translateX(-50px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                            transform: 'translateX(0)',
                        },
                    },
                ],
            },
            fadeInRight: {
                animationName: 'fadeInRight',
                duration: 1.5,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '0',
                            transform: 'translateX(50px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                            transform: 'translateX(0)',
                        },
                    },
                ],
            },
            // Additional fade entrances
            fadeInScale: {
                animationName: 'fadeInScale',
                duration: 1.5,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '0',
                            transform: 'scale(0.5)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                            transform: 'scale(1)',
                        },
                    },
                ],
            },
        },
        slide: {
            slideInLeft: {
                animationName: 'slideInLeft',
                duration: 1.5,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(-100%)',
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(0)',
                            opacity: '1',
                        },
                    },
                ],
            },
            slideInRight: {
                animationName: 'slideInRight',
                duration: 1.5,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(100%)',
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(0)',
                            opacity: '1',
                        },
                    },
                ],
            },
            slideInTop: {
                animationName: 'slideInTop',
                duration: 1.5,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(-100%)',
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(0)',
                            opacity: '1',
                        },
                    },
                ],
            },
            slideInBottom: {
                animationName: 'slideInBottom',
                duration: 1.5,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(100%)',
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(0)',
                            opacity: '1',
                        },
                    },
                ],
            },
            slideInDiagonal: {
                animationName: 'slideInDiagonal',
                duration: 2,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translate(-50px, -50px)',
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translate(0, 0)',
                            opacity: '1',
                        },
                    },
                ],
            },
            // Additional slide entrances
            slideInBounce: {
                animationName: 'slideInBounce',
                duration: 2,
                timingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(-100%)',
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 60,
                        properties: {
                            transform: 'translateY(10%)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 80,
                        properties: {
                            transform: 'translateY(-5%)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(0)',
                        },
                    },
                ],
            },
        },
        zoom: {
            zoomIn: {
                animationName: 'zoomIn',
                duration: 1,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(0)',
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                ],
            },
            zoomOut: {
                animationName: 'zoomOut',
                duration: 1,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(0)',
                            opacity: '0',
                        },
                    },
                ],
            },
            zoomInDown: {
                animationName: 'zoomInDown',
                duration: 1.2,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(0) translateY(-50px)',
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1) translateY(0)',
                            opacity: '1',
                        },
                    },
                ],
            },
            zoomInUp: {
                animationName: 'zoomInUp',
                duration: 1.2,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(0) translateY(50px)',
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1) translateY(0)',
                            opacity: '1',
                        },
                    },
                ],
            },
            zoomBounce: {
                animationName: 'zoomBounce',
                duration: 2,
                timingFunction: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'scale(1.5)',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                ],
            },
            zoomPulse: {
                animationName: 'zoomPulse',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1.2)',
                            opacity: '0.9',
                        },
                    },
                ],
            },
        },
        // Additional entrances like flip, bounce, etc.
    },
    exits: {
        fade: {
            fadeOut: {
                animationName: 'fadeOut',
                duration: 1,
                timingFunction: 'ease-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                            transform: 'translateY(0)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '0',
                            transform: 'translateY(-20px)',
                        },
                    },
                ],
            },
            fadeOutUp: {
                animationName: 'fadeOutUp',
                duration: 1.2,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                            transform: 'translateY(0)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '0',
                            transform: 'translateY(-50px)',
                        },
                    },
                ],
            },
            fadeOutDown: {
                animationName: 'fadeOutDown',
                duration: 1.2,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                            transform: 'translateY(0)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '0',
                            transform: 'translateY(50px)',
                        },
                    },
                ],
            },
            fadeOutLeft: {
                animationName: 'fadeOutLeft',
                duration: 1.5,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                            transform: 'translateX(0)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '0',
                            transform: 'translateX(-100%)',
                        },
                    },
                ],
            },
            fadeOutRight: {
                animationName: 'fadeOutRight',
                duration: 1.5,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                            transform: 'translateX(0)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '0',
                            transform: 'translateX(100%)',
                        },
                    },
                ],
            },
            fadeOutScale: {
                animationName: 'fadeOutScale',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(0.5)',
                            opacity: '0',
                        },
                    },
                ],
            },
        },
        slide: {
            slideOutLeft: {
                animationName: 'slideOutLeft',
                duration: 1.5,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(0)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(-100%)',
                            opacity: '0',
                        },
                    },
                ],
            },
            slideOutRight: {
                animationName: 'slideOutRight',
                duration: 1.5,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(0)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(100%)',
                            opacity: '0',
                        },
                    },
                ],
            },
            slideOutTop: {
                animationName: 'slideOutTop',
                duration: 1.5,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(0)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(-100%)',
                            opacity: '0',
                        },
                    },
                ],
            },
            slideOutBottom: {
                animationName: 'slideOutBottom',
                duration: 1.5,
                timingFunction: 'ease-in',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(0)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(100%)',
                            opacity: '0',
                        },
                    },
                ],
            },
            slideOutDiagonal: {
                animationName: 'slideOutDiagonal',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translate(0, 0)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translate(50px, -50px)',
                            opacity: '0',
                        },
                    },
                ],
            },
        },
        shake: {
            shakeEffect: {
                animationName: 'shakeEffect',
                duration: 0.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(0)',
                        },
                    },
                    {
                        percentage: 20,
                        properties: {
                            transform: 'translateX(-10px)',
                        },
                    },
                    {
                        percentage: 40,
                        properties: {
                            transform: 'translateX(10px)',
                        },
                    },
                    {
                        percentage: 60,
                        properties: {
                            transform: 'translateX(-10px)',
                        },
                    },
                    {
                        percentage: 80,
                        properties: {
                            transform: 'translateX(10px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(0)',
                        },
                    },
                ],
            },
            shakeVertical: {
                animationName: 'shakeVertical',
                duration: 0.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(0)',
                        },
                    },
                    {
                        percentage: 20,
                        properties: {
                            transform: 'translateY(-10px)',
                        },
                    },
                    {
                        percentage: 40,
                        properties: {
                            transform: 'translateY(10px)',
                        },
                    },
                    {
                        percentage: 60,
                        properties: {
                            transform: 'translateY(-10px)',
                        },
                    },
                    {
                        percentage: 80,
                        properties: {
                            transform: 'translateY(10px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(0)',
                        },
                    },
                ],
            },
            shakeDiagonal: {
                animationName: 'shakeDiagonal',
                duration: 0.7,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translate(0, 0)',
                        },
                    },
                    {
                        percentage: 25,
                        properties: {
                            transform: 'translate(-10px, 10px)',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'translate(10px, -10px)',
                        },
                    },
                    {
                        percentage: 75,
                        properties: {
                            transform: 'translate(-10px, 10px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translate(0, 0)',
                        },
                    },
                ],
            },
            shakeInfinite: {
                animationName: 'shakeInfinite',
                duration: 1,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translate(0, 0)',
                        },
                    },
                    {
                        percentage: 25,
                        properties: {
                            transform: 'translate(5px, 5px)',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'translate(-5px, -5px)',
                        },
                    },
                    {
                        percentage: 75,
                        properties: {
                            transform: 'translate(5px, 5px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translate(0, 0)',
                        },
                    },
                ],
            },
        },
        wobble: {
            wobbleEffect: {
                animationName: 'wobbleEffect',
                duration: 1,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(0%) rotate(0deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 15,
                        properties: {
                            transform: 'translateX(-25%) rotate(-5deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 30,
                        properties: {
                            transform: 'translateX(20%) rotate(3deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 45,
                        properties: {
                            transform: 'translateX(-15%) rotate(-3deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 60,
                        properties: {
                            transform: 'translateX(10%) rotate(2deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 75,
                        properties: {
                            transform: 'translateX(-5%) rotate(-1deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(0%) rotate(0deg)',
                            opacity: '1',
                        },
                    },
                ],
            },
            wobbleVertical: {
                animationName: 'wobbleVertical',
                duration: 1,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(0%) rotate(0deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 15,
                        properties: {
                            transform: 'translateY(-25%) rotate(5deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 30,
                        properties: {
                            transform: 'translateY(20%) rotate(-3deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 45,
                        properties: {
                            transform: 'translateY(-15%) rotate(3deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 60,
                        properties: {
                            transform: 'translateY(10%) rotate(-2deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 75,
                        properties: {
                            transform: 'translateY(-5%) rotate(1deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(0%) rotate(0deg)',
                            opacity: '1',
                        },
                    },
                ],
            },
            wobbleInfinite: {
                animationName: 'wobbleInfinite',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(0%) rotate(0deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 25,
                        properties: {
                            transform: 'translateX(-10%) rotate(-5deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'translateX(10%) rotate(5deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 75,
                        properties: {
                            transform: 'translateX(-10%) rotate(-5deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(0%) rotate(0deg)',
                            opacity: '1',
                        },
                    },
                ],
            },
        },
        // Additional exits like shake, wobble, etc.
    },
    text: {
        typing: {
            typingEffect: {
                animationName: 'typingEffect',
                duration: 3,
                timingFunction: 'steps(40, end)',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            width: '0ch',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            width: '20ch',
                            opacity: '1',
                        },
                    },
                ],
            },
            blinkingCursor: {
                animationName: 'blinkingCursor',
                duration: 0.8,
                timingFunction: 'steps(2, start)',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            borderRight: '2px solid black',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            borderRight: '2px solid transparent',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            borderRight: '2px solid black',
                        },
                    },
                ],
            },
        },
        highlight: {
            textHighlight: {
                animationName: 'textHighlight',
                duration: 2,
                timingFunction: 'ease',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundColor: '#FFFF00',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundColor: '#FFD700',
                        },
                    },
                ],
            },
            textGlow: {
                animationName: 'textGlow',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            color: '#FFFFFF',
                            textShadow: '0 0 5px #FFFFFF, 0 0 10px #FFFFFF',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            color: '#FFD700',
                            textShadow: '0 0 20px #FFD700, 0 0 30px #FFD700',
                        },
                    },
                ],
            },
            underlinePulse: {
                animationName: 'underlinePulse',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            textDecorationThickness: '2px',
                            textDecorationColor: '#3B82F6',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            textDecorationThickness: '4px',
                            textDecorationColor: '#EF4444',
                        },
                    },
                ],
            },
            shimmer: {
                animationName: 'shimmer',
                duration: 2,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundPosition: '-500px 0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundPosition: '500px 0',
                        },
                    },
                ],
            },
            wave: {
                animationName: 'waveEffect',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(0px)',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'translateY(-10px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(0px)',
                        },
                    },
                ],
            },
            glitch: {
                animationName: 'glitchEffect',
                duration: 1,
                timingFunction: 'steps(2, end)',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translate(0)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 20,
                        properties: {
                            transform: 'translate(-2px, 2px)',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 40,
                        properties: {
                            transform: 'translate(2px, -2px)',
                            opacity: '0.9',
                        },
                    },
                    {
                        percentage: 60,
                        properties: {
                            transform: 'translate(-2px, 2px)',
                            opacity: '0.7',
                        },
                    },
                    {
                        percentage: 80,
                        properties: {
                            transform: 'translate(2px, -2px)',
                            opacity: '0.85',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translate(0)',
                            opacity: '1',
                        },
                    },
                ],
            },
        },
        attention: {
            pulse: {
                animationName: 'pulseEffect',
                duration: 1,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1.1)',
                            opacity: '0.8',
                        },
                    },
                ],
            },
            heartbeat: {
                animationName: 'heartbeatEffect',
                duration: 1.2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 25,
                        properties: {
                            transform: 'scale(1.2)',
                            opacity: '0.9',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 75,
                        properties: {
                            transform: 'scale(1.2)',
                            opacity: '0.9',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                ],
            },
            neonPulse: {
                animationName: 'neonPulseEffect',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            boxShadow:
                                '0 0 5px #10B981, 0 0 10px #10B981, 0 0 20px #10B981',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            boxShadow:
                                '0 0 10px #10B981, 0 0 20px #10B981, 0 0 30px #10B981',
                        },
                    },
                ],
            },
            flash: {
                animationName: 'flashEffect',
                duration: 1,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            opacity: '0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            opacity: '1',
                        },
                    },
                ],
            },
            shimmer: {
                animationName: 'shimmer',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundPosition: '-500px 0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundPosition: '500px 0',
                        },
                    },
                ],
            },
            // Additional attention animations
            attentionBounce: {
                animationName: 'attentionBounce',
                duration: 1,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(0)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'translateY(-10px)',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(0)',
                            opacity: '1',
                        },
                    },
                ],
            },
            attentionShake: {
                animationName: 'attentionShake',
                duration: 0.8,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(0)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 25,
                        properties: {
                            transform: 'translateX(-5px)',
                            opacity: '0.9',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'translateX(5px)',
                            opacity: '0.9',
                        },
                    },
                    {
                        percentage: 75,
                        properties: {
                            transform: 'translateX(-5px)',
                            opacity: '0.9',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(0)',
                            opacity: '1',
                        },
                    },
                ],
            },
        },
        background: {
            colorChange: {
                animationName: 'backgroundColorChange',
                duration: 3,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundColor: '#FF0000',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            backgroundColor: '#00FF00',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundColor: '#0000FF',
                        },
                    },
                ],
            },
            gradientShift: {
                animationName: 'gradientShiftEffect',
                duration: 5,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            background:
                                'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 100%)',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            background:
                                'linear-gradient(45deg, #a1c4fd 0%, #c2e9fb 100%)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            background:
                                'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 100%)',
                        },
                    },
                ],
            },
            rotatingGradient: {
                animationName: 'rotatingGradientEffect',
                duration: 10,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            background:
                                'linear-gradient(0deg, #FFDEE9 0%, #B5FFFC 100%)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            background:
                                'linear-gradient(360deg, #FFDEE9 0%, #B5FFFC 100%)',
                        },
                    },
                ],
            },
            morphingBackground: {
                animationName: 'morphingBackgroundEffect',
                duration: 4,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            background:
                                'radial-gradient(circle, #ff9a9e 0%, #fad0c4 100%)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            background:
                                'radial-gradient(circle, #a1c4fd 0%, #c2e9fb 100%)',
                        },
                    },
                ],
            },
            pulsingBackground: {
                animationName: 'pulsingBackgroundEffect',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundColor: '#6366F1',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundColor: '#3B82F6',
                            opacity: '1',
                        },
                    },
                ],
            },
            animatedBackground: {
                animationName: 'animatedBackgroundEffect',
                duration: 6,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            background:
                                'linear-gradient(90deg, #e66465, #9198e5)',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            background:
                                'linear-gradient(270deg, #9198e5, #e66465)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            background:
                                'linear-gradient(90deg, #e66465, #9198e5)',
                        },
                    },
                ],
            },
            // Additional background animations
            movingStars: {
                animationName: 'movingStarsEffect',
                duration: 10,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundPosition: '0 0',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundPosition: '-1000px 0',
                        },
                    },
                ],
            },
        },
        threeD: {
            rotate3d: {
                animationName: 'rotate3d',
                duration: 3,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate3d(1, 1, 0, 0deg)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate3d(1, 1, 0, 360deg)',
                        },
                    },
                ],
            },
            flip3d: {
                animationName: 'flip3d',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotateY(0deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotateY(180deg)',
                            opacity: '0.5',
                        },
                    },
                ],
            },
            perspectiveZoom: {
                animationName: 'perspectiveZoom',
                duration: 2.5,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'perspective(500px) scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'perspective(500px) scale(1.5)',
                            opacity: '0.7',
                        },
                    },
                ],
            },
            cubeSpin: {
                animationName: 'cubeSpin',
                duration: 4,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotateX(0deg) rotateY(0deg)',
                        },
                    },
                    {
                        percentage: 25,
                        properties: {
                            transform: 'rotateX(90deg) rotateY(0deg)',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'rotateX(90deg) rotateY(90deg)',
                        },
                    },
                    {
                        percentage: 75,
                        properties: {
                            transform: 'rotateX(180deg) rotateY(90deg)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotateX(180deg) rotateY(180deg)',
                        },
                    },
                ],
            },
            spaceDance: {
                animationName: 'spaceDance',
                duration: 5,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform:
                                'translateZ(0) rotateX(0deg) rotateY(0deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 25,
                        properties: {
                            transform:
                                'translateZ(100px) rotateX(45deg) rotateY(45deg)',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform:
                                'translateZ(0) rotateX(90deg) rotateY(90deg)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 75,
                        properties: {
                            transform:
                                'translateZ(-100px) rotateX(135deg) rotateY(135deg)',
                            opacity: '0.8',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform:
                                'translateZ(0) rotateX(180deg) rotateY(180deg)',
                            opacity: '1',
                        },
                    },
                ],
            },
            // Additional 3D animations
            spinCube: {
                animationName: 'spinCube',
                duration: 4,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotateX(0deg) rotateY(0deg)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotateX(360deg) rotateY(360deg)',
                        },
                    },
                ],
            },
        },
        complex: {
            morph: {
                animationName: 'morphEffect',
                duration: 3,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            borderRadius: '0% 50%',
                            backgroundColor: '#FF6B6B',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            borderRadius: '50% 0%',
                            backgroundColor: '#4ECDC4',
                        },
                    },
                ],
            },
            multiTransform: {
                animationName: 'multiTransform',
                duration: 2.5,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateX(0) rotate(0deg) scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform:
                                'translateX(50px) rotate(180deg) scale(1.5)',
                            opacity: '0.7',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateX(0) rotate(360deg) scale(1)',
                            opacity: '1',
                        },
                    },
                ],
            },
            liquid: {
                animationName: 'liquid',
                duration: 3,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'translateY(0) scaleX(1)',
                            borderRadius: '50%',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'translateY(20px) scaleX(1.2)',
                            borderRadius: '40%',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'translateY(0) scaleX(1)',
                            borderRadius: '50%',
                        },
                    },
                ],
            },
            particleBurst: {
                animationName: 'particleBurst',
                duration: 2,
                timingFunction: 'ease-out',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(0)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '0',
                        },
                    },
                ],
            },
            kaleidoscope: {
                animationName: 'kaleidoscope',
                duration: 5,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                            background:
                                'conic-gradient(#ff9a9e, #fad0c4, #fad0c4)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(360deg)',
                            background:
                                'conic-gradient(#fad0c4, #ff9a9e, #fad0c4)',
                        },
                    },
                ],
            },
            // Additional complex animations
            spiral: {
                animationName: 'spiral',
                duration: 4,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg) translateX(0px)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(1080deg) translateX(100px)',
                            opacity: '0',
                        },
                    },
                ],
            },
        },
        hover: {
            hoverScale: {
                animationName: 'hoverScale',
                duration: 0.3,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1.1)',
                        },
                    },
                ],
            },
            hoverShadow: {
                animationName: 'hoverShadow',
                duration: 0.3,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
                        },
                    },
                ],
            },
            hoverRotate: {
                animationName: 'hoverRotate',
                duration: 0.6,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(15deg)',
                        },
                    },
                ],
            },
            hoverColorChange: {
                animationName: 'hoverColorChange',
                duration: 0.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            backgroundColor: '#3B82F6',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            backgroundColor: '#EF4444',
                        },
                    },
                ],
            },
            hoverPulse: {
                animationName: 'hoverPulse',
                duration: 0.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1.05)',
                        },
                    },
                ],
            },
            hoverGlow: {
                animationName: 'hoverGlow',
                duration: 0.5,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            boxShadow: '0 0 5px #10B981',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            boxShadow: '0 0 20px #10B981',
                        },
                    },
                ],
            },
        },
        svg: {
            svgPathDraw: {
                animationName: 'svgPathDraw',
                duration: 2,
                timingFunction: 'ease-in-out',
                iterationCount: 1,
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            strokeDasharray: '0, 100',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            strokeDasharray: '100, 0',
                        },
                    },
                ],
            },
            svgFill: {
                animationName: 'svgFill',
                duration: 3,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            fill: '#FF5722',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            fill: '#2196F3',
                        },
                    },
                ],
            },
            svgStroke: {
                animationName: 'svgStroke',
                duration: 2,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            stroke: '#FFEB3B',
                            strokeWidth: '1px',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            stroke: '#4CAF50',
                            strokeWidth: '3px',
                        },
                    },
                ],
            },
            svgMorph: {
                animationName: 'svgMorph',
                duration: 4,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            d: 'M10 80 Q 95 10 180 80 T 350 80',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            d: 'M10 80 Q 95 150 180 80 T 350 80',
                        },
                    },
                ],
            },
            svgRotate: {
                animationName: 'svgRotate',
                duration: 5,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(360deg)',
                        },
                    },
                ],
            },
            svgPulse: {
                animationName: 'svgPulse',
                duration: 1.5,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1)',
                            opacity: '1',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1.2)',
                            opacity: '0.8',
                        },
                    },
                ],
            },
        },
    },
    attention: {
        crazyJiggle: {
            wildJiggle: {
                animationName: 'wildJiggle',
                duration: 1.2,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'rotate(0deg) translateX(0px)',
                        },
                    },
                    {
                        percentage: 25,
                        properties: {
                            transform: 'rotate(15deg) translateX(-10px)',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'rotate(-15deg) translateX(10px)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'rotate(0deg) translateX(0px)',
                        },
                    },
                ],
            },
        },
    },
    background: {
        neonPulse: {
            pulsingNeon: {
                animationName: 'pulsingNeon',
                duration: 3,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            background:
                                'radial-gradient(circle, #FF5722, #2196F3)',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            background:
                                'radial-gradient(circle, #4CAF50, #FFC107)',
                        },
                    },
                ],
            },
        },
    },
    threeD: {
        rotatingCube: {
            infiniteCubeRotation: {
                animationName: 'infiniteCubeRotation',
                duration: 4,
                timingFunction: 'linear',
                iterationCount: 'infinite',
                direction: 'normal',
                keyframes: [
                    {
                        percentage: 0,
                        properties: { transform: 'rotate3d(1, 1, 0, 0deg)' },
                    },
                    {
                        percentage: 100,
                        properties: { transform: 'rotate3d(1, 1, 0, 360deg)' },
                    },
                ],
            },
        },
    },
    complex: {
        hyperspace: {
            warpDrive: {
                animationName: 'warpDrive',
                duration: 2,
                timingFunction: 'ease-in',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            transform: 'scale(1) translateZ(0)',
                            perspective: '800px',
                        },
                    },
                    {
                        percentage: 50,
                        properties: {
                            transform: 'scale(1.5) translateZ(50px)',
                            perspective: '800px',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            transform: 'scale(1) translateZ(0)',
                            perspective: '800px',
                        },
                    },
                ],
            },
        },
    },
    hover: {
        magicHover: {
            glowMagic: {
                animationName: 'glowMagic',
                duration: 0.6,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            boxShadow: '0 0 5px #FF4081',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            boxShadow: '0 0 15px #FF4081',
                        },
                    },
                ],
            },
        },
    },
    svg: {
        morphingPaths: {
            pathMorph: {
                animationName: 'pathMorph',
                duration: 3,
                timingFunction: 'ease-in-out',
                iterationCount: 'infinite',
                direction: 'alternate',
                keyframes: [
                    {
                        percentage: 0,
                        properties: {
                            d: 'M10 80 Q 95 10 180 80 T 350 80',
                        },
                    },
                    {
                        percentage: 100,
                        properties: {
                            d: 'M10 80 Q 95 150 180 80 T 350 80',
                        },
                    },
                ],
            },
        },
    },
};
