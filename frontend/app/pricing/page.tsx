'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building, Crown } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const pricingPlans = [
    {
        name: 'Free',
        price: '$0',
        icon: Zap,
        description: 'Perfect for small teams getting started',
        features: [
            'Up to 10 team members',
            '3 projects',
            'Unlimited tasks',
            'Basic reporting',
            '5GB storage',
            'Email support'
        ],
        cta: 'Get Started Free',
        href: '/signup',
        highlighted: false
    },
    {
        name: 'Pro',
        price: '$12',
        period: '/user/month',
        icon: Building,
        description: 'For growing teams that need more power',
        features: [
            'Unlimited team members',
            'Unlimited projects',
            'Unlimited tasks',
            'Advanced analytics',
            '100GB storage',
            'Time tracking',
            'Custom fields',
            'Priority support',
            'API access'
        ],
        cta: 'Start Free Trial',
        href: '/signup',
        highlighted: true
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        icon: Crown,
        description: 'For organizations with advanced needs',
        features: [
            'Everything in Pro',
            'Unlimited storage',
            'Advanced security (SSO)',
            'Dedicated support',
            'Custom onboarding',
            'SLA guarantee',
            'Audit logs',
            'White-label options'
        ],
        cta: 'Contact Sales',
        href: '/contact',
        highlighted: false
    }
];

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Simple, <span className="text-primary">Transparent</span> Pricing
                        </h1>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
                            Start free. Scale as you grow. No hidden fees.
                        </p>

                        {/* Billing Toggle */}
                        <div className="inline-flex items-center gap-3 p-1 bg-surface border border-border rounded-xl">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly'
                                        ? 'bg-primary text-white'
                                        : 'text-text-secondary hover:text-foreground'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billingCycle === 'yearly'
                                        ? 'bg-primary text-white'
                                        : 'text-text-secondary hover:text-foreground'
                                    }`}
                            >
                                Yearly
                                <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                                    Save 20%
                                </span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-8 mb-20">
                        {pricingPlans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative bg-surface border rounded-3xl p-8 transition-all ${plan.highlighted
                                        ? 'border-primary shadow-2xl shadow-primary/20 scale-105'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full">
                                        Most Popular
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6`}>
                                    <plan.icon className="text-white" size={24} />
                                </div>

                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-text-secondary text-sm mb-6">{plan.description}</p>

                                <div className="mb-8">
                                    <span className="text-5xl font-bold">{plan.price}</span>
                                    {plan.period && (
                                        <span className="text-text-secondary ml-2">
                                            {billingCycle === 'yearly' && plan.price !== 'Custom' ?
                                                `$${Math.round(parseFloat(plan.price.replace('$', '')) * 0.8)}${plan.period}` :
                                                plan.period
                                            }
                                        </span>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <Check className="text-success flex-shrink-0 mt-0.5" size={18} />
                                            <span className="text-sm text-text-secondary">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={plan.href}
                                    className={`block w-full py-3 text-center font-semibold rounded-xl transition-all ${plan.highlighted
                                            ? 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-primary/25'
                                            : 'bg-surface-secondary hover:bg-border text-foreground'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* FAQ Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto"
                    >
                        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            {[
                                {
                                    q: 'Can I change plans later?',
                                    a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
                                },
                                {
                                    q: 'What payment methods do you accept?',
                                    a: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.'
                                },
                                {
                                    q: 'Is there a free trial for Pro?',
                                    a: 'Yes! Get a 14-day free trial of Pro with full access to all features. No credit card required.'
                                },
                                {
                                    q: 'What happens to my data if I cancel?',
                                    a: 'You can export all your data at any time. We retain your data for 30 days after cancellation.'
                                }
                            ].map((faq, i) => (
                                <div key={i} className="bg-surface border border-border rounded-xl p-6">
                                    <h4 className="font-semibold mb-2">{faq.q}</h4>
                                    <p className="text-text-secondary text-sm">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
