import React from 'react';
import { motion } from 'framer-motion';

export const TermsPage: React.FC = () => {
    return (
        <main className="min-h-screen bg-black relative overflow-y-auto">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop" 
                    alt="Mountain background" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90" />
            </div>
            
            <div className="max-w-5xl mx-auto px-6 pt-24 pb-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <h1 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '48px', lineHeight: '60px', letterSpacing: '0px' }}>Terms of Service & Privacy Policy</h1>
                        <p className="text-slate-300" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', letterSpacing: '0px' }}>Last updated and effective date: October 11, 2025</p>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-amber-500/20 border-2 border-amber-400/30 backdrop-blur-md rounded-2xl p-6 mb-10">
                        <p className="text-amber-300 font-semibold text-center leading-relaxed">
                            PLEASE READ THESE TERMS OF SERVICE ("AGREEMENT" OR "TERMS OF SERVICE") CAREFULLY BEFORE USING THE SERVICES OFFERED BY MYNOOK. 
                            THIS AGREEMENT SETS FORTH THE LEGALLY BINDING TERMS AND CONDITIONS FOR YOUR USE OF THE MYNOOK WEBSITE AND ALL RELATED SERVICES. 
                            BY USING THE SERVICES IN ANY MANNER, YOU AGREE TO BE BOUND BY THIS AGREEMENT.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-8 text-slate-300">
                        
                        {/* Definition */}
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <p className="leading-relaxed">
                                "The Site" refers to the websites and services operated by MyNook, including but not limited to mynook.ai, 
                                as well as any associated applications, services, features, content, and functionalities offered by MyNook.
                            </p>
                        </section>

                        {/* Acceptance of Terms */}
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Acceptance of Terms of Service</h2>
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
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-6" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Rules and Conduct</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Service Purpose</h3>
                                    <p className="leading-relaxed">
                                        By using MyNook, you agree that the Service is intended for creating AI-powered interior and exterior design visualizations. 
                                        You acknowledge and agree that when creating AI models that contain identifiable individuals, you must have their express written 
                                        consent to use their photos and to create, train, and generate AI-generated images.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Age Requirements</h3>
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

                                <div className="bg-red-500/20 border-2 border-red-400/30 backdrop-blur-md rounded-xl p-5">
                                    <h3 className="text-red-300 mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>⚠️ Minor Protection Policy</h3>
                                    <p className="text-red-300 leading-relaxed mb-3">
                                        <strong>By using the Service and uploading any content, you expressly acknowledge and agree that you will not upload, post, 
                                        generate or share any photographs or content depicting minors (individuals under the age of 18).</strong>
                                    </p>
                                    <p className="text-red-300 leading-relaxed">
                                        You further agree that, in compliance with applicable laws and regulations, we reserve the right to monitor and review any uploaded 
                                        or generated content, and if we identify any content featuring minors, we will immediately remove such content and report any instances 
                                        of potential child exploitation, endangerment, or abuse to the appropriate law enforcement authorities in your respective jurisdiction. 
                                        By using our platform, you consent to such monitoring, review, and reporting, and you understand that you may be subject to legal 
                                        repercussions if you violate these terms.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Prohibited Uses</h3>
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
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>DMCA and Takedowns Policy</h2>
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
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Modification of Terms of Service</h2>
                            <p className="leading-relaxed">
                                At its sole discretion, MyNook may modify or replace any of the Terms of Service, or change, suspend, or discontinue the Service 
                                (including without limitation, the availability of any feature, database, or content) at any time by posting a notice on the MyNook 
                                website or Service or by sending you an email. MyNook may also impose limits on certain features and services or restrict your access 
                                to parts or all of the Service without notice or liability. It is your responsibility to check the Terms of Service periodically for changes. 
                                Your continued use of the Service following the posting of any changes to the Terms of Service constitutes acceptance of those changes.
                            </p>
                        </section>

                        {/* Trademarks and Patents */}
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Trademarks and Patents</h2>
                            <p className="leading-relaxed">
                                All MyNook logos, marks and designations are trademarks or registered trademarks of MyNook. All other trademarks mentioned in this 
                                website are the property of their respective owners. The trademarks and logos displayed on this website may not be used without the prior 
                                written consent of MyNook or their respective owners. Portions, features and/or functionality of MyNook's products may be protected under 
                                MyNook patent applications or patents.
                            </p>
                        </section>

                        {/* Licensing Terms */}
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Licensing Terms</h2>
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
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Fees and Payments</h2>
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

                        {/* Termination */}
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Termination</h2>
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
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Indemnification</h2>
                            <p className="leading-relaxed">
                                You shall defend, indemnify, and hold harmless MyNook, its affiliates and each of its employees, contractors, directors, suppliers and 
                                representatives from all liabilities, losses, claims, and expenses, including reasonable attorneys' fees, that arise from or relate to (i) your 
                                use or misuse of, or access to, the Service, or (ii) your violation of the Terms of Service or any applicable law, contract, policy, regulation 
                                or other obligation. MyNook reserves the right to assume the exclusive defense and control of any matter otherwise subject to indemnification by 
                                you, in which event you will assist and cooperate with MyNook in connection therewith.
                            </p>
                        </section>

                        {/* Limitation of Liability */}
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Limitation of Liability</h2>
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
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Disclaimer</h2>
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
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Links to and From Other Websites</h2>
                            <p className="leading-relaxed">
                                You may gain access to other websites via links on the Site. These Terms apply to the Site only and do not apply to other parties' websites. 
                                MyNook assumes no responsibility for any terms of service or material outside of the Site accessed via any link. You are free to establish a 
                                hypertext link to the Site so long as the link does not state or imply any sponsorship of your website or service by MyNook or the Site.
                            </p>
                        </section>

                        {/* Choice of Law */}
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Choice of Law and Dispute Resolution</h2>
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
                        <section className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/20">
                            <h2 className="text-white mb-4" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Miscellaneous</h2>
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

                        {/* Privacy Section */}
                        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 shadow-sm border-2 border-indigo-200">
                            <h2 className="text-white mb-6" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '32px', lineHeight: '42px', letterSpacing: '0px' }}>Privacy Policy</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Our Commitment to Privacy</h3>
                                    <p className="leading-relaxed">
                                        Our commitment to privacy and data protection is reflected in this Privacy Statement which describes how we collect and process 
                                        "personal information" that identifies you, like your name or email address. Any other information besides this is "non-personal information." 
                                        If we store personal information with non-personal information, we'll consider that combination to be personal information.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Information Gathering</h3>
                                    <p className="leading-relaxed mb-3">We learn information about you when:</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li><strong>You directly provide it to us:</strong> Name and contact information, payment information, photos and design files you upload</li>
                                        <li><strong>We collect it automatically:</strong> IP address, device information, geolocation data, usage data and analytics</li>
                                        <li><strong>Third parties provide it:</strong> Social networks (if you connect them), service providers, analytics partners</li>
                                        <li><strong>We infer information:</strong> Such as your preferences based on your usage patterns</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Information Use</h3>
                                    <p className="leading-relaxed mb-2">We use your personal information to:</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Provide you with our Services</li>
                                        <li>Improve and develop our Services</li>
                                        <li>Communicate with you</li>
                                        <li>Provide customer support</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Information Sharing</h3>
                                    <p className="leading-relaxed mb-2">We share information about you:</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>When we've asked and received your consent to share it</li>
                                        <li>With third-party service providers who help us operate our services</li>
                                        <li>To comply with laws or respond to lawful requests</li>
                                        <li>To prevent harm to the rights, property or safety of you or others</li>
                                        <li>In the event of a corporate restructuring</li>
                                    </ul>
                                    <p className="leading-relaxed mt-3 font-semibold text-indigo-900">
                                        Note: We do NOT sell your personal information to third parties.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Information Protection</h3>
                                    <p className="leading-relaxed">
                                        We implement physical, business and technical security measures to safeguard your personal information. In the event of a security breach, 
                                        we'll notify you so that you can take appropriate protective steps. We only keep your personal information for as long as is needed to do 
                                        what we collected it for. After that, we destroy it unless required by law.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Your Privacy Rights</h3>
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
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Children's Privacy</h3>
                                    <p className="leading-relaxed">
                                        We don't want your personal information if you're under 18. Do not provide it to us. If your child is under 18 and you believe your 
                                        child has provided us with their personal information, please contact us to have such information removed.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Data Retention and International Transfers</h3>
                                    <p className="leading-relaxed">
                                        We retain personal data for as long as necessary to provide the services and fulfill the transactions you have requested. As part of 
                                        our normal operations, your information may be stored in computers in other countries outside of your home country. By giving us information, 
                                        you consent to this kind of information transfer. Irrespective of where your information resides, we'll comply with applicable law and abide 
                                        by our commitments herein.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-white mb-3" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, fontSize: '20px', lineHeight: '28px', letterSpacing: '0px' }}>Changes to Privacy Policy</h3>
                                    <p className="leading-relaxed">
                                        We may need to change this Privacy Statement and our notices from time to time. Any updates will be posted online with an effective date. 
                                        Continued use of our services after the effective date of any changes constitutes acceptance of those changes.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Contact Section */}
                        <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 shadow-lg text-white">
                            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
                            <p className="leading-relaxed text-lg">
                                If you have any questions about these Terms of Service or Privacy Policy, please contact us through your account settings or our support page.
                            </p>
                            <p className="mt-6 text-sm opacity-90">
                                By using MyNook, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and Privacy Policy.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
            </div>
        </main>
    );
};

