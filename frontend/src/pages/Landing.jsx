import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiChartBar,
  HiShieldCheck,
  HiGlobe,
  HiUserGroup,
  HiCog,
  HiPlay,
  HiArrowRight,
  HiCheck,
  HiStar,
  HiTrendingUp,
  HiClock,
  HiLightningBolt,
  HiSparkles,
  HiInbox,
} from 'react-icons/hi';
import { billingService } from '../services/api';

const Landing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await billingService.getPlans();
      setPlans(response.data || response);
    } catch (error) {
      console.error('Failed to load plans:', error);
      // Fall back to default plans if API fails
      setPlans(getDefaultPlans());
    } finally {
      setLoadingPlans(false);
    }
  };

  const features = [
    {
      name: 'Email Campaigns',
      description: 'Create and manage professional email campaigns',
      icon: HiInbox,
    },
    {
      icon: HiChartBar,
      title: 'Real-time Analytics',
      description: 'Track opens, clicks, and conversions with detailed performance insights.',
      color: 'green',
    },
    {
      icon: HiShieldCheck,
      title: 'Enterprise Security',
      description: 'Bank-grade security with 2FA, role-based access, and audit logs.',
      color: 'red',
    },
    {
      icon: HiGlobe,
      title: 'Global Delivery',
      description: 'Multi-domain sending with automatic reputation management.',
      color: 'purple',
    },
    {
      icon: HiUserGroup,
      title: 'Team Collaboration',
      description: 'Manage teams, assign roles, and collaborate on campaigns.',
      color: 'yellow',
    },
    {
      icon: HiCog,
      title: 'API Integration',
      description: 'RESTful API for seamless integration with your existing tools.',
      color: 'indigo',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Marketing Director',
      company: 'TechCorp',
      content: 'This platform transformed our email marketing. Deliverability improved by 40%!',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Growth Manager',
      company: 'StartupXYZ',
      content: 'The analytics are incredible. We can see exactly what works and optimize accordingly.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Email Specialist',
      company: 'E-commerce Plus',
      content: 'The automation features saved us hours every week. Highly recommended!',
      rating: 5,
    },
  ];

  const getDefaultPlans = () => [
    {
      name: 'Starter',
      price: 19.99,
      currency: 'USD',
      duration_days: 30,
      features: [
        'Basic Analytics',
        'Email Support',
        'Standard Templates',
        'Basic Reporting'
      ],
      popular: false,
    },
    {
      name: 'Professional',
      price: 49.99,
      currency: 'USD',
      duration_days: 30,
      features: [
        'Advanced Analytics',
        'Priority Support',
        'Custom Domains',
        'API Access',
        'Advanced Reporting',
        'A/B Testing'
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 99.99,
      currency: 'USD',
      duration_days: 30,
      features: [
        'Advanced Analytics',
        'Dedicated Support',
        'Custom Domains',
        'API Access',
        'White-label Options',
        'Advanced Reporting',
        'A/B Testing',
        'Custom Integrations'
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <HiInbox className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">EmailCampaign</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                Email Marketing
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}Reimagined
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Powerful email campaigns with advanced analytics, automation, and enterprise-grade security. 
                Built for modern businesses that demand results.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn btn-primary btn-lg flex items-center justify-center">
                  <HiPlay className="h-5 w-5 mr-2" />
                  Start Free Trial
                </Link>
                <button className="btn btn-secondary btn-lg flex items-center justify-center">
                  <HiArrowRight className="h-5 w-5 mr-2" />
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">99.9%</div>
              <div className="text-gray-600">Email Deliverability</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">40%</div>
              <div className="text-gray-600">Higher Open Rates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">10M+</div>
              <div className="text-gray-600">Emails Sent Daily</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">24/7</div>
              <div className="text-gray-600">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need for successful email marketing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From campaign creation to advanced analytics, we provide all the tools you need to 
              build meaningful relationships with your audience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-${feature.color}-100 text-${feature.color}-600 mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by thousands of businesses
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about their experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <HiStar key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs. All plans include our core features.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingPlans ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-sm animate-pulse">
                  <div className="text-center">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded mb-6"></div>
                    <div className="space-y-3 mb-8">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              plans.map((plan, index) => (
                <div
                  key={plan.id || index}
                  className={`relative bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 ${
                    plan.popular || plan.name === 'Professional' ? 'ring-2 ring-indigo-600' : ''
                  }`}
                >
                  {(plan.popular || plan.name === 'Professional') && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">
                        ${typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}
                      </span>
                      <span className="text-gray-600">
                        /{plan.duration_days ? `${plan.duration_days}d` : 'month'}
                      </span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {(plan.features || []).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <HiCheck className="h-5 w-5 text-green-500 mr-3" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link 
                      to="/register" 
                      className={`w-full btn ${plan.name === 'Professional' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to transform your email marketing?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust us with their email campaigns. 
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-white btn-lg flex items-center justify-center">
              <HiLightningBolt className="h-5 w-5 mr-2" />
              Start Free Trial
            </Link>
            <button className="btn btn-outline-white btn-lg flex items-center justify-center">
              <HiSparkles className="h-5 w-5 mr-2" />
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <HiInbox className="h-5 w-5 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold">EmailCampaign</span>
              </div>
              <p className="text-gray-400">
                Powerful email marketing platform for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EmailCampaign. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 