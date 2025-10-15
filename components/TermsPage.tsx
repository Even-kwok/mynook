import React from 'react';
import { motion } from 'framer-motion';

export const TermsPage: React.FC = () => {
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
                        <h1 className="text-5xl font-bold text-slate-900 mb-4">Terms of Service</h1>
                        <p className="text-lg text-slate-600">Last updated: October 15, 2025</p>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-10">
                        <p className="text-amber-900 font-semibold text-center leading-relaxed">
                            PLEASE READ THESE TERMS OF SERVICE ("AGREEMENT" OR "TERMS OF SERVICE") CAREFULLY BEFORE USING THE SERVICES OFFERED BY MYNOOK. 
                            THIS AGREEMENT SETS FORTH THE LEGALLY BINDING TERMS AND CONDITIONS FOR YOUR USE OF THE MYNOOK WEBSITE AND ALL RELATED SERVICES. 
                            BY USING THE SERVICES IN ANY MANNER, YOU AGREE TO BE BOUND BY THIS AGREEMENT.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-8 text-slate-700">
                        
                        {/* Definition */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <p className="leading-relaxed">
                                "The Site" refers to the websites and services operated by MyNook, including but not limited to mynook.ai, 
                                as well as any associated applications, services, features, content, and functionalities offered by MyNook.
                            </p>
                        </section>

                        {/* Acceptance of Terms */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Acceptance of Terms of Service</h2>
                            <div className="space-y-4">
                                <p className="leading-relaxed">
                                    The Service is offered subject to acceptance without modification of all of these Terms of Service and all other operating rules, 
                                    policies and procedures that may be published from time to time in connection with the Services by MyNook. In addition, some services 
                                    offered through the Service may be subject to additional terms and conditions promulgated by MyNook from time to time; your use of such 
                                    services is subject to those additional terms and conditions, which are incorporated into these Terms of Service by this reference.
                                </p>
                                <p className="leading-relaxed">
                                    MyNook may, in its sole discretion, refuse to offer the Service to any person or entity and change its eligibility criteria at any time. 
                                    This provision is void where prohibited by law and the right to access the Service is revoked in such jurisdictions.
                                </p>
                            </div>
                        </section>

                        {/* Rules and Conduct */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-6">Rules and Conduct</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Service Purpose</h3>
                                    <p className="leading-relaxed">
                                        By using MyNook, you agree that the Service is intended for creating AI-powered interior and exterior design visualizations. 
                                        You acknowledge and agree that when creating AI models that contain identifiable individuals, you must have their express written 
                                        consent to use their photos and to create, train, and generate AI-generated images.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Age Requirements</h3>
                                    <p className="leading-relaxed mb-3">
                                        By using the MyNook app, you agree that you are at least 18 years old or have reached the legal age of majority in your country 
                                        of residence. If you are under 18 or the legal age in your country (whichever is higher), you are prohibited from using this app. 
                                        It is your responsibility to ensure that you comply with your local laws regarding age restrictions for digital services.
                                    </p>
                                    <p className="leading-relaxed">
                                        By accessing the Services, you confirm that you're at least 18 years old and meet the minimum age of digital consent in your country. 
                                        If you are not old enough to consent to our Terms of Service in your country, your parent or guardian must agree to this Agreement on 
                                        your behalf.
                                    </p>
                                </div>

                                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
                                    <h3 className="text-xl font-bold text-red-900 mb-3">⚠️ Minor Protection Policy</h3>
                                    <p className="text-red-900 leading-relaxed mb-3">
                                        <strong>By using the Service and uploading any content, you expressly acknowledge and agree that you will not upload, post, 
                                        generate or share any photographs or content depicting minors (individuals under the age of 18).</strong>
                                    </p>
                                    <p className="text-red-900 leading-relaxed">
                                        You further agree that, in compliance with applicable laws and regulations, we reserve the right to monitor and review any uploaded 
                                        or generated content, and if we identify any content featuring minors, we will immediately remove such content and report any instances 
                                        of potential child exploitation, endangerment, or abuse to the appropriate law enforcement authorities in your respective jurisdiction. 
                                        By using our platform, you consent to such monitoring, review, and reporting, and you understand that you may be subject to legal 
                                        repercussions if you violate these terms.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Prohibited Uses</h3>
                                    <p className="leading-relaxed mb-3">
                                        As a condition of use, you promise not to use the Service for any purpose that is prohibited by the Terms of Service. 
                                        By way of example, and not as a limitation, you shall not (and shall not permit any third party to):
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Violate any applicable law, rule or regulation</li>
                                        <li>Infringe upon any intellectual property or other right of any other person or entity</li>
                                        <li>Create content that is threatening, abusive, harassing, defamatory, libelous, deceptive, fraudulent, invasive of another's privacy, tortious, obscene, offensive, or profane</li>
                                        <li>Create content that exploits or abuses children</li>
                                        <li>Generate or disseminate verifiably false information with the purpose of harming others</li>
                                        <li>Impersonate or attempt to impersonate others</li>
                                        <li>Generate or disseminate personally identifying or identifiable information without consent</li>
                                        <li>Create content that implies or promotes support of a terrorist organization</li>
                                        <li>Create content that condones or promotes violence against people based on any protected legal category</li>
                                        <li>Use the Service for the purpose of generating inappropriate, nude, or pornographic content</li>
                                        <li>Take any action that imposes an unreasonable load on MyNook's infrastructure</li>
                                        <li>Interfere with or attempt to interfere with the proper working of the Service</li>
                                        <li>Bypass any measures MyNook may use to prevent or restrict access to the Service</li>
                                        <li>Use web scraping, web harvesting, or web data extraction methods</li>
                                        <li>Reverse engineer, decompile, or attempt to discover the source code or underlying components of the Service</li>
                                        <li>Copy, sell, resell or exploit any portion of the Site without express written permission</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* DMCA Policy */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">DMCA and Takedowns Policy</h2>
                            <div className="space-y-4">
                                <p className="leading-relaxed">
                                    MyNook utilizes artificial intelligence systems to produce design visualizations. Such outputs may be unintentionally similar to 
                                    copyright protected material or trademarks held by others. We respect rights holders internationally and we ask our users to do the same.
                                </p>
                                <p className="leading-relaxed">
                                    We have implemented the procedures described in the Digital Millennium Copyright Act of 1998 ("DMCA"), 17 U.S.C. § 512, regarding the 
                                    reporting of alleged copyright infringement and the removal of or disabling access to the infringing material. If you have a good faith 
                                    belief that copyrighted material on the Site is being used in a way that infringes the copyright over which you are authorized to act, 
                                    you may make a Notice of Infringing Material.
                                </p>
                                <p className="leading-relaxed font-semibold">
                                    We will terminate or disable your use of the Site in appropriate circumstances if you are deemed by us to be a repeat copyright infringer.
                                </p>
                            </div>
                        </section>

                        {/* Modification of Terms */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Modification of Terms of Service</h2>
                            <p className="leading-relaxed">
                                At its sole discretion, MyNook may modify or replace any of the Terms of Service, or change, suspend, or discontinue the Service 
                                (including without limitation, the availability of any feature, database, or content) at any time by posting a notice on the MyNook 
                                website or Service or by sending you an email. MyNook may also impose limits on certain features and services or restrict your access 
                                to parts or all of the Service without notice or liability. It is your responsibility to check the Terms of Service periodically for changes. 
                                Your continued use of the Service following the posting of any changes to the Terms of Service constitutes acceptance of those changes.
                            </p>
                        </section>

                        {/* Trademarks and Patents */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Trademarks and Patents</h2>
                            <p className="leading-relaxed">
                                All MyNook logos, marks and designations are trademarks or registered trademarks of MyNook. All other trademarks mentioned in this 
                                website are the property of their respective owners. The trademarks and logos displayed on this website may not be used without the prior 
                                written consent of MyNook or their respective owners. Portions, features and/or functionality of MyNook's products may be protected under 
                                MyNook patent applications or patents.
                            </p>
                        </section>

                        {/* Licensing Terms */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Licensing Terms</h2>
                            <div className="space-y-4">
                                <p className="leading-relaxed">
                                    Subject to your compliance with this Agreement, the conditions herein and any limitations applicable to MyNook or by law:
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>You are granted a non-exclusive, limited, non-transferable, non-sublicensable, non-assignable, freely revocable license to access and use the Service for business or personal use</li>
                                    <li>You own all design outputs you create with the Services</li>
                                    <li>We hereby assign to you all rights, title and interest in and to such outputs for your personal or commercial use</li>
                                </ul>
                                <p className="leading-relaxed">
                                    Otherwise, MyNook reserves all rights not expressly granted under these Terms of Service. Each person must have a unique account and 
                                    you are responsible for any activity conducted on your account. A breach or violation of any of our Terms of Service may result in an 
                                    immediate termination of your right to use our Service.
                                </p>
                                <p className="leading-relaxed">
                                    By using the Services, you grant to MyNook, its successors, and assigns a perpetual, worldwide, non-exclusive, sublicensable, no-charge, 
                                    royalty-free, irrevocable copyright license to use, copy, reproduce, process, adapt, modify, publish, transmit, prepare derivative works of, 
                                    publicly display, publicly perform, sublicense, and/or distribute text prompts and images you input into the Services, or outputs produced 
                                    by the Service at your direction. This license authorizes MyNook to make the outputs available generally and to use such outputs as needed 
                                    to provide, maintain, promote and improve the Services, as well as to comply with applicable law and enforce our policies.
                                </p>
                            </div>
                        </section>

                        {/* Fees and Payments */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Fees and Payments</h2>
                            <div className="space-y-4">
                                <p className="leading-relaxed">
                                    You agree that MyNook provides you immediate access to digital content and begins service consumption immediately upon purchase, 
                                    without the standard 14-day withdrawal period. Therefore, you expressly waive your right to withdraw from this purchase. Due to the 
                                    high costs of AI processing and cloud computing, we're not able to offer refunds because we reserve servers and incur high costs for 
                                    your usage immediately.
                                </p>
                                <p className="leading-relaxed">
                                    MyNook offers a paid Service. You can sign up for a monthly or yearly subscription that will automatically renew on a monthly or yearly 
                                    basis. You can stop using the Service and cancel your subscription at any time through your account settings. If you cancel your subscription, 
                                    you will not receive a refund or credit for any amounts that have already been billed or paid.
                                </p>
                                <p className="leading-relaxed">
                                    MyNook reserves the right to change its prices and offerings (like credits or features) at any time. If you are on a subscription plan, 
                                    changes to pricing will not apply until your next renewal.
                                </p>
                                <p className="leading-relaxed">
                                    Unless otherwise stated, your subscription fees ("Fees") do not include federal, state, local, and foreign taxes, duties, and other similar 
                                    assessments ("Taxes"). You are responsible for all Taxes associated with your purchase. If any amount of your Fees are past due, we may 
                                    suspend your access to the Services after we provide you written notice of late payment.
                                </p>
                            </div>
                        </section>

                        {/* Subscription Plans and Pricing */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Subscription Plans and Pricing</h2>
                            <div className="space-y-6">
                                <p className="leading-relaxed">
                                    MyNook offers four membership tiers with different features and credit allocations. All paid subscriptions can be billed monthly or yearly.
                                </p>

                                <div className="space-y-4">
                                    <div className="bg-slate-50 rounded-xl p-5">
                                        <h3 className="text-xl font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <span>🆓</span> FREE Plan
                                        </h3>
                                        <ul className="list-disc pl-6 space-y-1 text-slate-700">
                                            <li><strong>Price:</strong> $0</li>
                                            <li><strong>Credits:</strong> 0 credits included</li>
                                            <li><strong>Features:</strong> Browse designs and explore features</li>
                                            <li><strong>Limitations:</strong> Must upgrade to generate designs</li>
                                        </ul>
                                    </div>

                                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                        <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                            <span>⭐</span> PRO Plan
                                        </h3>
                                        <ul className="list-disc pl-6 space-y-1 text-slate-700">
                                            <li><strong>Price:</strong> $39/month or $199/year ($17/month when billed annually)</li>
                                            <li><strong>Credits:</strong> 1,000 credits included per billing cycle</li>
                                            <li><strong>Design Generation:</strong> Create up to 1 design per generation</li>
                                            <li><strong>Features:</strong> Design generation, commercial use license, no watermark, style transfer</li>
                                            <li><strong>Response Time:</strong> Standard</li>
                                        </ul>
                                    </div>

                                    <div className="bg-purple-50 rounded-xl p-5 border-2 border-purple-300">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h3 className="text-xl font-semibold text-purple-800 flex items-center gap-2">
                                                <span>👑</span> PREMIUM Plan
                                            </h3>
                                            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">POPULAR</span>
                                        </div>
                                        <ul className="list-disc pl-6 space-y-1 text-slate-700">
                                            <li><strong>Price:</strong> $99/month or $499/year ($42/month when billed annually)</li>
                                            <li><strong>Credits:</strong> 5,000 credits included per billing cycle</li>
                                            <li><strong>Design Generation:</strong> Create up to 8 designs in parallel per generation</li>
                                            <li><strong>Special Features:</strong> 🎨 Free Canvas feature, 🔧 Item Replace feature, priority queue processing</li>
                                            <li><strong>Additional Features:</strong> Commercial use license, no watermark, style transfer, early access to new features</li>
                                            <li><strong>Response Time:</strong> Fast (priority queue)</li>
                                        </ul>
                                    </div>

                                    <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                                        <h3 className="text-xl font-semibold text-amber-800 mb-3 flex items-center gap-2">
                                            <span>💼</span> BUSINESS Plan
                                        </h3>
                                        <ul className="list-disc pl-6 space-y-1 text-slate-700">
                                            <li><strong>Price:</strong> $299/month or $1,699/year ($142/month when billed annually)</li>
                                            <li><strong>Credits:</strong> 25,000 credits included per billing cycle (💰 Best value per credit)</li>
                                            <li><strong>Design Generation:</strong> Create up to 16 designs in parallel per generation</li>
                                            <li><strong>Special Features:</strong> 🎨 Free Canvas feature, 🔧 Item Replace feature</li>
                                            <li><strong>Additional Features:</strong> Commercial use license, no watermark, style transfer, early access to new features</li>
                                            <li><strong>Response Time:</strong> Fast (highest priority)</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mt-6">
                                    <h3 className="text-lg font-bold text-indigo-900 mb-3">💎 Credit Packs (One-Time Purchase)</h3>
                                    <p className="text-slate-700 mb-3">
                                        <strong>Available only for Pro, Premium, and Business members.</strong> Free members must upgrade to a paid plan before purchasing credit packs.
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-slate-700">
                                        <li><strong>100 Credits Pack:</strong> $9.90 - Perfect for trying out</li>
                                        <li><strong>300 Credits Pack:</strong> $24.99 - Great for small projects (Most Popular)</li>
                                        <li><strong>1,000 Credits Pack:</strong> $69.99 - Best value per credit</li>
                                    </ul>
                                    <p className="text-sm text-slate-600 mt-3 italic">
                                        Credit packs are added to your account balance immediately and do not expire. Credits from packs are used after your monthly subscription credits are consumed.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Subscription Terms */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Subscription Terms and Renewal</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Automatic Renewal</h3>
                                    <p className="leading-relaxed">
                                        All subscription plans (Pro, Premium, and Business) automatically renew at the end of each billing period (monthly or yearly) unless cancelled before the renewal date. You will be charged the then-current rate for your subscription plan upon renewal.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Credit Allocation</h3>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Credits are allocated at the beginning of each billing cycle</li>
                                        <li>Unused subscription credits will be retained in your account and do not expire</li>
                                        <li>Additional credits purchased through credit packs do NOT expire and will be used after your monthly subscription credits are consumed</li>
                                        <li>Credits are deducted when you generate designs using AI features</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Cancellation Policy</h3>
                                    <p className="leading-relaxed mb-3">
                                        You may cancel your subscription at any time through your account settings. Upon cancellation:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Your subscription will remain active until the end of the current billing period</li>
                                        <li>You will continue to have access to your plan features and remaining credits until the subscription expires</li>
                                        <li>No refunds or credits will be issued for partial billing periods</li>
                                        <li>Your account will automatically downgrade to the Free plan after your subscription expires</li>
                                        <li>Any purchased credit packs will remain available in your account</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-50 border border-amber-300 rounded-xl p-5">
                                    <h3 className="text-lg font-bold text-amber-900 mb-2">⚠️ No Refund Policy</h3>
                                    <p className="text-amber-900 leading-relaxed">
                                        Due to the immediate access to digital services and the high costs of AI processing, <strong>we do not offer refunds for subscription fees or credit pack purchases</strong>. All sales are final. We encourage you to start with a lower-tier plan or smaller credit pack to ensure our service meets your needs before making larger purchases.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Plan Changes and Upgrades</h3>
                                    <p className="leading-relaxed mb-2">
                                        You may upgrade or downgrade your subscription plan at any time:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>Upgrades:</strong> Take effect immediately. You will be charged the prorated difference for the remainder of your current billing period, and your credits will be updated accordingly.</li>
                                        <li><strong>Downgrades:</strong> Take effect at the end of your current billing period. You will retain your current plan's features and credits until then.</li>
                                        <li><strong>Credit Retention:</strong> When changing plans, all credits in your account (including both subscription credits and credit pack credits) will be retained and will not be forfeited.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-3">Price Changes</h3>
                                    <p className="leading-relaxed">
                                        MyNook reserves the right to modify subscription prices and credit pack prices at any time. If you are on an active subscription, price changes will not affect you until your next renewal date. We will notify you of any price changes at least 30 days before they take effect for existing subscribers.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Payment Processing */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Payment Processing</h2>
                            <p className="leading-relaxed">
                                MyNook uses <strong>Creem.io as our Merchant of Record</strong> for payment processing. When you make a purchase, your payment information 
                                is processed securely by Creem.io. We do not store your credit card information. All payment transactions are handled securely through 
                                Creem.io's platform. By making a purchase, you agree to Creem.io's terms and conditions. For more information on how Creem.io handles 
                                your payment data, please visit their privacy policy.
                            </p>
                        </section>

                        {/* Termination */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Termination</h2>
                            <p className="leading-relaxed">
                                MyNook may terminate your access to all or any part of the Service at any time if you fail to comply with these Terms of Service, which may 
                                result in the forfeiture and destruction of all information associated with your account. Further, either party may terminate the Services for 
                                any reason and at any time upon written notice. If you wish to terminate your account, you may do so by following the instructions on the Service. 
                                Any fees paid hereunder are non-refundable. Upon any termination, all rights and licenses granted to you in this Agreement shall immediately 
                                terminate, but all provisions hereof which by their nature should survive termination shall survive termination, including, without limitation, 
                                warranty disclaimers, indemnity and limitations of liability.
                            </p>
                        </section>

                        {/* Indemnification */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Indemnification</h2>
                            <p className="leading-relaxed">
                                You shall defend, indemnify, and hold harmless MyNook, its affiliates and each of its employees, contractors, directors, suppliers and 
                                representatives from all liabilities, losses, claims, and expenses, including reasonable attorneys' fees, that arise from or relate to (i) your 
                                use or misuse of, or access to, the Service, or (ii) your violation of the Terms of Service or any applicable law, contract, policy, regulation 
                                or other obligation. MyNook reserves the right to assume the exclusive defense and control of any matter otherwise subject to indemnification by 
                                you, in which event you will assist and cooperate with MyNook in connection therewith.
                            </p>
                        </section>

                        {/* Limitation of Liability */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Limitation of Liability</h2>
                            <div className="space-y-4">
                                <p className="leading-relaxed font-semibold">
                                    IN NO EVENT SHALL MYNOOK OR ITS DIRECTORS, EMPLOYEES, AGENTS, PARTNERS, SUPPLIERS OR CONTENT PROVIDERS, BE LIABLE UNDER CONTRACT, TORT, 
                                    STRICT LIABILITY, NEGLIGENCE OR ANY OTHER LEGAL OR EQUITABLE THEORY WITH RESPECT TO THE SERVICE (I) FOR ANY LOST PROFITS, DATA LOSS, COST 
                                    OF PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES, OR SPECIAL, INDIRECT, INCIDENTAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES OF ANY KIND WHATSOEVER, 
                                    (II) FOR YOUR RELIANCE ON THE SERVICE OR (III) FOR ANY DIRECT DAMAGES IN EXCESS (IN THE AGGREGATE) OF THE FEES PAID BY YOU FOR THE SERVICE 
                                    OR, IF GREATER, $100.
                                </p>
                                <p className="leading-relaxed">
                                    IN NO EVENT SHALL MYNOOK OR ITS OWNERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
                                    OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH USE OF THIS APPLICATION.
                                </p>
                                <p className="leading-relaxed text-sm">
                                    SOME STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION OF INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE ABOVE LIMITATIONS AND EXCLUSIONS MAY 
                                    NOT APPLY TO YOU.
                                </p>
                            </div>
                        </section>

                        {/* Disclaimer */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Disclaimer</h2>
                            <div className="space-y-4">
                                <p className="leading-relaxed font-semibold">
                                    ALL USE OF THE SERVICE AND ANY CONTENT IS UNDERTAKEN ENTIRELY AT YOUR OWN RISK. THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" AND IS 
                                    WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF TITLE, NON-INFRINGEMENT, 
                                    MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, AND ANY WARRANTIES IMPLIED BY ANY COURSE OF PERFORMANCE OR USAGE OF TRADE, ALL OF 
                                    WHICH ARE EXPRESSLY DISCLAIMED.
                                </p>
                                <p className="leading-relaxed">
                                    MyNook makes no warranty that (A) the Site will meet your requirements, (B) access to and use of the Site will be uninterrupted, timely, 
                                    secure, or error-free, and (C) the results that may be obtained from the use of the Site will be accurate or reliable.
                                </p>
                                <p className="leading-relaxed text-sm">
                                    SOME STATES DO NOT ALLOW LIMITATIONS ON HOW LONG AN IMPLIED WARRANTY LASTS, SO THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
                                </p>
                            </div>
                        </section>

                        {/* Links to Other Websites */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Links to and From Other Websites</h2>
                            <p className="leading-relaxed">
                                You may gain access to other websites via links on the Site. These Terms apply to the Site only and do not apply to other parties' websites. 
                                MyNook assumes no responsibility for any terms of service or material outside of the Site accessed via any link. You are free to establish a 
                                hypertext link to the Site so long as the link does not state or imply any sponsorship of your website or service by MyNook or the Site.
                            </p>
                        </section>

                        {/* Choice of Law */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Choice of Law and Dispute Resolution</h2>
                            <div className="space-y-4">
                                <p className="leading-relaxed">
                                    You agree that any claim or cause of action arising out of or related to these Terms, the Site, or any services provided must be filed 
                                    within one (1) year after the event or facts giving rise to the claim or cause of action occurred. To the extent permitted by applicable law, 
                                    any claims or causes of action not filed within this period are permanently barred.
                                </p>
                                <p className="leading-relaxed font-semibold">
                                    YOU HEREBY IRREVOCABLY AND UNCONDITIONALLY WAIVE ANY RIGHT YOU MAY HAVE TO A TRIAL BY JURY IN RESPECT OF ANY ACTION OR PROCEEDING ARISING 
                                    OUT OF OR RELATING TO THESE TERMS.
                                </p>
                            </div>
                        </section>

                        {/* Miscellaneous */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Miscellaneous</h2>
                            <div className="space-y-4">
                                <p className="leading-relaxed">
                                    The Terms of Service are the entire agreement between you and MyNook with respect to the Service, and supersede all prior or contemporaneous 
                                    communications and proposals (whether oral, written or electronic) between you and MyNook with respect to the Service.
                                </p>
                                <p className="leading-relaxed">
                                    If any provision of the Terms of Service is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum 
                                    extent necessary so that the Terms of Service will otherwise remain in full force and effect and enforceable.
                                </p>
                                <p className="leading-relaxed">
                                    The Terms of Service are personal to you, and are not assignable or transferable by you except with MyNook's prior written consent. MyNook 
                                    may assign, transfer or delegate any of its rights and obligations hereunder without consent.
                                </p>
                            </div>
                        </section>

                        {/* Contact Section */}
                        <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 shadow-lg text-white">
                            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
                            <p className="leading-relaxed text-lg mb-4">
                                If you have any questions about these Terms of Service, please contact us at:
                            </p>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="font-semibold text-lg mb-1">Customer Support</p>
                                <p className="text-white/90">Email: support@mynook.ai</p>
                            </div>
                            <p className="mt-6 text-sm opacity-90">
                                By using MyNook, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

