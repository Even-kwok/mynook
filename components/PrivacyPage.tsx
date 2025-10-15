import React from 'react';
import { motion } from 'framer-motion';

export const PrivacyPage: React.FC = () => {
    return (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            <div className="max-w-5xl mx-auto px-6 pt-24 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <h1 className="text-5xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
                        <p className="text-lg text-slate-600">Last updated: October 15, 2025</p>
                    </div>

                    {/* Content */}
                    <div className="space-y-8 text-slate-700">
                        
                        {/* Privacy Section */}
                        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 shadow-sm border-2 border-indigo-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Commitment to Privacy</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Privacy Statement</h3>
                                    <p className="leading-relaxed">
                                        Our commitment to privacy and data protection is reflected in this Privacy Statement which describes how we collect and process 
                                        "personal information" that identifies you, like your name or email address. Any other information besides this is "non-personal information." 
                                        If we store personal information with non-personal information, we'll consider that combination to be personal information.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Information Gathering</h3>
                                    <p className="leading-relaxed mb-3">We learn information about you when:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>You directly provide it to us:</strong> Name and contact information, payment information, photos and design files you upload</li>
                                        <li><strong>We collect it automatically:</strong> IP address, device information, geolocation data, usage data and analytics</li>
                                        <li><strong>Third parties provide it:</strong> Social networks (if you connect them), service providers, analytics partners</li>
                                        <li><strong>We infer information:</strong> Such as your preferences based on your usage patterns</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Information Use</h3>
                                    <p className="leading-relaxed mb-2">We use your personal information to:</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Provide you with our Services</li>
                                        <li>Improve and develop our Services</li>
                                        <li>Communicate with you</li>
                                        <li>Provide customer support</li>
                                        <li>Process payments and transactions</li>
                                        <li>Send service updates and promotional materials (with your consent)</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Information Sharing</h3>
                                    <p className="leading-relaxed mb-2">We share information about you:</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>When we've asked and received your consent to share it</li>
                                        <li>With third-party service providers who help us operate our services (including Creem.io for payment processing)</li>
                                        <li>To comply with laws or respond to lawful requests</li>
                                        <li>To prevent harm to the rights, property or safety of you or others</li>
                                        <li>In the event of a corporate restructuring</li>
                                    </ul>
                                    <p className="leading-relaxed mt-3 font-semibold text-indigo-900">
                                        Note: We do NOT sell your personal information to third parties.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Payment Processing</h3>
                                    <p className="leading-relaxed">
                                        MyNook uses Creem.io as our Merchant of Record for payment processing. When you make a purchase, your payment information 
                                        is processed securely by Creem.io. We do not store your credit card information. For more information on how Creem.io 
                                        handles your payment data, please visit their privacy policy.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Information Protection</h3>
                                    <p className="leading-relaxed">
                                        We implement physical, business and technical security measures to safeguard your personal information. In the event of a security breach, 
                                        we'll notify you so that you can take appropriate protective steps. We only keep your personal information for as long as is needed to do 
                                        what we collected it for. After that, we destroy it unless required by law.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Your Privacy Rights</h3>
                                    <p className="leading-relaxed mb-3">
                                        The following rights are granted under the European General Data Protection Regulation ("GDPR") and California Consumer Privacy Act ("CCPA"). 
                                        MyNook applies these rights to all users of our products, regardless of your location:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>The right to know what personal information is collected</li>
                                        <li>The right to know if personal information is being shared, and to whom</li>
                                        <li>The right to access your personal information</li>
                                        <li>The right to exercise your privacy rights without being discriminated against</li>
                                        <li>The right to request correction or erasure of personal information</li>
                                        <li>The right to object to processing your personal information</li>
                                        <li>The right to transfer or receive a copy of your personal information in a usable format</li>
                                    </ul>
                                </div>

                                <div className="bg-blue-50 border border-blue-300 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-blue-900 mb-2">EEA, UK, and Swiss Users</h3>
                                    <p className="text-blue-900 leading-relaxed">
                                        Under the GDPR, you have additional rights including the right to lodge a complaint with a supervisory authority. 
                                        We encourage you to first contact us with any questions or concerns.
                                    </p>
                                </div>

                                <div className="bg-purple-50 border border-purple-300 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-purple-900 mb-2">California Users</h3>
                                    <p className="text-purple-900 leading-relaxed">
                                        Under the CCPA, you have additional rights including the right to opt-out of the sale of personal information. 
                                        Note that we do NOT sell personal information as defined by the CCPA and have not done so in the past 12 months.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Children's Privacy</h3>
                                    <p className="leading-relaxed">
                                        We don't want your personal information if you're under 18. Do not provide it to us. If your child is under 18 and you believe your 
                                        child has provided us with their personal information, please contact us to have such information removed.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Cookies and Tracking</h3>
                                    <p className="leading-relaxed">
                                        We use cookies and similar tracking technologies to improve your experience, analyze usage patterns, and provide personalized content. 
                                        You can control cookie settings through your browser preferences. Disabling cookies may limit some functionality of our service.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Data Retention and International Transfers</h3>
                                    <p className="leading-relaxed">
                                        We retain personal data for as long as necessary to provide the services and fulfill the transactions you have requested. As part of 
                                        our normal operations, your information may be stored in computers in other countries outside of your home country. By giving us information, 
                                        you consent to this kind of information transfer. Irrespective of where your information resides, we'll comply with applicable law and abide 
                                        by our commitments herein.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Changes to Privacy Policy</h3>
                                    <p className="leading-relaxed">
                                        We may need to change this Privacy Statement and our notices from time to time. Any updates will be posted online with an effective date. 
                                        Continued use of our services after the effective date of any changes constitutes acceptance of those changes. For material changes, 
                                        we will provide prominent notice or seek your consent as required by law.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Contact Section */}
                        <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 shadow-lg text-white">
                            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
                            <p className="leading-relaxed text-lg mb-4">
                                If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at:
                            </p>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="font-semibold text-lg mb-1">Customer Support</p>
                                <p className="text-white/90">Email: support@mynook.ai</p>
                            </div>
                            <p className="mt-6 text-sm opacity-90">
                                By using MyNook, you acknowledge that you have read, understood, and agree to this Privacy Policy.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

