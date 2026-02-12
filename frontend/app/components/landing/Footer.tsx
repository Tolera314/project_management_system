import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';
export default function Footer() {
    return (
        <footer className="border-t border-border bg-background pt-16 pb-8 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                <div className="col-span-2 md:col-span-1">
                    <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-text-secondary mb-4 block">
                        ProjectOS
                    </Link>
                    <p className="text-text-secondary text-sm">
                        The operating system for high-performance teams.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-text-primary">Product</h4>
                    <ul className="space-y-2 text-sm text-text-secondary">
                        <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
                        <li><Link href="/integrations" className="hover:text-primary transition-colors">Integrations</Link></li>
                        <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                        <li><Link href="/changelog" className="hover:text-primary transition-colors">Changelog</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-text-primary">Company</h4>
                    <ul className="space-y-2 text-sm text-text-secondary">
                        <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
                        <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                        <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                        <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4 text-text-primary">Legal</h4>
                    <ul className="space-y-2 text-sm text-text-secondary">
                        <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                        <li><Link href="/security" className="hover:text-primary transition-colors">Security</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-text-secondary">
                <p>&copy; 2024 ProjectOS Inc. All rights reserved.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <Link href="https://twitter.com" target="_blank" className="hover:text-text-primary transition-colors"><Twitter className="w-4 h-4" />Twitter</Link>
                    <Link href="https://github.com" target="_blank" className="hover:text-text-primary transition-colors"><Github className="w-4 h-4" />GitHub</Link>
                    <Link href="https://linkedin.com" target="_blank" className="hover:text-text-primary transition-colors"><Linkedin className="w-4 h-4" />LinkedIn</Link>
                </div>
            </div>
        </footer>
    );
}
